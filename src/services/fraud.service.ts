import { TransactionType } from '../models/transaction.model';
import Transaction from '../models/transaction.model';
import User from '../models/user.model';
import config from '../config/config';
import { sendTransactionAlert } from './email.service';

interface FraudCheckResult {
  isFlagged: boolean;
  reason?: string;
}

// Check for fraudulent activity
export const checkForFraudulentActivity = async (
  userId: string,
  transactionType: TransactionType,
  amount: number,
  currency: string
): Promise<FraudCheckResult> => {
  try {
    const result: FraudCheckResult = {
      isFlagged: false
    };

    // Check for large transaction
    if (amount >= config.fraudDetection.largeTransactionThreshold) {
      result.isFlagged = true;
      result.reason = `Large transaction of ${amount} ${currency} detected`;
      
      // Send email alert for large transaction
      try {
        const user = await User.findById(userId);
        if (user && user.email) {
          await sendTransactionAlert(
            user.email,
            transactionType.toLowerCase(),
            amount,
            currency,
            true
          );
          console.log(`Sent large transaction alert to ${user.email}`);
        }
      } catch (emailError) {
        console.error('Failed to send email alert:', emailError);
      }
    }

    // Check for multiple transfers in a short period (rate limiting)
    if (transactionType === TransactionType.TRANSFER) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const recentTransfers = await Transaction.countDocuments({
        userId,
        type: TransactionType.TRANSFER,
        createdAt: { $gte: oneHourAgo }
      });

      if (recentTransfers >= config.fraudDetection.maxTransfersPerHour) {
        result.isFlagged = true;
        result.reason = `Rate limit exceeded: ${recentTransfers} transfers in the last hour`;
      }
    }

    // Check for suspicious withdrawal (large percentage of balance)
    if (transactionType === TransactionType.WITHDRAWAL) {
      const user = await User.findById(userId);
      if (user) {
        const currentBalance = Number(user.balance.get(currency) || 0);
        
        // If withdrawal is more than X% of total balance, flag it
        if (currentBalance > 0 && Number(amount) / currentBalance >= config.fraudDetection.suspiciousWithdrawalThreshold) {
          result.isFlagged = true;
          result.reason = `Suspicious withdrawal: ${Math.round((amount / currentBalance) * 100)}% of total balance`;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Fraud detection error:', error);
    return { isFlagged: false };
  }
};

// Run a daily fraud scan (to be called by a scheduled job)
export const runDailyFraudScan = async (): Promise<void> => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find all transactions from the last 24 hours
    const transactions = await Transaction.find({
      createdAt: { $gte: yesterday },
      isFlagged: false // Only check non-flagged transactions
    });

    let flaggedCount = 0;

    // Additional checks that might be more intensive and not suitable for real-time
    for (const transaction of transactions) {
      // Check for unusual patterns
      const userTransactionCount = await Transaction.countDocuments({
        userId: transaction.userId,
        createdAt: { $gte: yesterday }
      });

      // Flag users with unusually high transaction counts
      if (userTransactionCount > 20) { // Arbitrary threshold for demonstration
        await Transaction.updateMany(
          { userId: transaction.userId, createdAt: { $gte: yesterday } },
          { 
            isFlagged: true,
            flagReason: `Unusual activity: ${userTransactionCount} transactions in 24 hours`
          }
        );
        flaggedCount += userTransactionCount;
      }
    }

    console.log(`Daily fraud scan completed. Flagged ${flaggedCount} transactions.`);
  } catch (error) {
    console.error('Daily fraud scan error:', error);
  }
};

// Get all flagged transactions (for admin reporting)
export const getFlaggedTransactions = async (page = 1, limit = 10) => {
  try {
    const skip = (page - 1) * limit;
    
    const flaggedTransactions = await Transaction.find({ isFlagged: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email')
      .populate('recipientId', 'username email');
    
    const total = await Transaction.countDocuments({ isFlagged: true });
    
    return {
      transactions: flaggedTransactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error fetching flagged transactions:', error);
    throw error;
  }
};
