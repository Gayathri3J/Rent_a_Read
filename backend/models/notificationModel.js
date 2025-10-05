import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    type: {
      type: String,
      required: true,
      enum: ['rental_request', 'payment_due', 'return_reminder', 'message', 'review_received', 'return_initiated', 'pickup_confirmed', 'return_confirmed'],
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('notifications', notificationSchema);

export default Notification;
