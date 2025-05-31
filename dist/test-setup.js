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
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_model_1 = __importDefault(require("./models/user.model"));
const config_1 = __importDefault(require("./config/config"));
// Function to create test users
const createTestUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Connect to MongoDB
        yield mongoose_1.default.connect(config_1.default.mongodbUri);
        console.log('Connected to MongoDB for test setup');
        // Create password hash (used for both users)
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash('admin123', salt);
        // Check if admin user already exists
        const existingAdmin = yield user_model_1.default.findOne({ email: 'admin@digiwallet.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
        }
        else {
            // Create admin user
            const adminUser = new user_model_1.default({
                username: 'admin',
                email: 'admin@digiwallet.com',
                password: hashedPassword,
                balance: { USD: 1000 },
                isAdmin: true
            });
            yield adminUser.save();
            console.log('Admin user created successfully');
        }
        // Check if regular user already exists
        const existingRegularUser = yield user_model_1.default.findOne({ email: 'user@digiwallet.com' });
        if (existingRegularUser) {
            console.log('Regular user already exists');
        }
        else {
            // Create a regular user for testing
            const regularUser = new user_model_1.default({
                username: 'user',
                email: 'user@digiwallet.com',
                password: hashedPassword,
                balance: { USD: 500 },
                isAdmin: false
            });
            yield regularUser.save();
            console.log('Regular user created successfully');
        }
        console.log('\nTest users available:');
        console.log('Admin User:');
        console.log('- Email: admin@digiwallet.com');
        console.log('- Password: admin123');
        console.log('- Balance: $1000 USD');
        console.log('\nRegular User:');
        console.log('- Email: user@digiwallet.com');
        console.log('- Password: admin123');
        console.log('- Balance: $500 USD');
    }
    catch (error) {
        console.error('Error creating test users:', error);
    }
    finally {
        // Disconnect from MongoDB
        yield mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
});
// Run the setup
createTestUsers();
