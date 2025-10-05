import asyncHandler from 'express-async-handler';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email.js';

/**
 * @desc    Register a new user
 * @route   POST /api/users
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, location } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists. Please try logging in.');
  }

  const user = await User.create({
    name,
    email,
    password,
    location,
  });

  if (user) {
    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

/**
 * @desc    Auth user & get token
 * @route   POST /api/users/login
 * @access  Public
 */
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    if (user.isSuspended) {
      res.status(403);
      throw new Error('Your account has been suspended. Please contact support.');
    }
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({});
  res.json(users);
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid user ID');
  }

  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/users/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

  user.resetToken = resetToken;
  user.resetTokenExpiry = resetTokenExpiry;
  await user.save();

  // Send reset email
  await sendPasswordResetEmail(user.email, resetToken);

  res.json({ message: 'Password reset email sent' });
});

/**
 * @desc    Reset password
 * @route   POST /api/users/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  user.password = password;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

/**
 * @desc    Test email sending
 * @route   POST /api/users/test-email
 * @access  Public
 */
const testEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    await sendWelcomeEmail(email, 'Test User');
    res.json({ message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send test email', error: error.message });
  }
});

export { registerUser, authUser, getUsers, getUserById, forgotPassword, resetPassword, testEmail };
