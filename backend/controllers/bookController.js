import asyncHandler from 'express-async-handler';
import axios from 'axios';
import Book from '../models/bookModel.js';
import BookReview from '../models/bookReviewModel.js';
import Rental from '../models/rentalModel.js';
import cloudinary from '../utils/cloudinary.js';
import DatauriParser from 'datauri/parser.js';
import path from 'path';

/**
 * @desc    Add a new book
 * @route   POST /api/books
 * @access  Private
 */
const addBook = asyncHandler(async (req, res) => {
  const { title, author, description, genres, language, condition, rentalFee, address } = req.body;

  // Files are now available in req.files thanks to multer
  const coverImageFile = req.files.coverImage ? req.files.coverImage[0] : null;
  const ownerPhotosFiles = req.files.ownerPhotos || [];

  if (!coverImageFile) {
    res.status(400);
    throw new Error('A cover image is required.');
  }

  const parser = new DatauriParser();

  // --- Upload Cover Image ---
  const coverImageContent = parser.format(path.extname(coverImageFile.originalname).toString(), coverImageFile.buffer).content;
  const coverImageResult = await cloudinary.uploader.upload(coverImageContent, {
    folder: 'rentaread/covers',
  });

  // --- Upload Owner Photos ---
  const ownerPhotosUrls = await Promise.all(
    ownerPhotosFiles.map(async (file) => {
      const content = parser.format(path.extname(file.originalname).toString(), file.buffer).content;
      const result = await cloudinary.uploader.upload(content, {
        folder: 'rentaread/owner_photos',
      });
      return result.secure_url;
    })
  );
  
  // --- Geocoding using Nominatim ---
  let coordinates = [];
  try {
    // Add User-Agent header as required by Nominatim usage policy
    const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`, {
      headers: {
        'User-Agent': 'RentareadApp/1.0 (gayathrij263@gmail.com)',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 5000 // 5 seconds timeout to avoid hanging requests
    });
    if (data && data.length > 0) {
      coordinates = [parseFloat(data[0].lon), parseFloat(data[0].lat)];
    } else {
      res.status(400);
      throw new Error('Could not find location for the provided address. Please be more specific.');
    }
  } catch (error) {
    console.error('Geocoding error:', error.message || error);
    if (error.response) {
      console.error('Geocoding response status:', error.response.status);
      console.error('Geocoding response data:', error.response.data);
    }
    res.status(500);
    throw new Error('Geocoding service failed. Please try again later.');
  }

  const book = new Book({
    title,
    author,
    description,
    genres,
    language,
    condition,
    rentalFee,
    owner: req.user._id, // From 'protect' middleware
    coverImage: coverImageResult.secure_url,
    ownerPhotos: ownerPhotosUrls,
    location: {
      type: 'Point',
      coordinates,
      address,
    },
  });

  const createdBook = await book.save();
  res.status(201).json(createdBook);
});

/**
 * @desc    Fetch all books
 * @route   GET /api/books
 * @access  Public
 */
const getBooks = asyncHandler(async (req, res) => {
  const { search, genres, languages, availability, lat, lng, radius, minPrice, maxPrice } = req.query;

  const filter = {};

  // Text search for title or author
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
    ];
  }

  // Filter by one or more genres
  if (genres) {
    filter.genres = { $in: genres.split(',') };
  }

  // Filter by one or more languages
  if (languages) {
    filter.language = { $in: languages.split(',') };
  }

  // Filter by availability status
  if (availability) {
    filter.status = { $in: availability.split(',') };
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    filter.rentalFee = priceFilter;
  }

  // Geospatial query to find books within a certain radius
  if (lat && lng && radius) {
    // If radius is an empty string, default it to a sensible value like 10km
    const searchRadiusKm = parseFloat(radius) || 10;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // MongoDB's $centerSphere expects radius in radians.
    // Earth's radius in kilometers is approximately 6378.1.
    const radiusInRadians = searchRadiusKm / 6378.1;

    filter.location = {
      $geoWithin: { $centerSphere: [[longitude, latitude], radiusInRadians] },
    };
  }

  const limit = parseInt(req.query.limit) || 0;

  // Use an aggregation pipeline to calculate average rating for each book
  const pipeline = [
    // Stage 1: Match books based on the filters
    { $match: filter },
    // Stage 2: Lookup reviews for each book
    {
      $lookup: {
        from: 'bookreviews', // The collection name for BookReview model
        localField: '_id',
        foreignField: 'book',
        as: 'reviews'
      }
    },
    // Stage 3: Add the averageRating field
    {
      $addFields: {
        averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] }
      }
    },
    // Stage 4: Project to reshape the output and remove the reviews array
    {
      $project: {
        reviews: 0 // Exclude the full reviews array from the final output
      }
    },
    // Stage 5: Populate owner details (since $populate is not available in aggregate)
    {
      $lookup: {
        from: 'users', // The collection name for User model
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerInfo'
      }
    },
    { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },
    { $addFields: { 'owner.name': '$ownerInfo.name' } },
    { $project: { ownerInfo: 0 } }
  ];

  if (limit > 0) {
    pipeline.push({ $limit: limit });
  }

  const books = await Book.aggregate(pipeline);

  res.json(books);
});

/**
 * @desc    Fetch books owned by the logged-in user
 * @route   GET /api/books/mybooks
 * @access  Private
 */
const getMyBooks = asyncHandler(async (req, res) => {
  // req.user is available from the 'protect' middleware
  const books = await Book.find({ owner: req.user._id });
  res.json(books);
});

/**
 * @desc    Fetch a single book by ID
 * @route   GET /api/books/:id
 * @access  Public
 */
const getBookById = asyncHandler(async (req, res) => {
  // Populate owner's name, location, and profile picture
  const book = await Book.findById(req.params.id).populate('owner', 'name location profilePic averageRating');

  if (book) {
    // Fetch rentals for the book to determine availability
    const rentals = await Rental.find({ book: book._id });

    // Determine effective status based on rental statuses
    let effectiveStatus = 'Available';
    if (rentals.some(r => ['Accepted', 'Awaiting Payment', 'Awaiting Pickup', 'Lent Out', 'Returning'].includes(r.status))) {
      effectiveStatus = 'Not Available';
    }

    // Fetch book reviews and include reviewer info
    const reviews = await BookReview.find({ book: book._id })
      .populate('reviewer', 'name profilePic')
      .sort({ createdAt: -1 });

    // Calculate average rating and total reviews
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews : 0;

    // Prepare rating breakdown
    const ratingCounts = [5,4,3,2,1].map(star => ({
      stars: star,
      count: reviews.filter(r => r.rating === star).length,
    }));
    const ratingBreakdown = ratingCounts.map(item => ({
      stars: item.stars,
      percentage: totalReviews > 0 ? (item.count / totalReviews) * 100 : 0,
    }));

    // Format individual reviews for frontend
    const individualReviews = reviews.map(r => ({
      id: r._id,
      author: r.reviewer.name,
      date: r.createdAt.toLocaleDateString(),
      rating: r.rating,
      text: r.comment,
      profilePic: r.reviewer.profilePic,
    }));

    // Convert Mongoose doc to plain object to attach properties
    const bookObj = book.toObject();

   
    bookObj.status = effectiveStatus;

    // Attach reviews summary to book object
    if (totalReviews > 0) {
      bookObj.reviews = {
        averageRating,
        totalReviews,
        ratingBreakdown,
        individualReviews,
      };
    } else {
      // If no reviews, provide a default structure so frontend doesn't break.
      bookObj.reviews = { averageRating: 0, totalReviews: 0, ratingBreakdown: [], individualReviews: [] };
    }


    res.json(bookObj);
  } else {
    res.status(404);
    throw new Error('Book not found');
  }
});

/**
 * @desc    Fetch popular books (top rated)
 * @route   GET /api/books/popular
 * @access  Public
 */
const getPopularBooks = asyncHandler(async (req, res) => {

  const books = await Book.aggregate([
    // Stage 1: Lookup reviews for each book
    {
      $lookup: {
        from: 'bookreviews', // The collection name for BookReview model
        localField: '_id',
        foreignField: 'book',
        as: 'reviews'
      }
    },
    // Stage 2: Add the averageRating and totalReviews fields
    {
      $addFields: {
        averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
        totalReviews: { $size: '$reviews' }
      }
    },
    // Stage 3: Sort by averageRating desc, then by totalReviews desc
    { $sort: { averageRating: -1, totalReviews: -1 } },
    // Stage 4: Project to reshape the output and remove the reviews array
    {
      $project: {
        reviews: 0 // Exclude the full reviews array from the final output
      }
    },
    // Stage 6: Populate owner details
    {
      $lookup: {
        from: 'users', // The collection name for User model
        localField: 'owner',
        foreignField: '_id',
        as: 'ownerInfo'
      }
    },
    { $unwind: { path: '$ownerInfo', preserveNullAndEmptyArrays: true } },
    { $addFields: { 'owner.name': '$ownerInfo.name' } },
    { $project: { ownerInfo: 0 } }
  ]);

  res.json(books);
});

/**
 * @desc    Delete a book
 * @route   DELETE /api/books/:id
 * @access  Private
 */
const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    res.status(404);
    throw new Error('Book not found');
  }

  // Check if the logged-in user is the owner
  if (book.owner.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error('Not authorized to delete this book');
  }

  // Check if the book is currently rented or has pending requests
  if (book.status !== 'Available') {
    res.status(400);
    throw new Error('Cannot delete a book that is currently rented or has pending requests');
  }

  // Delete the book
  await Book.findByIdAndDelete(req.params.id);

  res.json({ message: 'Book deleted successfully' });
});

export { addBook, getBooks, getMyBooks, getBookById, getPopularBooks, deleteBook };
