import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  createPayment,
  getPayments,
  updatePaymentStatus,
  createRazorpayOrder,
  verifyPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

router.route('/').post(protect, createPayment).get(protect, getPayments);
router.route('/:id').put(protect, updatePaymentStatus);
router.route('/create-order').post(protect, createRazorpayOrder);
router.route('/verify').post(protect, verifyPayment);

export default router;
