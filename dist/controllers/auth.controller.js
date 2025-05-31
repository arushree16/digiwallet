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
exports.getProfile = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
// Generate JWT token
const generateToken = (id) => {
    // Use the secret directly from the environment variable
    // @ts-ignore - Ignoring type issues with jwt.sign
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'default_secret_key', { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};
// Register a new user
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        // Check if user already exists
        const existingUser = yield user_model_1.default.findOne({
            $or: [{ email }, { username }],
            isDeleted: false
        });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists with this email or username' });
            return;
        }
        // Create new user
        const user = yield user_model_1.default.create({
            username,
            email,
            password,
            balance: { USD: 0 },
        });
        // Generate token
        const token = generateToken(String(user._id));
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                isAdmin: user.isAdmin,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});
exports.register = register;
// Login user
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Find user by email
        const user = yield user_model_1.default.findOne({ email, isDeleted: false });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Check password
        const isMatch = yield user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        // Generate token
        const token = generateToken(String(user._id));
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                isAdmin: user.isAdmin,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});
exports.login = login;
// Get current user profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                balance: user.balance,
                isAdmin: user.isAdmin,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
});
exports.getProfile = getProfile;
