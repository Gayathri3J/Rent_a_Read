import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/:id/read').put(protect, markAsRead);
router.route('/read-all').put(protect, markAllAsRead);
router.route('/:id').delete(protect, deleteNotification);

export default router;
