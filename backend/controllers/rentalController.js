import asyncHandler from 'express-async-handler';
import Rental from '../models/rentalModel.js';
import Book from '../models/bookModel.js';
import User from '../models/userModel.js';
import Notification from '../models/notificationModel.js';
import Message from '../models/messageModel.js';
import crypto from 'crypto';
import { sendRentalNotification, sendDueDateReminderEmail } from '../utils/email.js';

// @desc    Create a rental request
// @route   POST /api/rentals
// @access  Private
const createRental = asyncHandler(async (req, res) => {
  const { bookId, startDate, duration, message } = req.body;
  const borrower = req.user._id;

  const book = await Book.findById(bookId);
  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  if (book.owner.toString() === borrower.toString()) {
    res.status(400);
    throw new Error('Cannot rent your own book');
  }

  if (book.status !== 'Available') {
    res.status(400);
    throw new Error('Book is not available');
  }

  const lender = book.owner;

  // Parse duration (e.g., "2 Weeks" -> 2)
  const durationMatch = duration.match(/(\d+)/);
  const durationWeeks = durationMatch ? parseInt(durationMatch[1]) : 2; // Default to 2 weeks if parsing fails

  const dueDate = new Date(startDate);
  dueDate.setDate(dueDate.getDate() + durationWeeks * 7);

  const rental = await Rental.create({
    book: bookId,
    borrower,
    lender,
    status: 'Pending',
    startDate,
    duration,
    dueDate,
    rentalFee: book.rentalFee,
    message,
  });

  // Create notification for lender
  await Notification.create({
    user: lender,
    type: 'rental_request',
    message: `New rental request for "${book.title}"`,
    relatedId: rental._id,
  });

  // Send rental request notification email to lender (with populated book fields)
  const lenderUser = await User.findById(lender);
  if (lenderUser && lenderUser.email) {
    const populatedRental = await Rental.findById(rental._id).populate('book', 'title author');
    await sendRentalNotification(lenderUser.email, 'request', populatedRental);
  }

  res.status(201).json(rental);
});

// @desc    Get rentals for user (lent or borrowed)
// @route   GET /api/rentals
// @access  Private
const getRentals = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query; // 'lent' or 'borrowed'

  let filter = {};
  if (type === 'lent') {
    filter.lender = userId;
  } else if (type === 'borrowed') {
    filter.borrower = userId;
  } else {
    filter.$or = [{ lender: userId }, { borrower: userId }];
  }

  const rentals = await Rental.find(filter)
    .populate('book', 'title coverImage')
    .populate('borrower', 'name profilePic averageRating')
    .populate('lender', 'name profilePic averageRating')
    .sort({ createdAt: -1 });

  // Filter out rentals where book, borrower, or lender is null (e.g., deleted)
  const validRentals = rentals.filter(r => r.book && r.borrower && r.lender);

  res.json(validRentals);
});

// @desc    Update rental status
// @route   PUT /api/rentals/:id
// @access  Private
const updateRentalStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  // Helper function to generate a 6-digit code
  const generateCode = () => {
    const code = crypto.randomInt(100000, 999999).toString();
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  };

  const rental = await Rental.findById(id);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // Check permissions
  if (rental.lender.toString() !== userId.toString() && rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  // Update book status based on rental status
  let bookStatus = 'Available';
  if (status === 'Accepted') {
    // When a request is accepted, it moves to Awaiting Payment.
    // The book is reserved by setting its status to 'Pending'.
    rental.status = 'Awaiting Payment';
    await rental.save(); // Save the new rental status
    bookStatus = 'Pending';
  } else if (status === 'Awaiting Payment') {
    bookStatus = 'Pending';
  } else if (status === 'Lent Out') {
    // This is handled in confirmPickup, but we keep it here for other potential status updates
    bookStatus = 'Rented';
  } else if (status === 'Rejected') {
    bookStatus = 'Available';
    rental.status = 'Rejected';
    await rental.save();
  } else {
    rental.status = status;
  }
  await Book.findByIdAndUpdate(rental.book, { status: bookStatus });

  // Create notification
  const notifyUser = rental.lender.toString() === userId.toString() ? rental.borrower : rental.lender;
  const action = status === 'Accepted' ? 'accepted' : status === 'Rejected' ? 'rejected' : 'updated';
  await Notification.create({
    user: notifyUser,
    type: 'rental_request',
    message: `Rental request has been ${action}`, // Simplified message as book is not populated here
    relatedId: rental._id,
  });

  // Send email notification to borrower for accepted or rejected
  if (status === 'Accepted' || status === 'Rejected') {
    const populatedRental = await Rental.findById(id).populate('book', 'title author');
    const borrowerUser = await User.findById(rental.borrower);
    if (borrowerUser && borrowerUser.email) {
      const emailType = status === 'Accepted' ? 'accepted' : 'rejected';
      await sendRentalNotification(borrowerUser.email, emailType, populatedRental);
    }
  }

  res.json(rental);
});

// @desc    Get a single rental by ID
// @route   GET /api/rentals/:id
// @access  Private
const getRentalById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  let rental;
  try {
    rental = await Rental.findById(id)
      .populate('book', 'title coverImage author description condition rentalFee location')
      .populate('borrower', 'name profilePic averageRating')
      .populate('lender', 'name profilePic averageRating');
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500);
    throw new Error('Server error while fetching rental');
  }

  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  // No permission check: any authenticated user can view rental details

  // Fetch messages for this rental (conversationId = rental._id)
  let messages = [];
  try {
    messages = await Message.find({ conversationId: id })
      .populate('sender', 'name profilePic')
      .sort({ createdAt: 1 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    // Continue without messages if error occurs
  }

  res.json({ rental, messages });
});

// @desc    Initiate return
// @route   PUT /api/rentals/:id/initiate-return
// @access  Private
const initiateReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const rental = await Rental.findById(id).populate('book', 'title');
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  if (rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Only borrower can initiate return');
  }

  console.log('Initiate return: Rental status:', rental.status);
  if (rental.status !== 'Lent Out') {
    res.status(400);
    throw new Error('Rental is not in Lent Out status');
  }

  rental.status = 'Returning';
  rental.returnInitiated = true;
  // Generate a unique return code for manual confirmation
  const code = crypto.randomInt(100000, 999999).toString();
  rental.returnCode = `${code.slice(0, 3)}-${code.slice(3)}`;
  await rental.save();

  // Create notification for lender
  await Notification.create({
    user: rental.lender,
    type: 'return_initiated',
    message: `Return initiated for "${rental.book.title}"`,
    relatedId: rental._id,
  });

  res.json(rental);
});

/**
 * @desc    Extend rental period
 * @route   PUT /api/rentals/:id/extend
 * @access  Private
 */
const extendRental = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { duration } = req.body;
  const userId = req.user._id;

  const rental = await Rental.findById(id);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }

  if (rental.lender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Only the lender can extend the rental period');
  }

  if (rental.status !== 'Lent Out') {
    res.status(400);
    throw new Error('Rental must be in Lent Out status to extend');
  }

  // Parse duration and calculate new due date
  const durationMatch = duration.match(/(\d+)\s*(Week|Weeks)/i);
  if (!durationMatch) {
    res.status(400);
    throw new Error('Invalid duration format');
  }
  const weeks = parseInt(durationMatch[1]);
  const newDueDate = new Date(rental.dueDate);
  newDueDate.setDate(newDueDate.getDate() + weeks * 7);

  // Add extension to the array
  rental.extensions.push({
    duration,
    extendedAt: new Date(),
  });

  // Update due date
  rental.dueDate = newDueDate;
  await rental.save();

  res.json(rental);
});

// @desc    Confirm book pickup (Lender enters Borrower's code)
// @route   PUT /api/rentals/:id/confirm-pickup
// @access  Private (Lender)
const confirmPickup = asyncHandler(async (req, res) => {
  const { id: rentalId } = req.params;
  const { pickupCode } = req.body; // For manual code entry
  const userId = req.user._id;

  let rental;
  if (pickupCode) {
    // Find by the 6-digit manual code
    const formattedCode = pickupCode.includes('-') ? pickupCode : `${pickupCode.slice(0, 3)}-${pickupCode.slice(3)}`;
    rental = await Rental.findOne({ pickupCode: formattedCode }).populate('book', 'title');
  } else {
    // Find by rentalId (from QR code scan)
    rental = await Rental.findById(rentalId).populate('book', 'title');
  }

  if (!rental) {
    res.status(404);
    throw new Error('Rental not found or invalid code.');
  }

  // Only the lender can confirm pickup
  if (rental.lender.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to confirm pickup for this rental.');
  }

  // Check if rental is in the correct state
  if (rental.status !== 'Awaiting Pickup') {
    res.status(400);
    throw new Error(`Cannot confirm pickup. Rental status is "${rental.status}".`);
  }

  // Update rental status and book status
  rental.status = 'Lent Out';
  rental.lentOutDate = new Date();
  rental.pickupCode = undefined; // Clear the code after use
  // You can also calculate and set the dueDate here based on duration
  await rental.save();
  await Book.findByIdAndUpdate(rental.book._id, { status: 'Rented' });

  // Notify borrower
  try {
    await Notification.create({
      user: rental.borrower,
      type: 'pickup_confirmed',
      message: `"${rental.book.title}" has been picked up.`,
      relatedId: rental._id,
    });
  } catch (notificationError) {
    console.error('Failed to create pickup confirmation notification:', notificationError);
    // Continue with the response even if notification fails
  }

  res.json({ message: 'Pickup confirmed successfully.', rental });
});

// @desc    Confirm book return (Borrower enters Lender's code)
// @route   PUT /api/rentals/:id/confirm-return
// @access  Private (Borrower)
const confirmReturn = asyncHandler(async (req, res) => {
  const { id: rentalId } = req.params;
  const { returnCode } = req.body; // For manual code entry
  const userId = req.user._id;

  let rental;
  if (returnCode) {
    // Find by the 6-digit manual code
    const formattedCode = returnCode.includes('-') ? returnCode : `${returnCode.slice(0, 3)}-${returnCode.slice(3)}`;
    rental = await Rental.findOne({ returnCode: formattedCode }).populate('book', 'title');
  } else {
    // Find by rentalId (from QR code scan)
    rental = await Rental.findById(rentalId).populate('book', 'title');
  }

  if (!rental) {
    res.status(404);
    throw new Error('Rental not found or invalid code.');
  }

  // Only the borrower can confirm the return
  if (rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to confirm return for this rental.');
  }

  if (rental.status !== 'Returning') {
    res.status(400);
    throw new Error(`Cannot confirm return. Rental status is "${rental.status}".`);
  }

  // Update rental and book status
  rental.status = 'Completed';
  rental.returnDate = new Date();
  rental.returnCode = undefined; // Clear the code after use
  await rental.save();
  await Book.findByIdAndUpdate(rental.book._id, { status: 'Available' });

  // Notify lender
  try {
    await Notification.create({
      user: rental.lender,
      type: 'return_confirmed',
      message: `Your return of "${rental.book.title}" has been confirmed.`,
      relatedId: rental._id,
    });
  } catch (notificationError) {
    console.error('Failed to create return confirmation notification:', notificationError);
    // Continue with the response even if notification fails
  }

  res.json({ message: 'Return confirmed and rental completed.', rental });
});

// Borrower can withdraw a pending request
export const withdrawRentalRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const rental = await Rental.findById(id);
  if (!rental) {
    res.status(404);
    throw new Error('Rental not found');
  }
  if (rental.borrower.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Only the borrower can withdraw this request');
  }
  if (rental.status !== 'Pending') {
    res.status(400);
    throw new Error('Only pending requests can be withdrawn');
  }

  // Mark withdrawn and free the book
  rental.status = 'Withdrawn';
  await rental.save();
  await Book.findByIdAndUpdate(rental.book, { status: 'Available' });

  // Notify lender via email (optional: could also add Notification document)
  const populatedRental = await Rental.findById(id).populate('book', 'title author');
  const lenderUser = await User.findById(rental.lender);
  if (lenderUser?.email) {
    await sendRentalNotification(lenderUser.email, 'withdrawn', populatedRental);
  }

  res.json({ message: 'Rental request withdrawn', rental });
});
// Admin/utility: send reminders for rentals due within next 2 days
export const sendDueSoonReminders = asyncHandler(async (req, res) => {
  const now = new Date();
  const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const rentals = await Rental.find({
    status: 'Lent Out',
    dueDate: { $gte: now, $lte: inTwoDays },
  }).populate('book', 'title author').populate('borrower', 'email');

  let sent = 0;
  for (const r of rentals) {
    if (r.borrower?.email) {
      await sendDueDateReminderEmail(r.borrower.email, r);
      sent++;
    }
  }
  res.json({ matched: rentals.length, sent });
});

export {
  createRental,
  getRentals,
  getRentalById,
  updateRentalStatus,
  initiateReturn,
  confirmPickup,
  confirmReturn,
  extendRental,
};
