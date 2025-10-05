import mongoose from 'mongoose';

const bookReviewSchema = mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users', // This was already correct
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'books',
    },
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'rentals',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const BookReview = mongoose.model('bookreviews', bookReviewSchema);

export default BookReview;
