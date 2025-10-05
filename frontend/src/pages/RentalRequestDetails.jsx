import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MessageCircle, Send, Check, X, User, Star, Copy } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const RentalRequestDetails = () => {
  const { id } = useParams();
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [extending, setExtending] = useState(false);
  const [extensionDuration, setExtensionDuration] = useState('1 Week');
  const [copySuccess, setCopySuccess] = useState('');
  const [pickupCode, setPickupCode] = useState('');
  const [returnCode, setReturnCode] = useState('');
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [confirmingReturn, setConfirmingReturn] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      navigate('/login');
      return;
    }
    fetchRentalDetails();
  }, [id, userInfo, navigate]);

  const fetchRentalDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/rentals/${id}`);
      setRental(data.rental);
    } catch (err) {
      setError('Failed to load rental details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      setUpdating(true);
      await api.put(`/rentals/${id}`, { status });
      // Refresh the rental details
      await fetchRentalDetails();
    } catch (err) {
      setError('Failed to update status');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleExtendRental = async () => {
    try {
      setExtending(true);
      await api.put(`/rentals/${id}/extend`, { duration: extensionDuration });
      await fetchRentalDetails();
      alert('Rental period extended successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extend rental period');
      console.error(err);
    } finally {
      setExtending(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess('Code copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    }).catch(() => {
      setCopySuccess('Failed to copy code.');
      setTimeout(() => setCopySuccess(''), 3000);
    });
  };

  const handleConfirmPickup = async () => {
    try {
      setConfirmingPickup(true);
      await api.put(`/rentals/${id}/confirm-pickup`, { pickupCode });
      await fetchRentalDetails();
      alert('Pickup confirmed successfully!');
      setPickupCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm pickup');
      console.error(err);
    } finally {
      setConfirmingPickup(false);
    }
  };

  const handleConfirmReturn = async () => {
    try {
      setConfirmingReturn(true);
      await api.put(`/rentals/${id}/confirm-return`, { returnCode });
      await fetchRentalDetails();
      alert('Return confirmed successfully!');
      setReturnCode('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm return');
      console.error(err);
    } finally {
      setConfirmingReturn(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-500">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error || 'Rental not found'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  const isLender = rental.lender._id === userInfo._id;
  const isBorrower = rental.borrower._id === userInfo._id;

  if (!isLender && !isBorrower) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
        <Navbar />
        <main className="py-8 md:py-12 max-w-4xl mx-auto px-4">
          <div className="bg-white p-8 rounded-xl shadow-md">
            <h1 className="text-3xl font-bold text-slate-900 mb-6">Rental Request Details</h1>
            <p className="text-red-600 font-semibold">You are not authorized to view this rental request.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
      <Navbar />
      <main className="py-8 md:py-12 max-w-4xl mx-auto px-4">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-6">Rental Request Details</h1>

          {/* Book and User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex gap-4">
              <img src={rental.book.coverImage} alt={rental.book.title} className="w-24 h-32 object-cover rounded-md" />
              <div>
                <h2 className="text-xl font-semibold text-slate-800">{rental.book.title}</h2>
                <p className="text-slate-600">by {rental.book.author}</p>
                <p className="text-sm text-slate-500">Condition: {rental.book.condition}</p>
                <p className="text-lg font-semibold text-green-600">₹{rental.rentalFee.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <img src={isLender ? rental.borrower.profilePic : rental.lender.profilePic} alt={isLender ? rental.borrower.name : rental.lender.name} className="w-16 h-16 rounded-full object-cover" />
              <div className="flex-1">
                <p className="text-sm text-slate-500">{isLender ? 'Borrower' : 'Lender'}:</p>
                <p className="font-semibold text-slate-800">{isLender ? rental.borrower.name : rental.lender.name}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-slate-600">{(isLender ? rental.borrower.averageRating : rental.lender.averageRating).toFixed(1)}</span>
                </div>
                <button
                  onClick={() => {
                    const currentUserId = userInfo._id;
                    const otherUser = isLender ? rental.borrower : rental.lender;
                    const conversationId = [String(currentUserId), String(otherUser._id)].sort().join('-');
                    navigate('/chat', { state: { conversationId, otherUser } });
                  }}
                  className="mt-2 flex items-center gap-2 bg-red-600 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <MessageCircle size={14} />
                  Chat with {isLender ? 'Borrower' : 'Lender'}
                </button>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Rental Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  rental.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                  rental.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                  rental.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                  'bg-slate-100 text-slate-800'
                }`}>
                  {rental.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Duration</p>
                <p className="font-semibold">{rental.duration}</p>
              </div>
              {rental.startDate && (
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="font-semibold">{new Date(rental.startDate).toLocaleDateString()}</p>
                </div>
              )}
              {rental.dueDate && (
                <div>
                  <p className="text-sm text-slate-500">Due Date</p>
                  <p className="font-semibold">{new Date(rental.dueDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {rental.message && (
              <div className="mt-4">
                <p className="text-sm text-slate-500">Initial Message</p>
                <p className="bg-white p-3 rounded-md border">{rental.message}</p>
              </div>
            )}
          </div>

          {/* Confirmation Code Section */}
          {rental.status === 'Awaiting Pickup' && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-300">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pickup Confirmation</h3>
              {isBorrower ? (
                <>
                  <p className="text-yellow-800 text-sm mb-2">Show this code to the lender to confirm pickup:</p>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-xl font-mono font-bold text-yellow-900 select-all">
                      {rental.pickupCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(rental.pickupCode)}
                      className="flex items-center gap-1 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-1 px-3 rounded-lg transition-colors"
                      aria-label="Copy confirmation code"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-yellow-800 text-sm mb-2">Enter the code provided by the borrower to confirm pickup:</p>
                  <div className="flex gap-4 items-end">
                    <div>
                      <label htmlFor="pickup-code" className="text-sm font-semibold text-yellow-800 block mb-1.5">Confirmation Code</label>
                      <input
                        id="pickup-code"
                        type="text"
                        value={pickupCode}
                        onChange={(e) => setPickupCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-yellow-300 focus:ring-2 focus:ring-yellow-300 focus:border-yellow-500 outline-none transition bg-white"
                        placeholder="Enter code"
                      />
                    </div>
                    <button
                      onClick={handleConfirmPickup}
                      disabled={confirmingPickup}
                      className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                    >
                      Confirm Pickup
                    </button>
                  </div>
                </>
              )}
              {copySuccess && <p className="text-green-600 text-sm mt-1">{copySuccess}</p>}
            </div>
          )}

          {rental.status === 'Returning' && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-300">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Return Confirmation</h3>
              {isLender ? (
                <>
                  <p className="text-blue-800 text-sm mb-2">Show this code to the borrower to confirm return:</p>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-xl font-mono font-bold text-blue-900 select-all">
                      {rental.returnCode}
                    </span>
                    <button
                      onClick={() => copyToClipboard(rental.returnCode)}
                      className="flex items-center gap-1 bg-blue-400 hover:bg-blue-500 text-blue-900 font-semibold py-1 px-3 rounded-lg transition-colors"
                      aria-label="Copy confirmation code"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-blue-800 text-sm mb-2">Enter the code provided by the lender to confirm return:</p>
                  <div className="flex gap-4 items-end">
                    <div>
                      <label htmlFor="return-code" className="text-sm font-semibold text-blue-800 block mb-1.5">Confirmation Code</label>
                      <input
                        id="return-code"
                        type="text"
                        value={returnCode}
                        onChange={(e) => setReturnCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 outline-none transition bg-white"
                        placeholder="Enter code"
                      />
                    </div>
                    <button
                      onClick={handleConfirmReturn}
                      disabled={confirmingReturn}
                      className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
                    >
                      Confirm Return
                    </button>
                  </div>
                </>
              )}
              {copySuccess && <p className="text-green-600 text-sm mt-1">{copySuccess}</p>}
            </div>
          )}

          {/* Actions for Lender */}
          {isLender && rental.status === 'Pending' && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => handleStatusUpdate('Accepted')}
                disabled={updating}
                className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-300"
              >
                <Check size={18} />
                Accept Request
              </button>
              <button
                onClick={() => handleStatusUpdate('Rejected')}
                disabled={updating}
                className="flex items-center gap-2 bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:bg-red-300"
              >
                <X size={18} />
                Reject Request
              </button>
            </div>
          )}

          {/* Extension Section for Lender */}
          {isLender && rental.status === 'Lent Out' && (
            <div className="bg-slate-50 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Extend Rental Period</h3>
              <div className="flex gap-4 items-end">
                <div>
                  <label htmlFor="extension-duration" className="text-sm font-semibold text-slate-700 block mb-1.5">Extension Duration</label>
                  <select
                    id="extension-duration"
                    value={extensionDuration}
                    onChange={(e) => setExtensionDuration(e.target.value)}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition bg-white"
                  >
                    <option>1 Week</option>
                    <option>2 Weeks</option>
                    <option>3 Weeks</option>
                    <option>4 Weeks</option>
                  </select>
                </div>
                <button
                  onClick={handleExtendRental}
                  disabled={extending}
                  className="flex items-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                >
                  Extend
                </button>
              </div>
              {rental.extensions && rental.extensions.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">Previous Extensions:</p>
                  <ul className="list-disc list-inside text-sm text-slate-700">
                    {rental.extensions.map((ext, index) => (
                      <li key={index}>{ext.duration} extended on {new Date(ext.extendedAt).toLocaleDateString()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RentalRequestDetails;
