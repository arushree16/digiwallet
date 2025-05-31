import express from 'express';
import { 
  deposit, 
  withdraw, 
  transfer, 
  getTransactionHistory,
  getBalance
} from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// All wallet routes require authentication
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.use('/', authenticate as any);

// Wallet operations
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.post('/transfer', transfer);

// Transaction history
router.get('/transactions', getTransactionHistory);

// Balance
router.get('/balance', getBalance);

export default router;
