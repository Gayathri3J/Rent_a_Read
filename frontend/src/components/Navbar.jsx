import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, Menu, X, User, LogOut, LayoutDashboard, MessageSquare, BookCopy, PlusCircle, Search } from 'lucide-react';
import { useAuth } from '../pages/AuthContext';
import api from '../api/axios';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { userInfo: user, logout } = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/login');
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Custom hook to debounce a value
  function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearch.trim()) {
        setLoadingSuggestions(true);
        try {
          const { data } = await api.get(`/books?search=${encodeURIComponent(debouncedSearch.trim())}&limit=5`);
          setSuggestions(data);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setSuggestions([]);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearch]);

  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${isActive ? 'text-red-600' : 'text-slate-600 hover:text-red-600'}`;

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-slate-200 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Left Side: Logo and Main Nav */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <BookOpen className="w-7 h-7 text-red-600" />
              <span className="text-xl font-bold text-slate-800">Rent a Read</span>
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <NavLink to="/" className={navLinkClass} end>Home</NavLink>
              <NavLink to="/browse" className={navLinkClass}>Browse</NavLink>
            </nav>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search for books..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  // Delay hiding dropdown to allow click event on suggestions
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                className="w-full max-w-xs pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition"
              />
              {showDropdown && suggestions.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full max-w-xs bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {loadingSuggestions ? (
                    <li className="p-2 text-center text-gray-500">Loading...</li>
                  ) : (
                    suggestions.map((book) => (
                      <li
                        key={book._id}
                        className="cursor-pointer px-4 py-2 hover:bg-red-100"
                        onMouseDown={() => {
                          navigate(`/book/${book._id}`);
                          setSearchQuery('');
                          setShowDropdown(false);
                        }}
                      >
                        <div className="font-semibold truncate">{book.title}</div>
                        <div className="text-xs text-gray-500 truncate">by {book.author}</div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            {user ? (
              // --- Logged In State ---
              <div className="relative" ref={profileRef}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-red-500 transition">
                  <img src={user.profilePic || `https://placehold.co/40x40/E2E8F0/475569?text=${user.name.charAt(0)}`} alt="User profile" className="w-full h-full object-cover" />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-slate-200">
                    <div className="px-4 py-3 border-b border-slate-200">
                      <p className="text-sm font-semibold text-slate-900 truncate" title={user.name}>{user.name}</p>
                      <p className="text-xs text-slate-500 truncate" title={user.email}>{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link to="/rentals" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <BookCopy size={16} /> My Rentals
                      </Link>
                      <Link to="/chat" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <MessageSquare size={16} /> Messages
                      </Link>
                      <Link to="/add-book" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                        <PlusCircle size={16} /> Add Book
                      </Link>
                    </div>
                    <div className="py-1 border-t border-slate-200">
                      <button onClick={handleLogout} className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold">
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // --- Logged Out State ---
              <div className="hidden md:flex items-center">
                    <Link to="/signup" className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors px-5 py-2.5 rounded-lg shadow-sm">
                  Get Started
                </Link>
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
          {/* Mobile nav links here */}
        </div>
      )}
    </header>
  );
};

export default Navbar;