import cron from 'node-cron';
import Transaction from '../models/transaction.model';
import User from '../models/user.model';
import { TransactionType } from '../models/transaction.model';
import config from '../config/config';
import { sendEmailAlert } from './email.service';

// Run daily at midnight
export const startScheduledJobs = (): void => {
  console.log('Starting scheduled jobs...');
  
  // Schedule daily fraud scan at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily fraud scan...');
    await runDailyFraudScan();
  });
  
  console.log('Scheduled jobs started successfully');
};

// Daily fraud scan job
const runDailyFraudScan = async (): Promise<void> => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find large transactions from yesterday
    const largeTransactions = await Transaction.find({
      createdAt: { $gte: yesterday, $lt: today },
      amount: { $gte: config.fraudDetection.largeTransactionThreshold },
      isDeleted: false
    }).populate('userId', 'username email');
    
    // Find users with multiple transfers
    const users = await User.find({ isDeleted: false });
    const suspiciousUsers = [];
    
    for (const user of users) {
      const transferCount = await Transaction.countDocuments({
        userId: user._id,
        type: TransactionType.TRANSFER,
        createdAt: { $gte: yesterday, $lt: today },
        isDeleted: false
      });
      
      if (transferCount >= config.fraudDetection.maxTransfersPerHour) {
        suspiciousUsers.push({
          user,
          transferCount
        });
      }
    }
    
    // Flag suspicious transactions
    if (largeTransactions.length > 0) {
      for (const transaction of largeTransactions) {
        if (!transaction.isFlagged) {
          await Transaction.findByIdAndUpdate(
            transaction._id,
            {
              isFlagged: true,
              flagReason: `Large transaction of ${transaction.amount} ${transaction.currency} detected in daily scan`
            }
          );
        }
      }
    }
    
    // Generate report
    const report = {
      date: new Date().toISOString().split('T')[0],
      largeTransactions: largeTransactions.length,
      suspiciousUsers: suspiciousUsers.length,
      details: {
        largeTransactions: largeTransactions.map(t => ({
          id: t._id,
          user: t.userId ? (t.userId as any).username : 'Unknown',
          amount: t.amount,
          currency: t.currency,
          type: t.type,
          createdAt: t.createdAt
        })),
        suspiciousUsers: suspiciousUsers.map(su => ({
          id: su.user._id,
          username: su.user.username,
          email: su.user.email,
          transferCount: su.transferCount
        }))
      }
    };
    
    console.log('Daily fraud scan completed:', JSON.stringify(report, null, 2));
    
    // Send email alert to admin (mocked)
    if (largeTransactions.length > 0 || suspiciousUsers.length > 0) {
      await sendEmailAlert(
        'admin@digiwallet.com',
        'DigiWallet Daily Fraud Scan Report',
        `Found ${largeTransactions.length} large transactions and ${suspiciousUsers.length} suspicious users.`
      );
    }
    
    return;
  } catch (error) {
    console.error('Error running daily fraud scan:', error);
  }
};
