import asyncHandler from 'express-async-handler';
import Payment from '../models/paymentModel.js';
import Rental from '../models/rentalModel.js';
import Book from '../models/bookModel.js';
import razorpay from '../utils/razorpay.js';
import crypto from 'crypto';

// @desc    Create payment
// @route   POST /api/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { rentalId, amount, paymentMethod, transactionId } = req.body;
  const userId = req.user._id;

  const rental = await Rental.findById(rentalId);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Only borrower can make payment
  if (rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const payment = await Payment.create({
    rental: rentalId,
    amount,
    paymentMethod,
    transactionId,
  });

  // Update rental status if payment is for rental fee
  if (rental.status === 'Awaiting Payment') {
    rental.status = 'Lent Out';
    await rental.save();
    await Book.findByIdAndUpdate(rental.book, { status: 'Rented' });
  }

  res.status(201).json(payment);
});

// @desc    Get payments for user
// @route   GET /api/payments
// @access  Private
const getPayments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rentals = await Rental.find({
    $or: [{ borrower: userId }, { lender: userId }]
  }).select('_id');

  const rentalIds = rentals.map(r => r._id);

  const payments = await Payment.find({ rental: { $in: rentalIds } })
    .populate('rental', 'book borrower lender')
    .sort({ createdAt: -1 });

  res.json(payments);
});

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private (Admin only for now)
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const payment = await Payment.findById(id);
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  payment.status = status;
  await payment.save();

  res.json(payment);
});

// @desc    Create Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { rentalId } = req.body;
  const userId = req.user._id;

  const rental = await Rental.findById(rentalId)
    .populate('book', 'title')
    .populate('borrower', 'name email')
    .populate('lender', 'name');

  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Only borrower can create payment order
  if (rental.borrower._id.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (rental.status !== 'Awaiting Payment') {
    res.status(400);
    throw new Error('Rental is not awaiting payment');
  }

  const options = {
    amount: rental.rentalFee * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `rental_${rentalId}`,
    notes: {
      rentalId: rentalId,
      bookTitle: rental.book.title,
      borrowerName: rental.borrower.name,
      lenderName: rental.lender.name,
    }
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay order creation failed:', error);
    res.status(500);
    throw new Error('Payment order creation failed');
  }
});

// @desc    Verify Razorpay payment
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature, rentalId } = req.body;
  const userId = req.user._id;

  const rental = await Rental.findById(rentalId);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Only borrower can verify payment
  if (rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Verify payment signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    res.status(400);
    throw new Error('Invalid payment signature');
  }

  // Create payment record
  const payment = await Payment.create({
    rental: rentalId,
    amount: rental.rentalFee,
    paymentMethod: 'razorpay',
    transactionId: paymentId,
    status: 'Completed'
  });

  // Update rental status
  rental.status = 'Awaiting Pickup';

  // Helper function to generate a 6-digit code
  const generateCode = () => {
    const code = crypto.randomInt(100000, 999999).toString();
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };
  // Generate a unique pickup code for manual confirmation now that payment is complete
  rental.pickupCode = generateCode();

  await rental.save();

  // Book status remains 'Pending' until it's actually picked up
  await Book.findByIdAndUpdate(rental.book, { status: 'Pending' });

  res.json({
    success: true,
    payment,
    message: 'Payment verified successfully'
  });
});

export { createPayment, getPayments, updatePaymentStatus, createRazorpayOrder, verifyPayment };
