"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// All wallet routes require authentication
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.use('/', auth_middleware_1.authenticate);
// Wallet operations
router.post('/deposit', wallet_controller_1.deposit);
router.post('/withdraw', wallet_controller_1.withdraw);
router.post('/transfer', wallet_controller_1.transfer);
// Transaction history
router.get('/transactions', wallet_controller_1.getTransactionHistory);
// Balance
router.get('/balance', wallet_controller_1.getBalance);
exports.default = router;
