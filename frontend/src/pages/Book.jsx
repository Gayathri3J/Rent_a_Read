import React, { useState, useEffect, useContext } from 'react';
import { User, LoaderCircle, MapPin } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import api from '../api/axios';

// --- Helper & UI Components ---

const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 20 20">
    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
  </svg>
);

const StarRating = ({ rating, totalStars = 5, size = "w-6 h-6" }) => (
  <div className="flex">
    {[...Array(totalStars)].map((_, index) => (
      <StarIcon
        key={index}
        className={`${size} ${index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

const PhotoModal = ({ photo, onClose }) => {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity"
      onClick={onClose}
    >
      <div
        className="relative p-2 bg-white rounded-lg shadow-xl max-w-lg w-11/12"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image/modal content
      >
        <img src={photo} alt="Enlarged book photo" className="w-full h-auto object-contain max-h-[85vh] rounded" />
        <button onClick={onClose} className="absolute top-0 right-0 mt-2 mr-2 text-white bg-black bg-opacity-50 rounded-full p-1.5 hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>
  );
};

const Breadcrumbs = ({ bookTitle }) => (
  <nav className="text-sm text-gray-500 mb-6">
    <Link to="/browse" className="hover:underline">Browse</Link>
    <span className="mx-2">/</span>
    <span>{bookTitle}</span>
  </nav>
);

const BookDetails = ({ book, onPhotoClick, onBorrowClick, isLoggedIn }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
    <div className="md:col-span-1 lg:col-span-1 mt-8">
      <img src={book.coverImage} alt={`Book cover of ${book.title}`} className="rounded-lg shadow-md w-full h-auto object-cover aspect-[2/3]" />
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">Owner's Photos:</h3>
        <div className="grid grid-cols-3 gap-2">
          {book.ownerPhotos.map((photo, index) => (
            <img key={index} src={photo} alt={`Owner's photo ${index + 1} of ${book.title}`} className="rounded-md shadow-sm w-full h-auto object-cover aspect-[2/3] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onPhotoClick(photo)} />
          ))}
        </div>
      </div>
    </div>
    <div className="md:col-span-2 lg:col-span-3">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{book.title}</h1>
      <p className="text-lg text-gray-600 mt-1">by {book.author}</p>
      <hr className="my-6 border-gray-200" />
      <div className="space-y-4 text-gray-700">
        <div className="grid grid-cols-3 gap-4">
          <span className="font-medium text-gray-500">Genres</span>
          <span className="col-span-2">{book.genres.join(', ')}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="font-medium text-gray-500">Condition</span>
          <span className="col-span-2">{book.condition}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="font-medium text-gray-500">Language</span>
          <span className="col-span-2">{book.language}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="font-medium text-gray-500">Rental Fee</span>
          <span className="col-span-2">₹{book.rentalFee.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <span className="font-medium text-gray-500">Pickup Location</span>
          <div className="col-span-2 flex items-start">
            <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-400 flex-shrink-0" />
            <span>{book.location.address}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 items-center">
          <span className="font-medium text-gray-500">Availability</span>
          <div className="col-span-2 flex items-center">
            <span className={`h-2 w-2 ${book.status === 'Not Available' ? 'bg-red-500' : 'bg-green-500'} rounded-full mr-2`}></span>
            <span className={`${book.status === 'Not Available' ? 'text-red-600' : 'text-green-600'} font-semibold`}>
              {book.status}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-6 text-gray-600 leading-relaxed">{book.description}</p>
      {!isLoggedIn && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Log in to request this book.</p>
        </div>
      )}
      <div className="mt-8">
        <button onClick={onBorrowClick} className="w-full sm:w-auto bg-red-600 text-white font-semibold py-3 px-8 rounded-lg shadow-sm hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          {isLoggedIn ? 'Request to Borrow' : 'Login to Borrow'}
        </button>
      </div>
    </div>
  </div>
);

const ReviewSummary = ({ reviews }) => (
  !reviews ? <p className="text-gray-500">No reviews yet.</p> : (
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
    <div className="text-center">
      <p className="text-6xl font-bold text-gray-900">{reviews.averageRating.toFixed(1)}</p>
      <StarRating rating={reviews.averageRating} />
      <p className="text-sm text-gray-500 mt-2">Based on {reviews.totalReviews} reviews</p>
    </div>
    <div className="w-full flex-1">
      <div className="space-y-2">
        {reviews.ratingBreakdown.map((item) => (
          <div key={item.stars} className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{item.stars}</span>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-red-500 h-full rounded-full" style={{ width: `${item.percentage}%` }}></div>
            </div>
            <span className="text-sm text-gray-500 w-8 text-right">{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  </div>
  )
);

const ReviewItem = ({ review }) => (
  <div className="flex items-start space-x-4">
    <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden">
      {review.profilePic ? (
        <img src={review.profilePic} alt={review.author} className="w-full h-full object-cover" />
      ) : (
        <User className="w-6 h-6 text-slate-500" />
      )}
    </div>
    <div>
      <div className="flex items-center space-x-2">
        <p className="font-semibold text-gray-900">{review.author}</p>
        <p className="text-sm text-gray-500">{review.date}</p>
      </div>
      <StarRating rating={review.rating} size="w-4 h-4" />
      <p className="text-gray-600 mt-1">{review.text}</p>
    </div>
  </div>
);

// --- Main Book Page Component ---
export default function Book() {
  const { id } = useParams(); // Get book ID from URL
  const navigate = useNavigate(); // Hook for navigation
  const { userInfo } = useAuth(); // Get user info from your Auth context
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const computeReviewSummary = (reviewsArray) => {
      if (!Array.isArray(reviewsArray) || reviewsArray.length === 0) {
        return { averageRating: 0, totalReviews: 0, ratingBreakdown: [], individualReviews: [] };
      }

      const sanitized = reviewsArray.filter((r) => typeof r?.rating === 'number' && !Number.isNaN(r.rating));
      const totalReviews = sanitized.length;
      if (totalReviews === 0) {
        return { averageRating: 0, totalReviews: 0, ratingBreakdown: [], individualReviews: [] };
      }
      const averageRating = sanitized.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews;

      const stars = [5, 4, 3, 2, 1];
      const ratingBreakdown = stars.map((star) => {
        const count = sanitized.filter((r) => r.rating === star).length;
        return {
          stars: star,
          percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
        };
      });

      const individualReviews = sanitized.map((r) => ({
        id: r._id || r.id,
        author: r.reviewer?.name || r.author || 'Anonymous',
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : r.date || '',
        rating: r.rating,
        text: r.comment || r.text || '',
        profilePic: r.reviewer?.profilePic || r.profilePic || '',
      }));

      return { averageRating, totalReviews, ratingBreakdown, individualReviews };
    };

    const fetchBook = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/books/${id}`);

        // Always fetch raw reviews to ensure latest and compute summary
        try {
          const { data: rawReviews } = await api.get(`/reviews/book/${id}`);
          const summary = computeReviewSummary(rawReviews);
          setBook({ ...data, reviews: summary });
        } catch (innerErr) {
          console.error('Failed to fetch raw book reviews:', innerErr);
          // Use backend-provided reviews if present, else fallback to empty structure
          const reviewsFromBook = data.reviews && typeof data.reviews === 'object' ? data.reviews : { averageRating: 0, totalReviews: 0, ratingBreakdown: [], individualReviews: [] };
          setBook({ ...data, reviews: reviewsFromBook });
        }
      } catch (err) {
        setError('Could not fetch book details. It might not exist.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const openModal = (photo) => {
    setSelectedPhoto(photo);
  };
  const closeModal = () => {
    setSelectedPhoto(null);
  };

  const handleBorrowRequest = () => {
    if (userInfo) {
      // If user is logged in, navigate to the request page
      navigate(`/request/${id}`);
    } else {
      // If not logged in, redirect to login, saving the current location
      navigate('/login', { state: { from: `/book/${id}` } });
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 flex justify-center items-center h-screen">
        <LoaderCircle className="w-16 h-16 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 text-gray-800 font-sans">
        <div className="container mx-auto p-8 text-center">
          <p className="text-red-600 bg-red-100 p-4 rounded-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
        <div className="container mx-auto px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 lg:px-8 lg:pt-4 lg:pb-8 max-w-6xl">
          <Breadcrumbs bookTitle={book.title} />
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-sm">
          <BookDetails 
            book={book} 
            onPhotoClick={openModal}
            onBorrowClick={handleBorrowRequest}
            isLoggedIn={!!userInfo}
          />
            <hr className="my-8 sm:my-10 border-gray-200" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Reviews</h2>
              <ReviewSummary reviews={book.reviews} />
              <hr className="my-8 border-gray-200" />
              <div className="space-y-8">
                {book.reviews?.individualReviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>
            </div>
          </div>
        </div>
      <PhotoModal photo={selectedPhoto} onClose={closeModal} />
    </div>
  );
}
