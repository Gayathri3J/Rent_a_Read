import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../pages/AuthContext';

const AdminLayout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userInfo: user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is loaded and is admin, redirect if not
    if (user !== null && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${isActive ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-8">
            {/* Left Side: Logo and Admin Nav */}
            <div className="flex items-center gap-8">
              <Link to="/admin" className="flex items-center gap-2 flex-shrink-0">
                <BookOpen className="w-7 h-7 text-red-600" />
                <span className="text-xl font-bold text-slate-800">Rent a Read Admin</span>
              </Link>
              <nav className="hidden md:flex items-center gap-8">
                <NavLink to="/admin" className={navLinkClass} end>Dashboard</NavLink>
                <NavLink to="/admin/management" className={navLinkClass}>Management</NavLink>
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-600 hidden md:block">
                    Welcome, {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors px-4 py-2 rounded-lg shadow-sm"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              )}

              <div className="md:hidden">
                <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-red-600">
                  {isOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <nav className="px-4 py-3 space-y-2">
              <Link to="/admin" className="flex items-center gap-3 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded">
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/admin/management" className="flex items-center gap-3 px-2 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded">
                <Settings size={16} /> Management
              </Link>
            </nav>
            <div className="px-4 py-2 border-t border-slate-200">
              <span className="text-sm text-slate-600 block py-2">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-semibold text-red-600 hover:bg-red-50 w-full text-left px-2 py-2 rounded"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-grow pt-16">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
