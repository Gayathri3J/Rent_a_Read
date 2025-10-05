import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Calendar, ChevronDown, Send, User, Tag, LoaderCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

// --- Helper & UI Components ---

const StarIcon = ({ className = "w-5 h-5" }) => (
  <svg className={`fill-current ${className}`} viewBox="0 0 20 20">
    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
  </svg>
);

const StarRating = ({ rating, totalStars = 5, size = "w-4 h-4" }) => (
  <div className="flex items-center">
    {[...Array(totalStars)].map((_, index) => (
      <StarIcon
        key={index}
        className={`${size} ${index < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
      />
    ))}
  </div>
);

// Main App Component
export default function Request() {
  // I'm assuming the route is `/request/:id`
  const { id: bookId } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('2 Weeks');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!userInfo) {
      navigate('/login', { replace: true, state: { from: location } });
      return;
    }

    const fetchBook = async () => {
      if (!bookId) {
        setError('No book ID provided.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const { data } = await api.get(`/books/${bookId}`);
        setBook(data);
      
        if (data.owner && data.owner.name) {
          setMessage(`Hi ${data.owner.name.split(' ')[0]}, I'd love to borrow this book!`);
        }
      } catch (err) {
        setError('Could not fetch book details. It might not exist or has been removed.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId, userInfo, navigate, location]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!startDate) {
      setError('Please select a start date.');
      return;
    }
    // Validate startDate is not in the past
    const today = new Date();
    const selectedDate = new Date(startDate);
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Start date cannot be in the past. Please select today or a future date.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/rentals', {
        bookId,
        startDate,
        duration,
        message,
      });
      alert('Request sent successfully!');
      navigate('/rentals'); // Redirect to rentals page
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message === 'Cannot rent your own book') {
        alert('You cannot request to rent your own book.');
      } else if (err.response && err.response.data && err.response.data.message === 'Book is not available') {
        alert('This book is currently not available for rental.');
      } else {
        setError('Failed to send request. Please try again.');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 flex justify-center items-center h-screen">
        <LoaderCircle className="w-16 h-16 text-red-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
        <main className="py-8 md:py-12 max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-slate-800">{error}</h1>
          </div>
        </main>
      </div>
    );
  }

  if (!book) {
    return null; // Or a "Book not found" component
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      <div className="container mx-auto px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 lg:px-8 lg:pt-4 lg:pb-8">
        {/* Main Content */}
        <main className="py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-16">
            
            {/* Left Column: Book Details */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                <img src={book.coverImage} alt={book.title} className="rounded-lg shadow-lg object-cover aspect-[2/3] w-full max-w-60 mx-auto" />
                <div className="space-y-4 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">{book.title}</h1>
                    <p className="text-md text-slate-500 -mt-3">by {book.author}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {book.genres.map((genre) => (
                        <span key={genre} className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">{genre}</span>
                      ))}
                    </div>
                </div>
              </div>
              
              <hr className="my-6 border-slate-200" />
              
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-500 w-20">Owner</p>
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-slate-500" />
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800">{book.owner.name}</p>
                            <StarRating rating={book.owner.averageRating} />
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-500 w-20">Condition</p>
                    <p className="text-sm font-semibold text-slate-700">{book.condition}</p>
                 </div>
              </div>
            </div>

            {/* Right Column: Request Form */}
            <div className="lg:col-span-3">
              <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm h-full">
                <form className="space-y-6" onSubmit={handleRequestSubmit}>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Request This Book</h2>
                        <p className="text-slate-500 mt-1">Set your terms and send a request to {book.owner.name}.</p>
                    </div>

                    <div className="bg-slate-100 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Tag size={18} />
                                <span className="font-semibold">Rental Fee</span>
                            </div>
                            <span className="font-bold text-lg text-slate-800">₹{book.rentalFee.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="text-sm font-semibold text-slate-700 block mb-1.5">Start Date</label>
                            <div className="relative">
                                <input 
                                  type="date" 
                                  id="start-date" 
                                  value={startDate}
                                  onChange={(e) => setStartDate(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" 
                                />
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Calendar className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="duration" className="text-sm font-semibold text-slate-700 block mb-1.5">Duration</label>
                            <div className="relative">
                                <select 
                                  id="duration" 
                                  value={duration}
                                  onChange={(e) => setDuration(e.target.value)}
                                  className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition bg-white"
                                >
                                    <option>2 Weeks</option>
                                    <option>1 Week</option>
                                    <option>3 Weeks</option>
                                    <option>4 Weeks</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <ChevronDown className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="message" className="text-sm font-semibold text-slate-700 block mb-1.5">Message to Owner</label>
                        <textarea 
                          id="message" 
                          rows="4" 
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" 
                          placeholder={`A friendly message to ${book.owner.name.split(' ')[0]}...`}></textarea>
                    </div>
                    
                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                        <Send className="w-5 h-5" />
                        Send Request
                    </button>
                </form>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
