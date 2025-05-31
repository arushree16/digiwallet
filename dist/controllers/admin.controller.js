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
exports.getSoftDeletedTransactions = exports.getSoftDeletedUsers = exports.restoreTransaction = exports.softDeleteTransaction = exports.restoreUser = exports.softDeleteUser = exports.runFraudScan = exports.getTopUsersByTransactionVolume = exports.getTopUsersByBalance = exports.getTotalBalance = exports.getFlaggedTransactionsHandler = exports.getAllUsers = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const transaction_model_1 = __importDefault(require("../models/transaction.model"));
const fraud_service_1 = require("../services/fraud.service");
const mongoose_1 = __importDefault(require("mongoose"));
// Get all users (admin only)
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const users = yield user_model_1.default.find({ isDeleted: false })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield user_model_1.default.countDocuments({ isDeleted: false });
        res.status(200).json({
            users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ message: 'Server error while fetching users' });
    }
});
exports.getAllUsers = getAllUsers;
// Get flagged transactions (admin only)
const getFlaggedTransactionsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const result = yield (0, fraud_service_1.getFlaggedTransactions)(pageNum, limitNum);
        res.status(200).json(result);
    }
    catch (error) {
        console.error('Get flagged transactions error:', error);
        res.status(500).json({ message: 'Server error while fetching flagged transactions' });
    }
});
exports.getFlaggedTransactionsHandler = getFlaggedTransactionsHandler;
// Get total balance across all users (admin only)
const getTotalBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { currency = 'USD' } = req.query;
        const users = yield user_model_1.default.find({ isDeleted: false });
        let totalBalance = 0;
        users.forEach(user => {
            const balance = user.balance.get(currency) || 0;
            totalBalance += balance;
        });
        res.status(200).json({
            currency,
            totalBalance,
            userCount: users.length,
        });
    }
    catch (error) {
        console.error('Get total balance error:', error);
        res.status(500).json({ message: 'Server error while calculating total balance' });
    }
});
exports.getTotalBalance = getTotalBalance;
// Get top users by balance (admin only)
const getTopUsersByBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = 10, currency = 'USD' } = req.query;
        const limitNum = parseInt(limit, 10);
        const users = yield user_model_1.default.find({ isDeleted: false })
            .select('-password');
        // Filter and sort users by balance for the specified currency
        const usersWithBalance = users
            .map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            balance: user.balance.get(currency) || 0,
            createdAt: user.createdAt,
        }))
            .sort((a, b) => b.balance - a.balance)
            .slice(0, limitNum);
        res.status(200).json({
            currency,
            users: usersWithBalance,
        });
    }
    catch (error) {
        console.error('Get top users error:', error);
        res.status(500).json({ message: 'Server error while fetching top users' });
    }
});
exports.getTopUsersByBalance = getTopUsersByBalance;
// Get top users by transaction volume (admin only)
const getTopUsersByTransactionVolume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = 10, days = 30 } = req.query;
        const limitNum = parseInt(limit, 10);
        const daysNum = parseInt(days, 10);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysNum);
        // Aggregate transactions by user
        const transactionVolume = yield transaction_model_1.default.aggregate([
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
        const users = yield user_model_1.default.find({ _id: { $in: userIds } })
            .select('username email');
        // Map user details to transaction volume
        const result = transactionVolume.map(item => {
            const user = users.find(u => u._id.toString() === item._id.toString());
            return {
                userId: item._id,
                username: user === null || user === void 0 ? void 0 : user.username,
                email: user === null || user === void 0 ? void 0 : user.email,
                totalTransactions: item.totalTransactions,
                totalAmount: item.totalAmount,
            };
        });
        res.status(200).json({
            timeframe: `Last ${daysNum} days`,
            users: result,
        });
    }
    catch (error) {
        console.error('Get top users by volume error:', error);
        res.status(500).json({ message: 'Server error while fetching top users by volume' });
    }
});
exports.getTopUsersByTransactionVolume = getTopUsersByTransactionVolume;
// Run daily fraud scan manually (admin only)
const runFraudScan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, fraud_service_1.runDailyFraudScan)();
        res.status(200).json({ message: 'Fraud scan completed successfully' });
    }
    catch (error) {
        console.error('Run fraud scan error:', error);
        res.status(500).json({ message: 'Server error while running fraud scan' });
    }
});
exports.runFraudScan = runFraudScan;
// Soft delete a user (admin only)
const softDeleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
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
        yield user.save();
        res.status(200).json({ message: 'User soft deleted successfully' });
    }
    catch (error) {
        console.error('Soft delete user error:', error);
        res.status(500).json({ message: 'Server error while soft deleting user' });
    }
});
exports.softDeleteUser = softDeleteUser;
// Restore a soft deleted user (admin only)
const restoreUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
            res.status(400).json({ message: 'Invalid user ID' });
            return;
        }
        const user = yield user_model_1.default.findById(userId);
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
        yield user.save();
        res.status(200).json({ message: 'User restored successfully' });
    }
    catch (error) {
        console.error('Restore user error:', error);
        res.status(500).json({ message: 'Server error while restoring user' });
    }
});
exports.restoreUser = restoreUser;
// Soft delete a transaction (admin only)
const softDeleteTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transactionId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
            res.status(400).json({ message: 'Invalid transaction ID' });
            return;
        }
        const transaction = yield transaction_model_1.default.findById(transactionId);
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
        yield transaction.save();
        res.status(200).json({ message: 'Transaction soft deleted successfully' });
    }
    catch (error) {
        console.error('Soft delete transaction error:', error);
        res.status(500).json({ message: 'Server error while soft deleting transaction' });
    }
});
exports.softDeleteTransaction = softDeleteTransaction;
// Restore a soft deleted transaction (admin only)
const restoreTransaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { transactionId } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(transactionId)) {
            res.status(400).json({ message: 'Invalid transaction ID' });
            return;
        }
        const transaction = yield transaction_model_1.default.findById(transactionId);
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
        yield transaction.save();
        res.status(200).json({ message: 'Transaction restored successfully' });
    }
    catch (error) {
        console.error('Restore transaction error:', error);
        res.status(500).json({ message: 'Server error while restoring transaction' });
    }
});
exports.restoreTransaction = restoreTransaction;
// Get soft deleted users (admin only)
const getSoftDeletedUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const users = yield user_model_1.default.find({ isDeleted: true })
            .select('-password')
            .sort({ deletedAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield user_model_1.default.countDocuments({ isDeleted: true });
        res.status(200).json({
            users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get soft deleted users error:', error);
        res.status(500).json({ message: 'Server error while fetching soft deleted users' });
    }
});
exports.getSoftDeletedUsers = getSoftDeletedUsers;
// Get soft deleted transactions (admin only)
const getSoftDeletedTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const transactions = yield transaction_model_1.default.find({ isDeleted: true })
            .populate('userId', 'username email')
            .sort({ deletedAt: -1 })
            .skip(skip)
            .limit(limitNum);
        const total = yield transaction_model_1.default.countDocuments({ isDeleted: true });
        res.status(200).json({
            transactions,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error('Get soft deleted transactions error:', error);
        res.status(500).json({ message: 'Server error while fetching soft deleted transactions' });
    }
});
exports.getSoftDeletedTransactions = getSoftDeletedTransactions;
