"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getBalance = exports.getTransactionHistory = exports.transfer = exports.withdraw = exports.deposit = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user.model"));
const transaction_model_1 = __importStar(require("../models/transaction.model"));
// Import fraud service with correct path
const fraud_service_1 = require("../services/fraud.service");
// Deposit funds to user's wallet
const deposit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, currency = 'USD' } = req.body;
        const userId = req.user._id;
        // Validate amount
        if (!amount || amount <= 0) {
            res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
            return;
        }
        // Create transaction record
        const transaction = yield transaction_model_1.default.create({
            userId,
            type: transaction_model_1.TransactionType.DEPOSIT,
            amount,
            currency,
            status: transaction_model_1.TransactionStatus.COMPLETED,
            description: `Deposit of ${amount} ${currency}`,
        });
        // Check for fraudulent activity
        const isFraudulent = yield (0, fraud_service_1.checkForFraudulentActivity)(userId, transaction_model_1.TransactionType.DEPOSIT, amount, currency);
        if (isFraudulent.isFlagged) {
            // Update transaction with flag
            yield transaction_model_1.default.findByIdAndUpdate(transaction._id, {
                isFlagged: true,
                flagReason: isFraudulent.reason
            });
        }
        // Update user balance
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Initialize balance for currency if it doesn't exist
        const currentBalance = user.balance.get(currency) || 0;
        const numericAmount = parseFloat(amount.toString());
        user.balance.set(currency, currentBalance + numericAmount);
        yield user.save();
        res.status(200).json({
            message: 'Deposit successful',
            transaction: transaction,
            newBalance: {
                [currency]: user.balance.get(currency)
            }
        });
    }
    catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({ message: 'Server error during deposit' });
    }
});
exports.deposit = deposit;
// Withdraw funds from user's wallet
const withdraw = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, currency = 'USD' } = req.body;
        const userId = req.user._id;
        // Validate amount
        if (!amount || amount <= 0) {
            res.status(400).json({ message: 'Invalid amount. Amount must be greater than 0.' });
            return;
        }
        // Get user and check balance
        const user = yield user_model_1.default.findById(userId);
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
        const transaction = yield transaction_model_1.default.create({
            userId,
            type: transaction_model_1.TransactionType.WITHDRAWAL,
            amount: numericAmount,
            currency,
            status: transaction_model_1.TransactionStatus.COMPLETED,
            description: `Withdrawal of ${numericAmount} ${currency}`,
        });
        // Check for fraudulent activity
        const isFraudulent = yield (0, fraud_service_1.checkForFraudulentActivity)(userId, transaction_model_1.TransactionType.WITHDRAWAL, numericAmount, currency);
        if (isFraudulent.isFlagged) {
            // Update transaction with flag
            yield transaction_model_1.default.findByIdAndUpdate(transaction._id, {
                isFlagged: true,
                flagReason: isFraudulent.reason
            });
        }
        // Update user balance
        user.balance.set(currency, currentBalance - numericAmount);
        yield user.save();
        res.status(200).json({
            message: 'Withdrawal successful',
            transaction: transaction,
            newBalance: {
                [currency]: user.balance.get(currency)
            }
        });
    }
    catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({ message: 'Server error during withdrawal' });
    }
});
exports.withdraw = withdraw;
// Transfer funds to another user
const transfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            if (mongoose_1.default.Types.ObjectId.isValid(recipientId)) {
                recipient = yield user_model_1.default.findById(recipientId);
                console.log('Lookup by ID result:', recipient ? 'Found' : 'Not found');
            }
            else {
                console.log('Not a valid MongoDB ID, skipping ID lookup');
            }
        }
        catch (error) {
            console.error('Error looking up by ID:', error);
        }
        // If not found, try to find by email
        if (!recipient) {
            recipient = yield user_model_1.default.findOne({ email: recipientId, isDeleted: false });
            console.log('Lookup by email result:', recipient ? 'Found' : 'Not found');
        }
        // If still not found, try to find by username
        if (!recipient) {
            recipient = yield user_model_1.default.findOne({ username: recipientId, isDeleted: false });
            console.log('Lookup by username result:', recipient ? 'Found' : 'Not found');
        }
        if (!recipient || recipient.isDeleted) {
            console.log('Recipient not found with any method');
            res.status(404).json({ message: 'Recipient not found. Please check the ID, email, or username.' });
            return;
        }
        console.log('Recipient found:', { id: recipient._id, username: recipient.username });
        // Check sender's balance
        const sender = yield user_model_1.default.findById(senderId);
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
        const transaction = yield transaction_model_1.default.create({
            userId: senderId,
            type: transaction_model_1.TransactionType.TRANSFER,
            amount: numericAmount,
            currency,
            recipientId: recipient._id, // Use the recipient's MongoDB ID instead of the email/username
            status: transaction_model_1.TransactionStatus.COMPLETED,
            description: description || `Transfer to ${recipient.username}`,
        });
        // Check for fraudulent activity
        const isFraudulent = yield (0, fraud_service_1.checkForFraudulentActivity)(senderId, transaction_model_1.TransactionType.TRANSFER, numericAmount, currency);
        if (isFraudulent.isFlagged) {
            // Update transaction with flag
            yield transaction_model_1.default.findByIdAndUpdate(transaction._id, {
                isFlagged: true,
                flagReason: isFraudulent.reason
            });
        }
        // Update sender's balance
        sender.balance.set(currency, senderBalance - numericAmount);
        yield sender.save();
        // Update recipient's balance
        const recipientBalance = recipient.balance.get(currency) || 0;
        recipient.balance.set(currency, recipientBalance + numericAmount);
        yield recipient.save();
        res.status(200).json({
            message: 'Transfer successful',
            transaction: transaction,
            newBalance: {
                [currency]: sender.balance.get(currency)
            }
        });
    }
    catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ message: 'Server error during transfer' });
    }
});
exports.transfer = transfer;
// Get transaction history for the user
const getTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, type } = req.query;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        // Build query
        const query = {
            $or: [
                { userId },
                { recipientId: userId }
            ],
            isDeleted: false
        };
        // Filter by transaction type if provided
        if (type && Object.values(transaction_model_1.TransactionType).includes(type)) {
            query.type = type;
        }
        // Get transactions
        const transactions = yield transaction_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .populate('recipientId', 'username email');
        // Get total count
        const total = yield transaction_model_1.default.countDocuments(query);
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
        console.error('Transaction history error:', error);
        res.status(500).json({ message: 'Server error while fetching transaction history' });
    }
});
exports.getTransactionHistory = getTransactionHistory;
// Get user balance
const getBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.user._id;
        const { currency } = req.query;
        const user = yield user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (currency) {
            // Return specific currency balance
            const balance = Number(user.balance.get(currency) || 0);
            res.status(200).json({
                balance: {
                    [currency]: balance
                }
            });
        }
        else {
            // Return all balances
            res.status(200).json({
                balance: Object.fromEntries(user.balance.entries())
            });
        }
    }
    catch (error) {
        console.error('Balance check error:', error);
        res.status(500).json({ message: 'Server error while fetching balance' });
    }
});
exports.getBalance = getBalance;
