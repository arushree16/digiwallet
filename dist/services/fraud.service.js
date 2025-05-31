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
exports.getFlaggedTransactions = exports.runDailyFraudScan = exports.checkForFraudulentActivity = void 0;
const transaction_model_1 = require("../models/transaction.model");
const transaction_model_2 = __importDefault(require("../models/transaction.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const config_1 = __importDefault(require("../config/config"));
const email_service_1 = require("./email.service");
// Check for fraudulent activity
const checkForFraudulentActivity = (userId, transactionType, amount, currency) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = {
            isFlagged: false
        };
        // Check for large transaction
        if (amount >= config_1.default.fraudDetection.largeTransactionThreshold) {
            result.isFlagged = true;
            result.reason = `Large transaction of ${amount} ${currency} detected`;
            // Send email alert for large transaction
            try {
                const user = yield user_model_1.default.findById(userId);
                if (user && user.email) {
                    yield (0, email_service_1.sendTransactionAlert)(user.email, transactionType.toLowerCase(), amount, currency, true);
                    console.log(`Sent large transaction alert to ${user.email}`);
                }
            }
            catch (emailError) {
                console.error('Failed to send email alert:', emailError);
            }
        }
        // Check for multiple transfers in a short period (rate limiting)
        if (transactionType === transaction_model_1.TransactionType.TRANSFER) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentTransfers = yield transaction_model_2.default.countDocuments({
                userId,
                type: transaction_model_1.TransactionType.TRANSFER,
                createdAt: { $gte: oneHourAgo }
            });
            if (recentTransfers >= config_1.default.fraudDetection.maxTransfersPerHour) {
                result.isFlagged = true;
                result.reason = `Rate limit exceeded: ${recentTransfers} transfers in the last hour`;
            }
        }
        // Check for suspicious withdrawal (large percentage of balance)
        if (transactionType === transaction_model_1.TransactionType.WITHDRAWAL) {
            const user = yield user_model_1.default.findById(userId);
            if (user) {
                const currentBalance = Number(user.balance.get(currency) || 0);
                // If withdrawal is more than X% of total balance, flag it
                if (currentBalance > 0 && Number(amount) / currentBalance >= config_1.default.fraudDetection.suspiciousWithdrawalThreshold) {
                    result.isFlagged = true;
                    result.reason = `Suspicious withdrawal: ${Math.round((amount / currentBalance) * 100)}% of total balance`;
                }
            }
        }
        return result;
    }
    catch (error) {
        console.error('Fraud detection error:', error);
        return { isFlagged: false };
    }
});
exports.checkForFraudulentActivity = checkForFraudulentActivity;
// Run a daily fraud scan (to be called by a scheduled job)
const runDailyFraudScan = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        // Find all transactions from the last 24 hours
        const transactions = yield transaction_model_2.default.find({
            createdAt: { $gte: yesterday },
            isFlagged: false // Only check non-flagged transactions
        });
        let flaggedCount = 0;
        // Additional checks that might be more intensive and not suitable for real-time
        for (const transaction of transactions) {
            // Check for unusual patterns
            const userTransactionCount = yield transaction_model_2.default.countDocuments({
                userId: transaction.userId,
                createdAt: { $gte: yesterday }
            });
            // Flag users with unusually high transaction counts
            if (userTransactionCount > 20) { // Arbitrary threshold for demonstration
                yield transaction_model_2.default.updateMany({ userId: transaction.userId, createdAt: { $gte: yesterday } }, {
                    isFlagged: true,
                    flagReason: `Unusual activity: ${userTransactionCount} transactions in 24 hours`
                });
                flaggedCount += userTransactionCount;
            }
        }
        console.log(`Daily fraud scan completed. Flagged ${flaggedCount} transactions.`);
    }
    catch (error) {
        console.error('Daily fraud scan error:', error);
    }
});
exports.runDailyFraudScan = runDailyFraudScan;
// Get all flagged transactions (for admin reporting)
const getFlaggedTransactions = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (page = 1, limit = 10) {
    try {
        const skip = (page - 1) * limit;
        const flaggedTransactions = yield transaction_model_2.default.find({ isFlagged: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userId', 'username email')
            .populate('recipientId', 'username email');
        const total = yield transaction_model_2.default.countDocuments({ isFlagged: true });
        return {
            transactions: flaggedTransactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    catch (error) {
        console.error('Error fetching flagged transactions:', error);
        throw error;
    }
});
exports.getFlaggedTransactions = getFlaggedTransactions;
