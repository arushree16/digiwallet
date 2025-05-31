import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
// Use type assertions to bypass TypeScript errors while maintaining functionality
router.get('/profile', authenticate as any, getProfile);

export default router;
