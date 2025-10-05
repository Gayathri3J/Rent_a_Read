import express from 'express';
import { protect, admin } from '../middlewares/authMiddleware.js';
import {
  getUsers,
  getBooks,
  getRentals,
  deleteUser,
  deleteBook,
  getAdminLogs,
  getPayments,
  getReviews,
  suspendUser,
  unsuspendUser,
  updatePaymentStatus,
} from '../controllers/adminController.js';

const router = express.Router();


router.use(protect);
router.use(admin);

router.route('/users').get(getUsers);
router.route('/books').get(getBooks);
router.route('/rentals').get(getRentals);
router.route('/logs').get(getAdminLogs);
router.route('/payments').get(getPayments);
router.route('/reviews').get(getReviews);
router.route('/users/:id').delete(deleteUser);
router.route('/books/:id').delete(deleteBook);
router.route('/users/:id/suspend').put(suspendUser);
router.route('/users/:id/unsuspend').put(unsuspendUser);
router.route('/payments/:id').put(updatePaymentStatus);

export default router;
