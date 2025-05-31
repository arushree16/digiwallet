"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
// Public routes
router.post('/register', auth_controller_1.register);
router.post('/login', auth_controller_1.login);
// Protected routes
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.getProfile);
exports.default = router;
