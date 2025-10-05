import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Book from './pages/Book';
import Request from './pages/Request';
import Browse from './pages/Browse';
import AddBook from './pages/AddBook';
import Rentals from './pages/Rentals';
import RentalRequestDetails from './pages/RentalRequestDetails';
import UserProfile from './pages/UserProfile';
import LeaveBookReview from './pages/LeaveBookReview';
import LeaveUserReview from './pages/LeaveUserReview';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import AdminManagement from './pages/AdminManagement';
import { AuthProvider } from './pages/AuthContext';

function App() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isAdminPage = location.pathname.startsWith('/admin');
  const hideFooter = isAuthPage || location.pathname === '/chat' || isAdminPage;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
      <div className="flex flex-col min-h-screen">
        {!isAuthPage && !isAdminPage && <Navbar />}
        <main className={`flex-grow ${(!isAuthPage && !isAdminPage) ? 'pt-16' : ''}`}>
          <ToastContainer />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/book/:id" element={<Book />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/request/:id" element={<Request />} />
            <Route path="/add-book" element={<AddBook />} />
            <Route path="/rentals" element={<Rentals />} />
            <Route path="/rentals/:id" element={<RentalRequestDetails />} />
            <Route path="/leave-book-review" element={<LeaveBookReview />} />
            <Route path="/leave-user-review" element={<LeaveUserReview />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/management" element={<AdminManagement />} />
          </Routes>
        </main>
        {!hideFooter && <Footer />}
      </div>
  );
}

export default App;
