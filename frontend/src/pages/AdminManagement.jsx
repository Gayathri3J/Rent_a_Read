import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import axios from '../api/axios';
import { Trash2, UserCheck, UserX, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from './AuthContext';

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reviews, setReviews] = useState({ bookReviews: [], userReviews: [] });
  const [logs, setLogs] = useState([]);
  const { userInfo: user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is loaded and is admin, redirect if not
    if (user !== null && user.role !== 'admin') {
      navigate('/');
      return;
    }
    // Only fetch data if user is admin
    if (user && user.role === 'admin') {
      fetchData();
    }
  }, [activeTab, user, navigate]);

  const fetchData = async () => {
    try {
      if (activeTab === 'users') {
        const res = await axios.get('/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'books') {
        const res = await axios.get('/admin/books');
        setBooks(res.data);
      } else if (activeTab === 'payments') {
        const res = await axios.get('/admin/payments');
        setPayments(res.data);
      } else if (activeTab === 'reviews') {
        const res = await axios.get('/admin/reviews');
        setReviews(res.data);
      } else if (activeTab === 'logs') {
        const res = await axios.get('/admin/logs');
        setLogs(res.data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/admin/users/${id}`);
        setUsers(users.filter(user => user._id !== id));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleDeleteBook = async (id) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      try {
        await axios.delete(`/admin/books/${id}`);
        setBooks(books.filter(book => book._id !== id));
      } catch (error) {
        console.error('Failed to delete book:', error);
      }
    }
  };

  const handleSuspendUser = async (id) => {
    try {
      await axios.put(`/admin/users/${id}/suspend`, { reason: 'Admin suspension' });
      setUsers(users.map(user => user._id === id ? { ...user, isSuspended: true } : user));
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleUnsuspendUser = async (id) => {
    try {
      await axios.put(`/admin/users/${id}/unsuspend`);
      setUsers(users.map(user => user._id === id ? { ...user, isSuspended: false } : user));
    } catch (error) {
      console.error('Failed to unsuspend user:', error);
    }
  };

  const handleUpdatePaymentStatus = async (id, status) => {
    try {
      await axios.put(`/admin/payments/${id}`, { status });
      setPayments(payments.map(payment => payment._id === id ? { ...payment, status } : payment));
    } catch (error) {
      console.error('Failed to update payment status:', error);
    }
  };

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'books', label: 'Books' },
    { id: 'payments', label: 'Payments' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'logs', label: 'Admin Logs' },
  ];

  // Show loading while user data is being loaded
  if (user === null) {
    return (
      <AdminLayout>
        <div className="bg-slate-50 min-h-screen font-sans text-slate-800 flex items-center justify-center">
          <div className="text-slate-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
        <main className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Admin Management</h1>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-t-lg font-medium ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 border-b-2 border-red-500'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            {activeTab === 'users' && (
              <div>
                <h2 className="text-xl font-bold mb-4">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Role</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} className="border-b">
                          <td className="py-2">{user.name}</td>
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">{user.role}</td>
                          <td className="py-2">
                            {user.isSuspended ? (
                              <span className="text-red-600 font-semibold">Suspended</span>
                            ) : (
                              <span className="text-green-600 font-semibold">Active</span>
                            )}
                          </td>
                          <td className="py-2 space-x-2">
                            {user.isSuspended ? (
                              <button
                                onClick={() => handleUnsuspendUser(user._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Unsuspend User"
                              >
                                <UserCheck size={18} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspendUser(user._id)}
                                className="text-orange-600 hover:text-orange-800"
                                title="Suspend User"
                              >
                                <UserX size={18} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'books' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Book Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Title</th>
                        <th className="text-left py-2">Owner</th>
                        <th className="text-left py-2">Added</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map(book => (
                        <tr key={book._id} className="border-b">
                          <td className="py-2">{book.title}</td>
                          <td className="py-2">{book.owner.name}</td>
                          <td className="py-2">{new Date(book.createdAt).toLocaleDateString()}</td>
                          <td className="py-2">
                            <button
                              onClick={() => handleDeleteBook(book._id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete Book"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Payment Management</h2>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Amount</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map(payment => (
                        <tr key={payment._id} className="border-b">
                          <td className="py-2">₹{payment.amount}</td>
                          <td className="py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              payment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              payment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-2">{new Date(payment.createdAt).toLocaleDateString()}</td>
                          <td className="py-2 space-x-2">
                            {payment.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(payment._id, 'Completed')}
                                className="text-green-600 hover:text-green-800"
                                title="Mark as Completed"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            {payment.status !== 'Failed' && (
                              <button
                                onClick={() => handleUpdatePaymentStatus(payment._id, 'Failed')}
                                className="text-red-600 hover:text-red-800"
                                title="Mark as Failed"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Review Management</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Book Reviews</h3>
                    <div className="space-y-4">
                      {reviews.bookReviews.map(review => (
                        <div key={review._id} className="border p-4 rounded">
                          <p><strong>Book:</strong> {review.book.title}</p>
                          <p><strong>Reviewer:</strong> {review.reviewer.name}</p>
                          <p><strong>Rating:</strong> {review.rating}/5</p>
                          <p><strong>Comment:</strong> {review.comment}</p>
                          <p><strong>Date:</strong> {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">User Reviews</h3>
                    <div className="space-y-4">
                      {reviews.userReviews.map(review => (
                        <div key={review._id} className="border p-4 rounded">
                          <p><strong>Reviewed User:</strong> {review.reviewedUser.name}</p>
                          <p><strong>Reviewer:</strong> {review.reviewer.name}</p>
                          <p><strong>Rating:</strong> {review.rating}/5</p>
                          <p><strong>Comment:</strong> {review.comment}</p>
                          <p><strong>Date:</strong> {new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Admin Logs</h2>
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log._id} className="border p-4 rounded">
                      <p><strong>Admin:</strong> {log.admin.name}</p>
                      <p><strong>Action:</strong> {log.action}</p>
                      <p><strong>Details:</strong> {JSON.stringify(log.details)}</p>
                      <p><strong>Date:</strong> {new Date(log.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminManagement;
