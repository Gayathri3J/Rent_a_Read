import React, { useState, useEffect } from 'react';
import { Star, X, User } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { createRazorpayOrder, verifyPayment, openRazorpayPayment } from '../utils/razorpay';

// Status Badge for Lent Books
// (No duplicate declarations of components to avoid redeclaration errors)
const StatusBadge = ({ status }) => {
  const baseClasses = 'text-xs font-semibold px-3 py-1 rounded-full';
  const statusClasses = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Accepted: 'bg-green-100 text-green-800',
    Available: 'bg-green-100 text-green-800',
    'Lent Out': 'bg-blue-100 text-blue-800',
    'Not Available': 'bg-slate-100 text-slate-800', // For "My Books" tab when rented
    'Awaiting Payment': 'bg-blue-100 text-blue-800',
    Rejected: 'bg-red-100 text-red-800',
    Returning: 'bg-blue-100 text-blue-800',
    Completed: 'bg-slate-100 text-slate-800',
  };
  return <span className={`${baseClasses} ${statusClasses[status] || 'bg-slate-100 text-slate-800'}`}>{status}</span>;
};

const ConfirmationModal = ({ book, onConfirm, onCancel }) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Initiate Return?</h2>
        <p className="text-slate-600 mb-6">
          This will notify the owner that you are ready to return{' '}
          <span className="font-semibold">{book.title}</span>.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
};

const ExtendModal = ({ book, onConfirm, onCancel }) => {
  const [duration, setDuration] = useState('1 Week');
  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Extend Rental Period?</h2>
        <p className="text-slate-600 mb-4">
          How long would you like to extend the rental for{' '}
          <span className="font-semibold">{book.title}</span>?
        </p>
        <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md mb-6 focus:ring-2 focus:ring-red-300 outline-none">
          <option>1 Week</option>
          <option>2 Weeks</option>
          <option>3 Weeks</option>
        </select>
        <div className="flex justify-center gap-4">
          <button onClick={onCancel} className="w-full sm:w-auto bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(duration)} className="w-full sm:w-auto bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
            Confirm Extension
          </button>
        </div>
      </div>
    </div>
  );
};

const RequestModal = ({ rental, onAccept, onReject, onCancel }) => {
  if (!rental || !rental.borrower) return null;

  const { borrower } = rental;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Rental Request</h2>

        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
          <img src={rental.imageUrl} alt={rental.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
          <div>
            <p className="font-semibold text-lg text-slate-900">{rental.title}</p>
            <p className="text-sm text-slate-500">You are lending this book.</p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Requested by:</h3>
        <Link to={`/profile/${borrower._id}`} className="block rounded-lg hover:bg-slate-100 transition-colors -mx-2 p-2 mb-4">
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <img src={borrower.profilePic || 'https://via.placeholder.com/64x64?text=User'} alt={borrower.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="font-bold text-slate-900">{borrower.name}</p>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Star size={16} className="text-yellow-500 fill-current" />
                <span>{borrower.rating.toFixed(1)} average rating</span>
              </div>
            </div>
          </div>
        </Link>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => onReject(rental.id)}
            className="bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={() => onAccept(rental.id)}
            className="bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

const BorrowerInfoModal = ({ book, onCancel }) => {
  if (!book || !book.borrower) return null;

  const { borrower } = book;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Borrower Details</h2>
        
        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-4">
          <img src={book.imageUrl} alt={book.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
          <div>
            <p className="font-semibold text-lg text-slate-900">{book.title}</p>
            <p className="text-sm text-slate-500">Status: <StatusBadge status={book.status} /></p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-3">Lent to:</h3>
        <Link to={`/profile/${borrower._id}`} className="block rounded-lg hover:bg-slate-100 transition-colors -mx-2 p-2 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg flex items-center gap-4">
            <img src={borrower.profilePic || 'https://via.placeholder.com/64x64?text=User'} alt={borrower.name} className="w-16 h-16 rounded-full object-cover" />
            <div>
              <p className="font-bold text-slate-900">{borrower.name}</p>
              <div className="flex items-center gap-1 text-sm text-slate-600">
                <Star size={16} className="text-yellow-500 fill-current" />
                <span>{borrower.rating.toFixed(1)} average rating</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

const DeleteModal = ({ book, onConfirm, onCancel }) => {
  if (!book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Book?</h2>
        <p className="text-slate-600 mb-6">
          Are you sure you want to delete <span className="font-semibold">{book.title}</span>? This action cannot be undone.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="w-full sm:w-auto bg-slate-200 text-slate-800 font-semibold py-2 px-6 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
export default function Rentals() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('My Books');
  const [myBooks, setMyBooks] = useState([]);
  const [lentBooks, setLentBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [returnModalBook, setReturnModalBook] = useState(null);
  const [extendModalBook, setExtendModalBook] = useState(null);
  const [requestModalRental, setRequestModalRental] = useState(null);
  const [borrowerInfoModalBook, setBorrowerInfoModalBook] = useState(null);
  const [deleteModalBook, setDeleteModalBook] = useState(null);
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const currentUserId = userInfo?._id;






  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch my books for "My Books" tab
        const myBooksRes = await api.get('/books/mybooks');
        setMyBooks(myBooksRes.data);

        // Fetch lent rentals
        const lentRes = await api.get('/rentals?type=lent');
        const lentBooksMapped = lentRes.data.map(rental => {
          let days = 0;
          const durationStr = rental.duration;
          if (durationStr.includes('Week')) {
            days = parseInt(durationStr) * 7;
          } else if (durationStr.includes('Day')) {
            days = parseInt(durationStr);
          }
          return {
            id: rental._id,
            title: rental.book.title,
            coverImage: rental.book.coverImage,
            imageUrl: rental.book.coverImage,
            status: rental.status || 'Pending',
            borrower: {
              _id: rental.borrower._id,
              name: rental.borrower.name,
              rating: rental.borrower.averageRating,
              profilePic: rental.borrower.profilePic,
            },
            dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
            requestDate: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null,
            rentalFee: rental.rentalFee,
            ownerReviewedBorrower: rental.ownerReviewedBorrower || false,
            returnStatus: rental.returnStatus
          };
        });
        setLentBooks(lentBooksMapped);

        // Fetch borrowed rentals
        const borrowedRes = await api.get('/rentals?type=borrowed');
        const borrowedBooksMapped = borrowedRes.data.map(rental => {
          let days = 0;
          const durationStr = rental.duration;
          if (durationStr.includes('Week')) {
            days = parseInt(durationStr) * 7;
          } else if (durationStr.includes('Day')) {
            days = parseInt(durationStr);
          }
          return {
            id: rental._id,
            bookId: rental.book._id, // Add bookId here
            title: rental.book.title,
            imageUrl: rental.book.coverImage,
            status: rental.status || 'Pending',
            dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
            owner: {
              _id: rental.lender._id,
              name: rental.lender.name,
              rating: rental.lender.averageRating,
              profilePic: rental.lender.profilePic,
            },
            rentalFee: rental.rentalFee,
            returnStatus: rental.status === 'Returning' ? 'Pending' : null,
            borrowerReviewedBook: rental.borrowerReviewedBook || false,
            borrowerReviewedOwner: rental.borrowerReviewedOwner || false
          };
        });
        setBorrowedBooks(borrowedBooksMapped);

      } catch (error) {
        console.error('Could not fetch data', error);
        // Handle error, e.g., show a toast message
      }
    };

    fetchData();
  }, []);

  const handleAcceptRequest = async (bookId) => {
    try {
      await api.put(`/rentals/${bookId}`, { status: 'Accepted' });
      // Refresh data
      const { data } = await api.get('/rentals?type=lent');
      const lentBooksMapped = data.map(rental => {
        let days = 0;
        const durationStr = rental.duration;
        if (durationStr.includes('Week')) {
          days = parseInt(durationStr) * 7;
        } else if (durationStr.includes('Day')) {
          days = parseInt(durationStr);
        }
        return {
          id: rental._id,
          title: rental.book.title,
          coverImage: rental.book.coverImage,
          imageUrl: rental.book.coverImage,
          status: rental.status || 'Pending',
          borrower: {
            _id: rental.borrower._id,
            name: rental.borrower.name,
            rating: rental.borrower.averageRating,
            profilePic: rental.borrower.profilePic,
          },
          dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          requestDate: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null,
          rentalFee: rental.rentalFee,
          ownerReviewedBorrower: rental.ownerReviewedBorrower || false,
          returnStatus: rental.returnStatus
        };
      });
      setLentBooks(lentBooksMapped);
      setRequestModalRental(null);
    } catch (error) {
      console.error('Error accepting request', error);
    }
  };

  const handleRejectRequest = async (bookId) => {
    try {
      await api.put(`/rentals/${bookId}`, { status: 'Rejected' });
      // Refresh data
      const { data } = await api.get('/rentals?type=lent');
      const lentBooksMapped = data.map(rental => {
        let days = 0;
        const durationStr = rental.duration;
        if (durationStr.includes('Week')) {
          days = parseInt(durationStr) * 7;
        } else if (durationStr.includes('Day')) {
          days = parseInt(durationStr);
        }
        return {
          id: rental._id,
          title: rental.book.title,
          coverImage: rental.book.coverImage,
          imageUrl: rental.book.coverImage,
          status: rental.status || 'Pending',
          borrower: {
            _id: rental.borrower._id,
            name: rental.borrower.name,
            rating: rental.borrower.averageRating,
            profilePic: rental.borrower.profilePic,
          },
          dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          requestDate: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null,
          rentalFee: rental.rentalFee,
          ownerReviewedBorrower: rental.ownerReviewedBorrower || false,
          returnStatus: rental.returnStatus
        };
      });
      setLentBooks(lentBooksMapped);
      setRequestModalRental(null);
    } catch (error) {
      console.error('Error rejecting request', error);
    }
  };

  // This function will be passed to the review pages to update the state here
  const handleReviewSubmitted = (rentalId, reviewType) => {
    if (reviewType === 'userFromLent') {
      setLentBooks(prev => prev.map(b => (b.id === rentalId ? { ...b, ownerReviewedBorrower: true } : b)));
    } else if (reviewType === 'bookFromBorrowed') {
      setBorrowedBooks(prev => prev.map(b => (b.id === rentalId ? { ...b, borrowerReviewedBook: true } : b)));
    } else if (reviewType === 'userFromBorrowed') {
      setBorrowedBooks(prev => prev.map(b => (b.id === rentalId ? { ...b, borrowerReviewedOwner: true } : b)));
    }
  };

  const handleConfirmExtension = (duration) => {
    const weeks = parseInt(duration.split(' ')[0]);
    const newLentBooks = lentBooks.map(book => {
      if (book.id === extendModalBook.id) {
        const currentDate = new Date(book.dueDate);
        currentDate.setDate(currentDate.getDate() + weeks * 7);
        const newDueDate = currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
        return { ...book, dueDate: newDueDate };
      }
      return book;
    });

    setLentBooks(newLentBooks);
    setExtendModalBook(null);
  };

  const handleMarkAsReceived = async (bookId) => {
    try {
      await api.put(`/rentals/${bookId}/complete`);
      // Refresh data
      const { data } = await api.get('/rentals?type=lent');
      const lentBooksMapped = data.map(rental => {
        let days = 0;
        const durationStr = rental.duration;
        if (durationStr.includes('Week')) {
          days = parseInt(durationStr) * 7;
        } else if (durationStr.includes('Day')) {
          days = parseInt(durationStr);
        }
        return {
          id: rental._id,
          title: rental.book.title,
          coverImage: rental.book.coverImage,
          imageUrl: rental.book.coverImage,
          status: rental.status || 'Pending',
          borrower: {
            _id: rental.borrower._id,
            name: rental.borrower.name,
            rating: rental.borrower.averageRating,
            profilePic: rental.borrower.profilePic,
          },
          dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          requestDate: rental.createdAt ? new Date(rental.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : null,
          rentalFee: rental.rentalFee,
          ownerReviewedBorrower: rental.ownerReviewedBorrower || false,
          returnStatus: rental.returnStatus
        };
      });
      setLentBooks(lentBooksMapped);
    } catch (error) {
      console.error('Error marking as received', error);
    }
  };

  const handleLentBookClick = (book) => {
    // If the status is 'Pending', open the request modal for accept/reject.
    if (book.status === 'Pending') {
      setRequestModalRental(book);
    } else if (book.borrower && book.status !== 'Rejected') {
      // For any other status with a borrower (Lent Out, Completed, etc.), show their info.
      setBorrowerInfoModalBook(book);
    }
  };

  const handlePayment = async (book) => {
    try {
      // Create Razorpay order
      const orderData = await createRazorpayOrder(book.id);

      // Open Razorpay payment modal
      openRazorpayPayment(
        orderData,
        async (response) => {
          // Payment successful, verify payment
          await verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            book.id
          );

          // Refresh the data to show updated status
          window.location.reload();
        },
        (error) => {
          console.error('Payment failed:', error);
          alert('Payment failed. Please try again.');
        }
      );
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Error initiating payment. Please try again.');
    }
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await api.delete(`/books/${bookId}`);
      // Refresh myBooks
      const myBooksRes = await api.get('/books/mybooks');
      setMyBooks(myBooksRes.data);
      setDeleteModalBook(null);
    } catch (error) {
      console.error('Error deleting book', error);
      alert('Failed to delete book: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleWithdrawRequest = async (rentalId) => {
    try {
      await api.put(`/rentals/${rentalId}/withdraw`);
      // Refresh borrowed rentals
      const borrowedRes = await api.get('/rentals?type=borrowed');
      const borrowedBooksMapped = borrowedRes.data.map(rental => {
        let days = 0;
        const durationStr = rental.duration;
        if (durationStr.includes('Week')) {
          days = parseInt(durationStr) * 7;
        } else if (durationStr.includes('Day')) {
          days = parseInt(durationStr);
        }
        return {
          id: rental._id,
          bookId: rental.book._id,
          title: rental.book.title,
          imageUrl: rental.book.coverImage,
          status: rental.status || 'Pending',
          dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
          owner: {
            _id: rental.lender._id,
            name: rental.lender.name,
            rating: rental.lender.averageRating,
            profilePic: rental.lender.profilePic,
          },
          rentalFee: rental.rentalFee,
          returnStatus: rental.status === 'Returning' ? 'Pending' : null,
          borrowerReviewedBook: rental.borrowerReviewedBook || false,
          borrowerReviewedOwner: rental.borrowerReviewedOwner || false
        };
      });
      setBorrowedBooks(borrowedBooksMapped);
    } catch (error) {
      console.error('Error withdrawing request', error);
      alert('Failed to withdraw request: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
      {/* Main Content */}
      <main className="py-8 md:py-12 max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">My Rentals</h1>

          {/* Tabs */}
          <div className="border-b border-slate-200 mb-8">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('My Books')}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'My Books' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                My Books
              </button>
              <button
                onClick={() => setActiveTab('Lent')}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'Lent' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Lent
              </button>
              <button
                onClick={() => setActiveTab('Borrowed')}
                className={`pb-2 text-sm font-semibold transition-colors ${activeTab === 'Borrowed' ? 'text-red-600 border-b-2 border-red-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Borrowed
              </button>
            </div>
          </div>

          {/* Sections based on active tab */}
          <div>
            {activeTab === 'Lent' && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Books Lent</h2>
                {lentBooks.length > 0 ? (
                  <div className="space-y-4">
                    {lentBooks.map((book) => (
                      <div key={book.id} onClick={() => navigate(`/rentals/${book.id}`)} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-red-300 transition-colors">
                        <div className="flex items-center gap-4">
                          <img src={book.imageUrl || book.coverImage} alt={book.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{book.title}</p>
                            <p className="text-sm text-slate-500">{book.borrower ? (book.status === 'Pending' ? `Requested by ${book.borrower.name}` : `Lent to ${book.borrower.name}`) : 'No active request'}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 space-y-2">
                          {book.status === 'Returning' ? (
                            <StatusBadge status={book.status} />
                          ) : book.status === 'Awaiting Payment' ? (
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge status={book.status} />
                              <p className="text-xs text-slate-400 mt-1">Waiting for payment</p>
                            </div>
                          ) : book.status === 'Completed' ? (
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge status={book.status} />
                              {book.ownerReviewedBorrower ? (
                                <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">Reviewed</span>
                              ) : (
                                <Link
                                  onClick={(e) => e.stopPropagation()} // Prevent parent div's onClick
                                  to="/leave-user-review"
                                  state={{
                                    targetUser: book.borrower,
                                    rentalId: book.id,
                                    reviewType: 'userFromLent'
                                  }}
                                  className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm whitespace-nowrap z-10 relative"
                                >
                                  Review Borrower
                                </Link>
                              )}
                            </div>
                          ) : (
                            <>
                              <StatusBadge status={book.status} />
                              <p className="text-xs text-slate-400 mt-1">
                                {book.status === 'Rejected' ? `Request date: ${book.requestDate}` : `Due: ${book.dueDate}`}
                              </p>
                              {book.status === 'Accepted' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExtendModalBook(book); }}
                                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                >Extend</button>
                              )}




                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-100 rounded-lg">
                    <p className="text-slate-500">You haven't lent any books out yet.</p>
                  </div>
                )}
              </section>
            )}
            {activeTab === 'My Books' && (
              <section>
                <h2 className="text-xl font-bold text-slate-800 mb-4">All My Listed Books</h2>
                {myBooks.length > 0 ? (
                  <div className="space-y-4">
                    {myBooks.map((book) => (
                      <div key={book._id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img src={book.coverImage} alt={book.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{book.title}</p>
                            <p className="text-sm text-slate-500">by {book.author}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {/* Using the same StatusBadge component for consistency */}
                          <StatusBadge status={book.status} />
                          {book.status === 'Available' && (
                            <button
                              onClick={() => setDeleteModalBook(book)}
                              className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-100 rounded-lg">
                    <p className="text-slate-500">You haven't listed any books yet.</p>
                    <Link to="/add-book" className="mt-4 inline-block bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                      Add Your First Book
                    </Link>
                  </div>
                )}
              </section>
            )}
            {activeTab === 'Borrowed' && (
              <section>
                {borrowedBooks.length > 0 ? (
                  <>
                    {/* Awaiting Payment Section */}
                    {borrowedBooks.some(b => b.status === 'Awaiting Payment') && (
                      <div className="mb-8">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Awaiting Your Payment</h2>
                        <div className="space-y-4">
                          {borrowedBooks.filter(b => b.status === 'Awaiting Payment').map((book, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <img src={book.imageUrl} alt={book.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-900">{book.title}</p>
                                  <p className="text-sm text-slate-500">Rental Fee: <span className="font-bold">₹{book.rentalFee.toFixed(2)}</span></p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handlePayment(book)}
                                className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors text-sm whitespace-nowrap"
                              >
                                Pay Now
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {borrowedBooks.some(b => b.status !== 'Awaiting Payment') && (
                      <div>
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Currently Borrowing & History</h2>
                        <div className="space-y-4">
                          {borrowedBooks.filter(b => b.status !== 'Awaiting Payment').map((book) => (
                            <div key={book.id} onClick={() => navigate(`/rentals/${book.id}`)} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between gap-4 cursor-pointer hover:border-red-300 transition-colors">
                              <div className="flex items-center gap-4">
                                <img src={book.imageUrl} alt={book.title} className="w-16 h-24 object-cover rounded-md flex-shrink-0" />
                                <div>
                                  <p className="font-semibold text-slate-900">{book.title}</p>
                                  {book.status !== 'Completed' && (
                                    <p className="text-sm text-slate-500">Due: {book.dueDate}</p>
                                  )}
                                </div>
                              </div>
                            {book.status === 'Completed' ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                {book.borrowerReviewedBook ? (
                                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">Book Reviewed</span>
                                ) : (
                                  <Link
                                    onClick={(e) => e.stopPropagation()}
                                    to="/leave-book-review"
                                    state={{
                                      targetBook: { id: book.bookId, title: book.title, imageUrl: book.imageUrl, coverImage: book.imageUrl },
                                      rentalId: book.id,
                                      reviewType: 'bookFromBorrowed'
                                    }}
                                    className="bg-blue-100 text-blue-700 font-semibold py-2 px-4 rounded-lg hover:bg-blue-200 transition-colors text-sm whitespace-nowrap"
                                  >
                                    Review Book
                                  </Link>
                                )}
                                {book.borrowerReviewedOwner ? (
                                  <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">Owner Reviewed</span>
                                ) : (
                                  <Link
                                    onClick={(e) => e.stopPropagation()}
                                    to="/leave-user-review"
                                    state={{
                                      targetUser: book.owner,
                                      rentalId: book.id,
                                      reviewType: 'userFromBorrowed'
                                    }}
                                    className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 transition-colors text-sm whitespace-nowrap"
                                  >
                                    Review Owner
                                  </Link>
                                )}
                              </div>
                            ) : book.status === 'Returning' ? (
                              <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Return Pending</span>
                            ) : book.status === 'Lent Out' ? (
                              <button onClick={(e) => { e.stopPropagation(); setReturnModalBook(book); }} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-slate-700 active:bg-slate-800 transition-colors text-sm whitespace-nowrap">
                                Initiate Return
                              </button>
                            ) : book.status === 'Pending' ? (
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-yellow-600 whitespace-nowrap">Request Pending</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleWithdrawRequest(book.id); }}
                                  className="bg-slate-200 text-slate-800 font-semibold py-2 px-4 rounded-lg hover:bg-slate-300 transition-colors text-sm whitespace-nowrap"
                                >
                                  Withdraw Request
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm font-semibold text-slate-500 whitespace-nowrap">Status: {book.status}</span>
                            )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-10 bg-slate-100 rounded-lg">
                    <p className="text-slate-500">You haven't borrowed any books yet.</p>
                    <Link to="/browse" className="mt-4 inline-block bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                      Browse Books
                    </Link>
                  </div>
                )}
              </section>
            )}
          </div>
        </main>
      <ConfirmationModal
        book={returnModalBook}
        onConfirm={async () => {
          try {
            await api.put(`/rentals/${returnModalBook.id}/initiate-return`);
            // Refresh data after initiating return
            const { data } = await api.get('/rentals?type=borrowed');
            const borrowedBooksMapped = data.map(rental => {
              let days = 0;
              const durationStr = rental.duration;
              if (durationStr.includes('Week')) {
                days = parseInt(durationStr) * 7;
              } else if (durationStr.includes('Day')) {
                days = parseInt(durationStr);
              }
              return {
                id: rental._id,
                bookId: rental.book._id,
                title: rental.book.title,
                imageUrl: rental.book.coverImage,
                status: rental.status || 'Pending',
                dueDate: rental.dueDate || new Date(new Date(rental.startDate).getTime() + days * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }),
                owner: {
                  _id: rental.lender._id,
                  name: rental.lender.name,
                  rating: rental.lender.averageRating,
                  profilePic: rental.lender.profilePic,
                },
                rentalFee: rental.rentalFee,
                returnStatus: rental.status === 'Returning' ? 'Pending' : null,
                borrowerReviewedBook: rental.borrowerReviewedBook || false,
                borrowerReviewedOwner: rental.borrowerReviewedOwner || false
              };
            });
            setBorrowedBooks(borrowedBooksMapped);
            setReturnModalBook(null);
          } catch (error) {
            console.error('Error initiating return', error);
            alert('Failed to initiate return: ' + (error.response?.data?.message || error.message));
          }
        }}
        onCancel={() => setReturnModalBook(null)}
      />
      <ExtendModal
        book={extendModalBook}
        onConfirm={handleConfirmExtension}
        onCancel={() => setExtendModalBook(null)}
      />
      <RequestModal
        rental={requestModalRental}
        onAccept={handleAcceptRequest}
        onReject={handleRejectRequest}
        onCancel={() => setRequestModalRental(null)}
      />
      <BorrowerInfoModal
        book={borrowerInfoModalBook}
        onCancel={() => {
          setBorrowerInfoModalBook(null);
          // Merge the update function into the existing state to preserve it
          navigate(location.pathname, {
            state: { ...location.state, handleReviewSubmitted },
            replace: true
          });
        }}
      />
      <DeleteModal
        book={deleteModalBook}
        onConfirm={() => handleDeleteBook(deleteModalBook._id)}
        onCancel={() => setDeleteModalBook(null)}
      />
    </div>
  );
}
