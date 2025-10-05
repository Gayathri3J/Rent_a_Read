import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import connectDB from './connection.js';

import userRoutes from './routes/userRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';
import User from './models/userModel.js';
import Book from './models/bookModel.js';
import Rental from './models/rentalModel.js';
import UserReview from './models/userReviewModel.js';
import BookReview from './models/bookReviewModel.js';
import Message from './models/messageModel.js';
import Notification from './models/notificationModel.js';
import Payment from './models/paymentModel.js';
import AdminLog from './models/adminLogModel.js';

console.log('Env vars:', { EMAIL_USER: process.env.EMAIL_USER, EMAIL_PASS: process.env.EMAIL_PASS ? 'set' : 'not set' });

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Frontend URL from env
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
})); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });

// File upload route
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

// A simple test route
app.get('/api', (req, res) => {
  res.send('Rent a Read API is running...');
});

// Mount Routes
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io setup for real-time chat
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation ${conversationId}`);
  });

  // Send message
  socket.on('sendMessage', (message) => {
    // Emit to other participants in the room, but not the sender
    socket.to(message.conversationId).emit('receiveMessage', message);

    // Create notification for receiver
    const notification = new Notification({
      user: message.receiver._id || message.receiver,
      type: 'message',
      message: `New message from ${message.sender?.name || 'User'}`,
      relatedId: message._id
    });
    notification.save().catch(error => console.error('Error saving notification:', error));
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
