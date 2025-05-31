import { Request, Response } from 'express';
import User from '../models/user.model';
import Transaction from '../models/transaction.model';
import { getFlaggedTransactions, runDailyFraudScan } from '../services/fraud.service';
import mongoose from 'mongoose';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find({ isDeleted: false })
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments({ isDeleted: false });

    res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Get flagged transactions (admin only)
export const getFlaggedTransactionsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    const result = await getFlaggedTransactions(pageNum, limitNum);

    res.status(200).json(result);
  } catch (error) {
    console.error('Get flagged transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching flagged transactions' });
  }
};

// Get total balance across all users (admin only)
export const getTotalBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currency = 'USD' } = req.query;
    
    const users = await User.find({ isDeleted: false });
    
    let totalBalance = 0;
    
    users.forEach(user => {
      const balance = user.balance.get(currency as string) || 0;
      totalBalance += balance;
    });

    res.status(200).json({
      currency,
      totalBalance,
      userCount: users.length,
    });
  } catch (error) {
    console.error('Get total balance error:', error);
    res.status(500).json({ message: 'Server error while calculating total balance' });
  }
};

// Get top users by balance (admin only)
export const getTopUsersByBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, currency = 'USD' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const users = await User.find({ isDeleted: false })
      .select('-password');
    
    // Filter and sort users by balance for the specified currency
    const usersWithBalance = users
      .map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        balance: user.balance.get(currency as string) || 0,
        createdAt: user.createdAt,
      }))
      .sort((a, b) => b.balance - a.balance)
      .slice(0, limitNum);

    res.status(200).json({
      currency,
      users: usersWithBalance,
    });
  } catch (error) {
    console.error('Get top users error:', error);
    res.status(500).json({ message: 'Server error while fetching top users' });
  }
};

// Get top users by transaction volume (admin only)
export const getTopUsersByTransactionVolume = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10, days = 30 } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const daysNum = parseInt(days as string, 10);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Aggregate transactions by user
    const transactionVolume = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$userId',
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { totalTransactions: -1 },
      },
      {
        $limit: limitNum,
      },
    ]);

    // Get user details
    const userIds = transactionVolume.map(item => item._id);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username email');

    // Map user details to transaction volume
    const result = transactionVolume.map(item => {
      const user = users.find(u => u._id.toString() === item._id.toString());
      return {
        userId: item._id,
        username: user?.username,
        email: user?.email,
        totalTransactions: item.totalTransactions,
        totalAmount: item.totalAmount,
      };
    });

    res.status(200).json({
      timeframe: `Last ${daysNum} days`,
      users: result,
    });
  } catch (error) {
    console.error('Get top users by volume error:', error);
    res.status(500).json({ message: 'Server error while fetching top users by volume' });
  }
};

// Run daily fraud scan manually (admin only)
export const runFraudScan = async (req: Request, res: Response): Promise<void> => {
  try {
    await runDailyFraudScan();
    res.status(200).json({ message: 'Fraud scan completed successfully' });
  } catch (error) {
    console.error('Run fraud scan error:', error);
    res.status(500).json({ message: 'Server error while running fraud scan' });
  }
};

// Soft delete a user (admin only)
export const softDeleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isDeleted) {
      res.status(400).json({ message: 'User is already soft deleted' });
      return;
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({ message: 'User soft deleted successfully' });
  } catch (error) {
    console.error('Soft delete user error:', error);
    res.status(500).json({ message: 'Server error while soft deleting user' });
  }
};

// Restore a soft deleted user (admin only)
export const restoreUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'Invalid user ID' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.isDeleted) {
      res.status(400).json({ message: 'User is not soft deleted' });
      return;
    }

    // Restore the user
    user.isDeleted = false;
    user.deletedAt = undefined;
    await user.save();

    res.status(200).json({ message: 'User restored successfully' });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({ message: 'Server error while restoring user' });
  }
};

// Soft delete a transaction (admin only)
export const softDeleteTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (transaction.isDeleted) {
      res.status(400).json({ message: 'Transaction is already soft deleted' });
      return;
    }

    // Soft delete the transaction
    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res.status(200).json({ message: 'Transaction soft deleted successfully' });
  } catch (error) {
    console.error('Soft delete transaction error:', error);
    res.status(500).json({ message: 'Server error while soft deleting transaction' });
  }
};

// Restore a soft deleted transaction (admin only)
export const restoreTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      res.status(400).json({ message: 'Invalid transaction ID' });
      return;
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }

    if (!transaction.isDeleted) {
      res.status(400).json({ message: 'Transaction is not soft deleted' });
      return;
    }

    // Restore the transaction
    transaction.isDeleted = false;
    transaction.deletedAt = undefined;
    await transaction.save();

    res.status(200).json({ message: 'Transaction restored successfully' });
  } catch (error) {
    console.error('Restore transaction error:', error);
    res.status(500).json({ message: 'Server error while restoring transaction' });
  }
};

// Get soft deleted users (admin only)
export const getSoftDeletedUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find({ isDeleted: true })
      .select('-password')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments({ isDeleted: true });

    res.status(200).json({
      users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get soft deleted users error:', error);
    res.status(500).json({ message: 'Server error while fetching soft deleted users' });
  }
};

// Get soft deleted transactions (admin only)
export const getSoftDeletedTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find({ isDeleted: true })
      .populate('userId', 'username email')
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments({ isDeleted: true });

    res.status(200).json({
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get soft deleted transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching soft deleted transactions' });
  }
};
