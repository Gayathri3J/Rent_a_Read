import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
  createRental,
  getRentals,
  getRentalById,
  updateRentalStatus,
  initiateReturn,
  extendRental,
  sendDueSoonReminders,
  withdrawRentalRequest,
  confirmPickup,
  confirmReturn,
} from '../controllers/rentalController.js';

const router = express.Router();

router.route('/').post(protect, createRental).get(protect, getRentals);

router.route('/:id/confirm-pickup').put(protect, confirmPickup);
router.route('/:id/confirm-return').put(protect, confirmReturn);
router.route('/:id/initiate-return').put(protect, initiateReturn);
router.route('/:id/extend').put(protect, extendRental);
router.route('/:id/withdraw').put(protect, withdrawRentalRequest);
router.route('/:id').get(protect, getRentalById).put(protect, updateRentalStatus);

router.route('/admin/send-due-soon-reminders').post(protect, admin, sendDueSoonReminders);

export default router;
