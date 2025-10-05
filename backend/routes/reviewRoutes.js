import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createUserReview,
  createBookReview,
  getUserReviews,
  getBookReviews,
} from '../controllers/reviewController.js';

const router = express.Router();

router.route('/user').post(protect, createUserReview);
router.route('/book').post(protect, createBookReview);
router.route('/user/:userId').get(getUserReviews);
router.route('/book/:bookId').get(getBookReviews);

export default router;
