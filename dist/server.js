"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const database_1 = __importDefault(require("./config/database"));
const config_1 = __importDefault(require("./config/config"));
const swagger_1 = require("./utils/swagger");
const scheduler_service_1 = require("./services/scheduler.service");
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Initialize express app
const app = (0, express_1.default)();
// Connect to MongoDB
(0, database_1.default)();
// Create admin user for testing
const user_model_1 = __importDefault(require("./models/user.model"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Try to find admin by email first
        const existingAdmin = yield user_model_1.default.findOne({ email: 'admin@example.com' });
        if (!existingAdmin) {
            // Try with a different username to avoid conflicts
            const hashedPassword = yield bcrypt_1.default.hash('adminpassword', 10);
            yield user_model_1.default.create({
                username: 'adminuser',
                email: 'admin@example.com',
                password: 'adminpassword', // Store plain password for testing
                isAdmin: true,
                balance: { USD: 1000 }
            });
            console.log('Admin user created successfully');
        }
        else {
            // Update the existing admin's password for testing
            existingAdmin.password = 'adminpassword';
            yield existingAdmin.save();
            console.log('Admin user password updated');
        }
    }
    catch (error) {
        console.error('Error creating/updating admin user:', error);
    }
});
createAdminUser();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Setup Swagger documentation
(0, swagger_1.setupSwagger)(app);
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/wallet', wallet_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// API documentation route
app.get('/api/docs', (req, res) => {
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
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to DigiWallet API',
        documentation: '/api/docs',
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// 404 middleware
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
// Start server
const PORT = config_1.default.port;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start scheduled jobs (daily fraud scan)
    (0, scheduler_service_1.startScheduledJobs)();
});
// Schedule daily fraud scan (commented out for now, would use a proper scheduler in production)
// import cron from 'node-cron';
// import { runDailyFraudScan } from './services/fraud.service';
// cron.schedule('0 0 * * *', async () => {
//   console.log('Running daily fraud scan...');
//   await runDailyFraudScan();
// });
exports.default = app;
