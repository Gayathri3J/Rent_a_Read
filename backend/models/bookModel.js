import mongoose from 'mongoose';

const bookSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: true },
    genres: [{ type: String, required: true }],
    language: { type: String, required: true },
    condition: {
      type: String,
      required: true,
      enum: ['Like New', 'Good', 'Fair', 'Worn'],
    },
    coverImage: { type: String, required: true },
    rentalFee: { type: Number, required: true, default: 0 },
    ownerPhotos: [{ type: String }],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'users',
    },
    status: {
      type: String,
      required: true,
      enum: ['Available', 'Pending', 'Rented'],
      default: 'Available',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index on the location field for geospatial queries
bookSchema.index({ location: '2dsphere' });

const Book = mongoose.model('books', bookSchema);

export default Book;