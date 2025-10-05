import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { Users, Book as BookIcon, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';

const StatCard = ({ title, value, icon: Icon, change, changeType, period }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <Icon className="w-6 h-6 text-slate-400" />
    </div>
    <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    {change && period && (
      <div className="flex items-center text-sm mt-2">
        <span className={`flex items-center font-semibold ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
          {changeType === 'increase' ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
          {change}
        </span>
        <span className="text-slate-500 ml-2">{period}</span>
      </div>
    )}
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    activeRentals: 0,
  });
  const [rentalActivityData, setRentalActivityData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const { userInfo: user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is loaded and is admin, redirect if not
    if (user !== null && user.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRes = await axios.get('/admin/users');
        const users = usersRes.data;
        setStats(prev => ({ ...prev, totalUsers: users.length }));
        setRecentUsers(users.slice(-5).reverse().map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          joined: new Date(user.createdAt).toLocaleDateString(),
        })));

        const booksRes = await axios.get('/admin/books');
        const books = booksRes.data;
        setStats(prev => ({ ...prev, totalBooks: books.length }));
        setRecentBooks(books.slice(-5).reverse().map(book => ({
          id: book._id,
          title: book.title,
          owner: book.owner.name,
          added: new Date(book.createdAt).toLocaleDateString(),
        })));

        const rentalsRes = await axios.get('/admin/rentals');
        const rentals = rentalsRes.data;
        const activeRentalsCount = rentals.filter(r => r.status === 'Lent Out' || r.status === 'Awaiting Pickup').length;
        setStats(prev => ({ ...prev, activeRentals: activeRentalsCount }));

        // Prepare rental activity data (monthly counts)
        const monthlyCounts = {};
        rentals.forEach(rental => {
          const month = new Date(rental.createdAt).toLocaleString('default', { month: 'short' });
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const rentalActivity = months.map(month => ({
          month,
          rentals: monthlyCounts[month] || 0,
        }));
        setRentalActivityData(rentalActivity);
      } catch (error) {
        console.error('Failed to fetch admin dashboard data:', error);
      }
    };

    fetchData();
  }, []);

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


  const maxRentals = Math.max(...rentalActivityData.map(d => d.rentals), 1);

  return (
    <AdminLayout>
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800">
        <main className="py-8 md:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">Admin Dashboard</h1>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Users" value={stats.totalUsers} icon={Users} />
            <StatCard title="Total Books" value={stats.totalBooks} icon={BookIcon} />
            <StatCard title="Active Rentals" value={stats.activeRentals} icon={ArrowRightLeft} />
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rental Activity Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Rental Activity</h2>
              <div className="flex justify-between items-end h-64 px-2">
                {rentalActivityData.map(data => (
                  <div key={data.month} className="flex-1 flex flex-col items-center mx-1">
                    <div
                      className="w-full bg-red-400 rounded-t-md transition-colors min-h-[8px]"
                      style={{
                        height: data.rentals > 0 ? `${Math.max((data.rentals / maxRentals) * 100, 12)}%` : '8px',
                        backgroundColor: data.rentals > 0 ? '#f87171' : '#f1f5f9'
                      }}
                      title={`${data.rentals} rentals`}
                    ></div>
                    <p className="text-xs font-semibold text-slate-500 mt-2">{data.month}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Users */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Sign-ups</h3>
                <ul className="space-y-4">
                  {recentUsers.map(user => (
                    <li key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                      <p className="text-xs text-slate-400">{user.joined}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* New Books Added Section Below Chart */}
          <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4">New Books Added</h3>
            <ul className="space-y-4">
              {recentBooks.map(book => (
                <li key={book.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{book.title}</p>
                    <p className="text-sm text-slate-500">by {book.owner}</p>
                  </div>
                  <p className="text-xs text-slate-400">{book.added}</p>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
