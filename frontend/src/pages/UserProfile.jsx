import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star } from 'lucide-react';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userRes, reviewsRes] = await Promise.all([
          fetch(`http://localhost:5001/api/users/${id}`),
          fetch(`http://localhost:5001/api/reviews/user/${id}`)
        ]);
        if (!userRes.ok || !reviewsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        const userData = await userRes.json();
        const reviewsData = await reviewsRes.json();
        setUser(userData);
        setReviews(reviewsData);
      } catch (err) {
        setError('User not found or failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 flex items-center justify-center">
        <div className="text-slate-600">{error || 'User not found'}</div>
      </div>
    );
  }

  const averageRating = user.averageRating || 0;

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <main className="py-8 md:py-12 max-w-4xl mx-auto px-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8">
          <img src={user.profilePic || 'https://via.placeholder.com/128x128?text=User'} alt={user.name} className="w-32 h-32 rounded-full object-cover border-4 border-slate-200" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-slate-500 mt-1">{user.location || 'Location not available'}</p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-1 text-yellow-500">
                {[...Array(Math.floor(averageRating))].map((_, i) => <Star key={i} size={20} className="fill-current" />)}
                {averageRating % 1 !== 0 && <Star size={20} className="fill-current" style={{ clipPath: `inset(0 ${100 - (averageRating % 1) * 100}% 0 0)` }} />}
                {[...Array(5 - Math.ceil(averageRating))].map((_, i) => <Star key={i} size={20} className="text-slate-300 fill-current" />)}
              </div>
              <span className="font-semibold text-slate-700">{averageRating.toFixed(1)}</span>
              <span className="text-slate-500">({reviews.length} reviews)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Reviews from Other Owners</h2>
          <div className="space-y-6">
            {reviews.length > 0 ? (
              reviews.map(review => (
                <div key={review._id} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-slate-800">{review.reviewer?.name || 'Anonymous'}</p>
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Star size={16} className="text-yellow-500 fill-current" />
                      <span className="font-semibold">{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <p className="text-slate-600">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-500">This user has no reviews yet.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
