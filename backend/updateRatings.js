import dotenv from 'dotenv';
dotenv.config();

import connectDB from './connection.js';
import Book from './models/bookModel.js';
import BookReview from './models/bookReviewModel.js';
import User from './models/userModel.js';
import UserReview from './models/userReviewModel.js';

const updateBookRatings = async () => {
  try {
    const books = await Book.find({});
    for (const book of books) {
      const reviews = await BookReview.find({ book: book._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await Book.findByIdAndUpdate(book._id, { averageRating: avgRating });
      }
    }
  } catch (error) {
    console.error('Error updating book ratings:', error);
  }
};

const updateUserRatings = async () => {
  try {
    const users = await User.find({});
    for (const user of users) {
      const reviews = await UserReview.find({ reviewedUser: user._id });
      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await User.findByIdAndUpdate(user._id, { averageRating: avgRating });
      }
    }
  } catch (error) {
    console.error('Error updating user ratings:', error);
  }
};

const runUpdates = async () => {
  await updateBookRatings();
  await updateUserRatings();
  process.exit(0);
};

runUpdates();
