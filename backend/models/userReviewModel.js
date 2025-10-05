import mongoose from 'mongoose';

const userReviewSchema = mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users', 
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

const UserReview = mongoose.model('userreviews', userReviewSchema);

export default UserReview;
