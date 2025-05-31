import express from 'express';
import { 
  getAllUsers,
  getFlaggedTransactionsHandler,
  getTotalBalance,
  getTopUsersByBalance,
  getTopUsersByTransactionVolume,
  runFraudScan,
  softDeleteUser,
  restoreUser,
  softDeleteTransaction,
  restoreTransaction,
  getSoftDeletedUsers,
  getSoftDeletedTransactions
} from '../controllers/admin.controller';
import { authenticate, isAdmin } from '../middlewares/auth.middleware';

const router = express.Router();

// All admin routes require authentication and admin privileges
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.use('/', authenticate as any);
router.use('/', isAdmin as any);

// User management
router.get('/users', getAllUsers);
router.get('/users/deleted', getSoftDeletedUsers);
router.delete('/users/:userId/soft', softDeleteUser);
router.post('/users/:userId/restore', restoreUser);

// Fraud detection and reporting
router.get('/transactions/flagged', getFlaggedTransactionsHandler);
router.get('/transactions/deleted', getSoftDeletedTransactions);
router.delete('/transactions/:transactionId/soft', softDeleteTransaction);
router.post('/transactions/:transactionId/restore', restoreTransaction);
router.post('/fraud-scan/run', runFraudScan);

// Analytics and reporting
router.get('/balance/total', getTotalBalance);
router.get('/users/top-by-balance', getTopUsersByBalance);
router.get('/users/top-by-volume', getTopUsersByTransactionVolume);

export default router;
