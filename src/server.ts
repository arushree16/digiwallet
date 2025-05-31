import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/database';
import config from './config/config';
import { setupSwagger } from './utils/swagger';
import { startScheduledJobs } from './services/scheduler.service';

// Import routes
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import adminRoutes from './routes/admin.routes';

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Create admin user for testing
import User from './models/user.model';
import bcrypt from 'bcrypt';

const createAdminUser = async () => {
  try {
    // Try to find admin by email first
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (!existingAdmin) {
      // Try with a different username to avoid conflicts
      const hashedPassword = await bcrypt.hash('adminpassword', 10);
      await User.create({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'adminpassword', // Store plain password for testing
        isAdmin: true,
        balance: { USD: 1000 }
      });
      console.log('Admin user created successfully');
    } else {
      // Update the existing admin's password for testing
      existingAdmin.password = 'adminpassword';
      await existingAdmin.save();
      console.log('Admin user password updated');
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
};

createAdminUser();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Swagger documentation
setupSwagger(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// API documentation route
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    message: 'Digital Wallet API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      wallet: {
        deposit: 'POST /api/wallet/deposit',
        withdraw: 'POST /api/wallet/withdraw',
        transfer: 'POST /api/wallet/transfer',
        transactions: 'GET /api/wallet/transactions',
        balance: 'GET /api/wallet/balance',
      },
      admin: {
        users: 'GET /api/admin/users',
        flaggedTransactions: 'GET /api/admin/transactions/flagged',
        runFraudScan: 'POST /api/admin/fraud-scan/run',
        totalBalance: 'GET /api/admin/balance/total',
        topUsersByBalance: 'GET /api/admin/users/top-by-balance',
        topUsersByVolume: 'GET /api/admin/users/top-by-volume',
      },
    },
  });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to DigiWallet API',
    documentation: '/api/docs',
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 middleware
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start scheduled jobs (daily fraud scan)
  startScheduledJobs();
});

// Schedule daily fraud scan (commented out for now, would use a proper scheduler in production)
// import cron from 'node-cron';
// import { runDailyFraudScan } from './services/fraud.service';
// cron.schedule('0 0 * * *', async () => {
//   console.log('Running daily fraud scan...');
//   await runDailyFraudScan();
// });

export default app;
