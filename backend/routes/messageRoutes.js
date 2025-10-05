import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  getMessages,
  getConversations,
  sendMessage,
} from '../controllers/messageController.js';

const router = express.Router();

router.route('/').get(protect, getConversations).post(protect, sendMessage);
router.route('/:conversationId').get(protect, getMessages);

export default router;
