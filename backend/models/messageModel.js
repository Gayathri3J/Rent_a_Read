import mongoose from 'mongoose';

const messageSchema = mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    conversationId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
    },
    read: { type: Boolean, default: false },
    fileUrl: {
      type: String,
    },
    fileType: { type: String },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('messages', messageSchema);

export default Message;
