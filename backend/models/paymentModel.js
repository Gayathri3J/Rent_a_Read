import mongoose from 'mongoose';

const paymentSchema = mongoose.Schema(
  {
    rental: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'rentals',
    },
    amount: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    paymentMethod: { type: String },
    transactionId: { type: String },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
