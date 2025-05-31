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
exports.startScheduledJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const transaction_model_2 = require("../models/transaction.model");
const config_1 = __importDefault(require("../config/config"));
const email_service_1 = require("./email.service");
// Run daily at midnight
const startScheduledJobs = () => {
    console.log('Starting scheduled jobs...');
    // Schedule daily fraud scan at midnight
    node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('Running daily fraud scan...');
        yield runDailyFraudScan();
    }));
    console.log('Scheduled jobs started successfully');
};
exports.startScheduledJobs = startScheduledJobs;
// Daily fraud scan job
const runDailyFraudScan = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Find large transactions from yesterday
        const largeTransactions = yield transaction_model_1.default.find({
            createdAt: { $gte: yesterday, $lt: today },
            amount: { $gte: config_1.default.fraudDetection.largeTransactionThreshold },
            isDeleted: false
        }).populate('userId', 'username email');
        // Find users with multiple transfers
        const users = yield user_model_1.default.find({ isDeleted: false });
        const suspiciousUsers = [];
        for (const user of users) {
            const transferCount = yield transaction_model_1.default.countDocuments({
                userId: user._id,
                type: transaction_model_2.TransactionType.TRANSFER,
                createdAt: { $gte: yesterday, $lt: today },
                isDeleted: false
            });
            if (transferCount >= config_1.default.fraudDetection.maxTransfersPerHour) {
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
                    yield transaction_model_1.default.findByIdAndUpdate(transaction._id, {
                        isFlagged: true,
                        flagReason: `Large transaction of ${transaction.amount} ${transaction.currency} detected in daily scan`
                    });
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
                    user: t.userId ? t.userId.username : 'Unknown',
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
            yield (0, email_service_1.sendEmailAlert)('admin@digiwallet.com', 'DigiWallet Daily Fraud Scan Report', `Found ${largeTransactions.length} large transactions and ${suspiciousUsers.length} suspicious users.`);
        }
        return;
    }
    catch (error) {
        console.error('Error running daily fraud scan:', error);
    }
});
