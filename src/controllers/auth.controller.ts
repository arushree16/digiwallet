import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import config from '../config/config';

// Generate JWT token
const generateToken = (id: string): string => {
  // Use the secret directly from the environment variable
  // @ts-ignore - Ignoring type issues with jwt.sign
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'default_secret_key', 
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Register a new user
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }],
      isDeleted: false 
    });

    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email or username' });
      return;
    }

    // Create new user
    const user = await User.create({
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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email, isDeleted: false });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response): Promise<void> => {
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
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};
