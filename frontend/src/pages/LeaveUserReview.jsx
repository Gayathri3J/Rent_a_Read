import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const StarRating = ({ rating, setRating }) => {
  return (
    <div className="flex items-center gap-2">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => setRating(starValue)}
            className="transition-transform transform hover:scale-110"
          >
            <Star
              size={36}
              className={`
                ${starValue <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                transition-colors
              `}
            />
          </button>
        );
      })}
    </div>
  );
};

const LeaveUserReview = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { state } = useLocation();
  const { targetUser, rentalId, reviewType, handleReviewSubmitted } = state || {
    targetUser: { id: 'user-jane-doe', name: 'Jane Doe', profilePic: 'https://placehold.co/80x80/e0e0e0/333?text=JD' },
    rentalId: null,
    reviewType: null,
    handleReviewSubmitted: () => {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rentalId || !targetUser.id || rating === 0 || !comment) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await api.post('/reviews/user', {
        rentalId,
        reviewedUserId: targetUser.id,
        rating,
        comment
      });
      if (handleReviewSubmitted) {
        handleReviewSubmitted(rentalId, reviewType);
      }
      alert('Review submitted successfully!');
      navigate('/rentals');
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
      <main className="py-8 md:py-12 max-w-2xl mx-auto px-4">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Review User</h1>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg mb-6">
            <img src={targetUser.profilePic} alt={targetUser.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="text-sm text-slate-500">You are reviewing:</p>
              <p className="font-bold text-lg text-slate-800">{targetUser.name}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-lg font-semibold text-slate-700 block mb-3">Your Rating</label>
              <StarRating rating={rating} setRating={setRating} />
            </div>

            <div>
              <label htmlFor="comment" className="text-lg font-semibold text-slate-700 block mb-2">Your Comments</label>
              <textarea
                id="comment"
                rows="5"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-300 outline-none transition"
                placeholder={`How was your experience with ${targetUser.name}?`}
              ></textarea>
            </div>

            <button type="submit" disabled={rating === 0 || !comment || loading} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed">
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default LeaveUserReview;
