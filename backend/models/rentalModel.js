import mongoose from 'mongoose';

const rentalSchema = mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'books',
    },
    borrower: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    lender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Accepted', 'Awaiting Payment', 'Awaiting Pickup', 'Lent Out', 'Returning', 'Completed', 'Rejected', 'Withdrawn']
    },
    startDate: { type: Date },
    dueDate: { type: Date },
    duration: { type: String },
    rentalFee: { type: Number, required: true },
    message: { type: String },
    extensions: [
      {
        duration: { type: String },
        extendedAt: { type: Date, default: Date.now },
      },
    ],
    returnInitiated: { type: Boolean, default: false },
    pickupCode: { type: String, unique: true, sparse: true }, // Short code for pickup confirmation
    returnCode: { type: String, unique: true, sparse: true }, // Short code for return confirmation
    lentOutDate: { type: Date }, // Date when book was picked up
    returnDate: { type: Date }, // Date when book was returned
  },
  {
    timestamps: true,
  }
);

const Rental = mongoose.model('rentals', rentalSchema);

export default Rental;
