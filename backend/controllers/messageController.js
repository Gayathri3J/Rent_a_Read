import asyncHandler from 'express-async-handler';
import Message from '../models/messageModel.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  // Ensure user is part of the conversation
  const [user1, user2] = conversationId.split('-');
  if (user1 !== userId.toString() && user2 !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this conversation');
  }

  const messages = await Message.find({ conversationId })
    .populate('sender', 'name profilePic')
    .populate('receiver', 'name profilePic')
    .sort({ createdAt: 1 });

  // Mark messages as read
  await Message.updateMany(
    { conversationId, receiver: userId, read: false },
    { read: true }
  );

  res.json(messages);
});

// @desc    Get conversations for user
// @route   GET /api/messages
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: userId }, { receiver: userId }]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiver', userId] }, { $eq: ['$read', false] }] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      // Add this stage to ensure that we only proceed with conversations that have messages.
      $match: {
        'lastMessage': { $ne: null }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.sender',
        foreignField: '_id',
        as: 'senderInfo'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastMessage.receiver',
        foreignField: '_id',
        as: 'receiverInfo'
      }
    },
    {
      $project: {
        conversationId: '$_id',
        lastMessage: 1,
        unreadCount: 1,
        otherUser: {
          $cond: {
            if: { $eq: ['$lastMessage.sender', userId] },
            then: { $arrayElemAt: ['$receiverInfo', 0] },
            else: { $arrayElemAt: ['$senderInfo', 0] }
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);

  res.json(conversations);
});

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, receiverId, fileUrl, fileType } = req.body;
  const senderId = req.user._id;

  if (!text && !fileUrl) {
    res.status(400);
    throw new Error('Message must contain either text or a file.');
  }

  const message = await Message.create({
    conversationId,
    sender: senderId,
    receiver: receiverId,
    text,
    fileUrl,
    fileType,
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name profilePic')
    .populate('receiver', 'name profilePic');

  res.status(201).json(populatedMessage);
});

export { getMessages, getConversations, sendMessage };
