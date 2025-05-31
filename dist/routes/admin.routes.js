"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// All admin routes require authentication and admin privileges
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.use('/', auth_middleware_1.authenticate);
router.use('/', auth_middleware_1.isAdmin);
// User management
router.get('/users', admin_controller_1.getAllUsers);
router.get('/users/deleted', admin_controller_1.getSoftDeletedUsers);
router.delete('/users/:userId/soft', admin_controller_1.softDeleteUser);
router.post('/users/:userId/restore', admin_controller_1.restoreUser);
// Fraud detection and reporting
router.get('/transactions/flagged', admin_controller_1.getFlaggedTransactionsHandler);
router.get('/transactions/deleted', admin_controller_1.getSoftDeletedTransactions);
router.delete('/transactions/:transactionId/soft', admin_controller_1.softDeleteTransaction);
router.post('/transactions/:transactionId/restore', admin_controller_1.restoreTransaction);
router.post('/fraud-scan/run', admin_controller_1.runFraudScan);
// Analytics and reporting
router.get('/balance/total', admin_controller_1.getTotalBalance);
router.get('/users/top-by-balance', admin_controller_1.getTopUsersByBalance);
router.get('/users/top-by-volume', admin_controller_1.getTopUsersByTransactionVolume);
exports.default = router;
