import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/user.model';
import Transaction, { TransactionType, TransactionStatus } from '../models/transaction.model';

// Import fraud service with correct path
import { checkForFraudulentActivity } from '../services/fraud.service';

// Deposit funds to user's wallet
export const deposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'USD' } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount,
      currency,
      status: TransactionStatus.COMPLETED,
      description: `Deposit of ${amount} ${currency}`,
    });

    // Check for fraudulent activity
    const isFraudulent = await checkForFraudulentActivity(userId, TransactionType.DEPOSIT, amount, currency);
    
    if (isFraudulent.isFlagged) {
      // Update transaction with flag
      await Transaction.findByIdAndUpdate(
        transaction._id,
        { 
          isFlagged: true,
          flagReason: isFraudulent.reason
        }
      );
    }

    // Update user balance
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Initialize balance for currency if it doesn't exist
    const currentBalance = user.balance.get(currency) || 0;
    const numericAmount = parseFloat(amount.toString());
    user.balance.set(currency, currentBalance + numericAmount);
    await user.save();

    res.status(200).json({
      message: 'Deposit successful',
      transaction: transaction,
      newBalance: {
        [currency]: user.balance.get(currency)
      }
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error during deposit' });
  }
};

// Withdraw funds from user's wallet
export const withdraw = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'USD' } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
      return;
    }

    // Get user and check balance
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const currentBalance = user.balance.get(currency) || 0;
    const numericAmount = parseFloat(amount.toString());
    
    // Check if user has sufficient balance
    if (currentBalance < numericAmount) {
      res.status(400).json({ 
        message: 'Insufficient balance',
        currentBalance,
        requestedAmount: numericAmount
      });
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      type: TransactionType.WITHDRAWAL,
      amount: numericAmount,
      currency,
      status: TransactionStatus.COMPLETED,
      description: `Withdrawal of ${numericAmount} ${currency}`,
    });

    // Check for fraudulent activity
    const isFraudulent = await checkForFraudulentActivity(userId, TransactionType.WITHDRAWAL, numericAmount, currency);
    
    if (isFraudulent.isFlagged) {
      // Update transaction with flag
      await Transaction.findByIdAndUpdate(
        transaction._id,
        { 
          isFlagged: true,
          flagReason: isFraudulent.reason
        }
      );
    }

    // Update user balance
    user.balance.set(currency, currentBalance - numericAmount);
    await user.save();

    res.status(200).json({
      message: 'Withdrawal successful',
      transaction: transaction,
      newBalance: {
        [currency]: user.balance.get(currency)
      }
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error during withdrawal' });
  }
};

// Transfer funds to another user
export const transfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId, amount, currency = 'USD', description } = req.body;
    const senderId = req.user._id;

    console.log('Transfer request:', { recipientId, amount, currency, description, senderId });

    // Validate amount
    if (!amount || amount <= 0) {
      res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
      return;
    }

    // Validate recipient
    if (!recipientId || recipientId === senderId.toString()) {
      res.status(400).json({ message: 'Invalid recipient' });
      return;
    }

    console.log('Looking for recipient with identifier:', recipientId);

    // Check if recipient exists - try to find by ID, email, or username
    let recipient;
    
    // First try to find by MongoDB ID
    try {
      if (mongoose.Types.ObjectId.isValid(recipientId)) {
        recipient = await User.findById(recipientId);
        console.log('Lookup by ID result:', recipient ? 'Found' : 'Not found');
      } else {
        console.log('Not a valid MongoDB ID, skipping ID lookup');
      }
    } catch (error) {
      console.error('Error looking up by ID:', error);
    }
    
    // If not found, try to find by email
    if (!recipient) {
      recipient = await User.findOne({ email: recipientId, isDeleted: false });
      console.log('Lookup by email result:', recipient ? 'Found' : 'Not found');
    }
    
    // If still not found, try to find by username
    if (!recipient) {
      recipient = await User.findOne({ username: recipientId, isDeleted: false });
      console.log('Lookup by username result:', recipient ? 'Found' : 'Not found');
    }
    
    if (!recipient || recipient.isDeleted) {
      console.log('Recipient not found with any method');
      res.status(404).json({ message: 'Recipient not found. Please check the ID, email, or username.' });
      return;
    }
    
    console.log('Recipient found:', { id: recipient._id, username: recipient.username });

    // Check sender's balance
    const sender = await User.findById(senderId);
    if (!sender) {
      res.status(404).json({ message: 'Sender not found' });
      return;
    }

    const senderBalance = sender.balance.get(currency) || 0;
    const numericAmount = parseFloat(amount.toString());
    
    // Check if sender has sufficient balance
    if (senderBalance < numericAmount) {
      res.status(400).json({ 
        message: 'Insufficient balance',
        currentBalance: senderBalance,
        requestedAmount: numericAmount
      });
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId: senderId,
      type: TransactionType.TRANSFER,
      amount: numericAmount,
      currency,
      recipientId: recipient._id, // Use the recipient's MongoDB ID instead of the email/username
      status: TransactionStatus.COMPLETED,
      description: description || `Transfer to ${recipient.username}`,
    });

    // Check for fraudulent activity
    const isFraudulent = await checkForFraudulentActivity(senderId, TransactionType.TRANSFER, numericAmount, currency);
    
    if (isFraudulent.isFlagged) {
      // Update transaction with flag
      await Transaction.findByIdAndUpdate(
        transaction._id,
        { 
          isFlagged: true,
          flagReason: isFraudulent.reason
        }
      );
    }

    // Update sender's balance
    sender.balance.set(currency, senderBalance - numericAmount);
    await sender.save();

    // Update recipient's balance
    const recipientBalance = recipient.balance.get(currency) || 0;
    recipient.balance.set(currency, recipientBalance + numericAmount);
    await recipient.save();

    res.status(200).json({
      message: 'Transfer successful',
      transaction: transaction,
      newBalance: {
        [currency]: sender.balance.get(currency)
      }
    });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ message: 'Server error during transfer' });
  }
};

// Get transaction history for the user
export const getTransactionHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, type } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { 
      $or: [
        { userId },
        { recipientId: userId }
      ],
      isDeleted: false
    };

    // Filter by transaction type if provided
    if (type && Object.values(TransactionType).includes(type as TransactionType)) {
      query.type = type;
    }

    // Get transactions
    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('recipientId', 'username email');

    // Get total count
    const total = await Transaction.countDocuments(query);

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
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction history' });
  }
};

// Get user balance
export const getBalance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const { currency } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (currency) {
      // Return specific currency balance
      const balance = Number(user.balance.get(currency as string) || 0);
      res.status(200).json({
        balance: {
          [currency as string]: balance
        }
      });
    } else {
      // Return all balances
      res.status(200).json({
        balance: Object.fromEntries(user.balance.entries())
      });
    }
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ message: 'Server error while fetching balance' });
  }
};
