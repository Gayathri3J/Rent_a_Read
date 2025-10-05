import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import Book from '../models/bookModel.js';
import Rental from '../models/rentalModel.js';
import Payment from '../models/paymentModel.js';
import BookReview from '../models/bookReviewModel.js';
import UserReview from '../models/userReviewModel.js';
import AdminLog from '../models/adminLogModel.js';
import { sendSuspensionEmail, sendDeletionEmail } from '../utils/email.js';


const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Get all books (admin only)
// @route   GET /api/admin/books
// @access  Private/Admin
const getBooks = asyncHandler(async (req, res) => {
  const books = await Book.find({}).populate('owner', 'name email');
  res.json(books);
});

// @desc    Get all rentals (admin only)
// @route   GET /api/admin/rentals
// @access  Private/Admin
const getRentals = asyncHandler(async (req, res) => {
  const rentals = await Rental.find({})
    .populate('book', 'title')
    .populate('borrower', 'name')
    .populate('lender', 'name');
  res.json(rentals);
});

// @desc    Delete user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  await User.findByIdAndDelete(id);


  try {
    await sendDeletionEmail(user.email, user.name, 'Deleted by admin');
  } catch (error) {
    console.error('Failed to send deletion email:', error);
  }

  // Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: 'delete_user',
    details: { deletedUser: id, deletedUserName: user.name }
  });

  res.json({ message: 'User deleted' });
});

// @desc    Delete book (admin only)
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
const deleteBook = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const book = await Book.findById(id);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  await Book.findByIdAndDelete(id);

  // Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: 'delete_book',
    details: { deletedBook: id, deletedBookTitle: book.title }
  });

  res.json({ message: 'Book deleted' });
});

// @desc    Get admin logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getAdminLogs = asyncHandler(async (req, res) => {
  const logs = await AdminLog.find({})
    .populate('admin', 'name')
    .sort({ createdAt: -1 });
  res.json(logs);
});

// @desc    Get all payments (admin only)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({})
    .populate('rental', 'book borrower lender')
    .sort({ createdAt: -1 });
  res.json(payments);
});

// @desc    Get all reviews (admin only)
// @route   GET /api/admin/reviews
// @access  Private/Admin
const getReviews = asyncHandler(async (req, res) => {
  const bookReviews = await BookReview.find({})
    .populate('reviewer', 'name')
    .populate('book', 'title')
    .populate('rental', 'borrower lender');

  const userReviews = await UserReview.find({})
    .populate('reviewer', 'name')
    .populate('reviewedUser', 'name')
    .populate('rental', 'borrower lender');

  res.json({ bookReviews, userReviews });
});

// @desc    Suspend user (admin only)
// @route   PUT /api/admin/users/:id/suspend
// @access  Private/Admin
const suspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isSuspended = true;
  await user.save();

  // Send suspension email
  try {
    await sendSuspensionEmail(user.email, user.name, reason);
  } catch (error) {
    console.error('Failed to send suspension email:', error);
  }

  // Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: 'suspend_user',
    details: { suspendedUser: id, suspendedUserName: user.name, reason }
  });

  res.json({ message: 'User suspended' });
});

// @desc    Unsuspend user (admin only)
// @route   PUT /api/admin/users/:id/unsuspend
// @access  Private/Admin
const unsuspendUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isSuspended = false;
  await user.save();

  // Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: 'unsuspend_user',
    details: { unsuspendedUser: id, unsuspendedUserName: user.name }
  });

  res.json({ message: 'User unsuspended' });
});

// @desc    Update payment status (admin only)
// @route   PUT /api/admin/payments/:id
// @access  Private/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  payment.status = status;
  await payment.save();

  // Log admin action
  await AdminLog.create({
    admin: req.user._id,
    action: 'update_payment_status',
    details: { paymentId: id, newStatus: status }
  });

  res.json(payment);
});

export { getUsers, getBooks, getRentals, deleteUser, deleteBook, getAdminLogs, getPayments, getReviews, suspendUser, unsuspendUser, updatePaymentStatus };
