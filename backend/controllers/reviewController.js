import asyncHandler from 'express-async-handler';
import UserReview from '../models/userReviewModel.js';
import BookReview from '../models/bookReviewModel.js';
import Rental from '../models/rentalModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Create user review
// @route   POST /api/reviews/user
// @access  Private
const createUserReview = asyncHandler(async (req, res) => {
  const { rentalId, reviewedUserId, rating, comment } = req.body;
  const reviewerId = req.user._id;

  const rental = await Rental.findById(rentalId);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Check if user is part of the rental
  if (rental.borrower.toString() !== reviewerId.toString() && rental.lender.toString() !== reviewerId.toString()) {
    res.status(403);
    throw new Error('Not authorized to review this rental');
  }

  // Check if already reviewed
  const existingReview = await UserReview.findOne({ reviewer: reviewerId, rental: rentalId, reviewedUser: reviewedUserId });
  if (existingReview) {
    res.status(400);
    throw new Error('Already reviewed this user for this rental');
  }

  const review = await UserReview.create({
    reviewer: reviewerId,
    reviewedUser: reviewedUserId,
    rental: rentalId,
    rating,
    comment,
  });

  // Update average rating
  const reviews = await UserReview.find({ reviewedUser: reviewedUserId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(reviewedUserId, { averageRating: avgRating });

  // Update rental review status
  if (reviewerId.toString() === rental.borrower.toString()) {
    // Borrower reviewing lender
    await Rental.findByIdAndUpdate(rentalId, { borrowerReviewedOwner: true });
  } else if (reviewerId.toString() === rental.lender.toString()) {
    // Lender reviewing borrower
    await Rental.findByIdAndUpdate(rentalId, { ownerReviewedBorrower: true });
  }

  // Create notification
  await Notification.create({
    user: reviewedUserId,
    type: 'review_received',
    message: `You received a new review`,
    relatedId: review._id,
  });

  res.status(201).json(review);
});

// @desc    Create book review
// @route   POST /api/reviews/book
// @access  Private
const createBookReview = asyncHandler(async (req, res) => {
  const { rentalId, bookId, rating, comment } = req.body;
  const reviewerId = req.user._id;

  const rental = await Rental.findById(rentalId);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Check if user borrowed the book
  if (rental.borrower.toString() !== reviewerId.toString()) {
    res.status(403);
    throw new Error('Only borrower can review the book');
  }

  // Check if already reviewed
  const existingReview = await BookReview.findOne({ reviewer: reviewerId, rental: rentalId, book: bookId });
  if (existingReview) {
    res.status(400);
    throw new Error('Already reviewed this book for this rental');
  }

  const review = await BookReview.create({
    reviewer: reviewerId,
    book: bookId,
    rental: rentalId,
    rating,
    comment,
  });

  // Update book average rating
  const reviews = await BookReview.find({ book: bookId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Book.findByIdAndUpdate(bookId, { averageRating: avgRating });

  // Update rental review status
  await Rental.findByIdAndUpdate(rentalId, { borrowerReviewedBook: true });

  // Create notification for the book owner
  const book = await rental.populate('book');
  await Notification.create({
    user: book.book.owner,
    type: 'review_received',
    message: `Your book "${book.book.title}" received a new review.`,
    relatedId: review._id,
  });

  res.status(201).json(review);
});

// @desc    Get reviews for user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reviews = await UserReview.find({ reviewedUser: userId })
    .populate('reviewer', 'name profilePic')
    .populate('rental', 'book')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Get reviews for book
// @route   GET /api/reviews/book/:bookId
// @access  Public
const getBookReviews = asyncHandler(async (req, res) => {
  const { bookId } = req.params;

  const reviews = await BookReview.find({ book: bookId })
    .populate('reviewer', 'name profilePic')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

export { createUserReview, createBookReview, getUserReviews, getBookReviews };
