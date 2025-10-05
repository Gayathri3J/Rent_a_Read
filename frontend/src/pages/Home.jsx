import React, { useRef, useState, useEffect } from 'react';
// --- Import the necessary icons from lucide-react ---
// Import the necessary icons from lucide-react
import { Search, Calendar, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

// --- Hero Section Component --- //
const HeroSection = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const navigate = useNavigate();

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

    return (
        <div className="relative bg-cover bg-center h-[60vh] min-h-[400px] flex items-center justify-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=2787&auto=format&fit=crop')" }}>
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="relative z-10 text-center text-white px-4">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">Share the Joy of Reading</h1>
                <p className="text-lg md:text-xl max-w-2xl mx-auto">
                    Connect with fellow book lovers and explore a world of stories. Borrow, lend, or rent books within our community.
                </p>
                <div className="mt-8 max-w-xl mx-auto relative">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search for title, author"
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
                            className="w-full px-5 py-3 text-gray-900 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        {showDropdown && suggestions.length > 0 && (
                            <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                {loadingSuggestions ? (
                                    <li className="p-2 text-center text-gray-500">Loading...</li>
                                ) : (
                                    suggestions.map((book) => (
                                        <li
                                            key={book._id}
                                            className="cursor-pointer px-4 py-2 hover:bg-red-100 text-gray-900"
                                            onMouseDown={() => {
                                                navigate(`/book/${book._id}`);
                                                setSearchQuery('');
                                                setShowDropdown(false);
                                            }}
                                        >
                                            <div className="font-semibold">{book.title}</div>
                                            <div className="text-xs text-gray-500">by {book.author}</div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- How To Rent Section --- //
const HowToRent = () => {
    return (
        <section id="how-to-rent" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        How to Rent a Book
                    </h2>
                    <div className="mt-4 w-24 h-1 bg-red-600 mx-auto"></div>
                </div>
                <div className="mt-16 grid md:grid-cols-3 gap-12 text-center">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center">
                        <Search className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold text-gray-800">Step 1: Find a Book</h3>
                        <p className="mt-2 text-gray-600">
                            Use our powerful search to find the book you want to read. Browse by title, author, or genre.
                        </p>
                    </div>
                    {/* Step 2 */}
                    <div className="flex flex-col items-center">
                        <Calendar className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold text-gray-800">Step 2: Request to Rent</h3>
                        <p className="mt-2 text-gray-600">
                            Once you find your book, check its availability and send a rental request to the owner.
                        </p>
                    </div>
                    {/* Step 3 */}
                    <div className="flex flex-col items-center">
                        <Truck className="w-12 h-12 text-blue-600 mb-4" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold text-gray-800">Step 3: Arrange Pickup</h3>
                        <p className="mt-2 text-gray-600">
                            After your request is accepted, coordinate with the owner for a convenient pickup or delivery.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

// --- Popular Books Section (Carousel) --- //
const PopularBooks = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = current.offsetWidth;
            current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    useEffect(() => {
        const fetchPopularBooks = async () => {
            try {
                setLoading(true);
                const response = await api.get('/books/popular');
                setBooks(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load popular books.');
                setLoading(false);
            }
        };
        fetchPopularBooks();
    }, []);

    if (loading) {
        return (
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p>Loading popular books...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-red-600">
                    <p>{error}</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Popular Books
                    </h2>
                    <div className="mt-4 w-24 h-1 bg-red-600 mx-auto"></div>
                </div>

                <div className="mt-16 relative group">
                    <button
                        onClick={() => scroll('left')}
                        className="absolute top-1/2 -left-4 md:-left-6 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 focus:outline-none"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>

                    <div
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                        {books.map((book) => (
                            <div key={book._id} className="snap-start flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 p-2">
                                <Link to={`/book/${book._id}`} className="block group">
                                    <div className="text-center transition-transform duration-300 transform group-hover:-translate-y-2">
                                        <div className="rounded-lg overflow-hidden shadow-lg group-hover:shadow-2xl transition-shadow">
                                            <img src={book.coverImage} alt={`Book cover for ${book.title}`} className="w-full h-auto object-cover aspect-[2/3]" />
                                        </div>
                                        <h3 className="mt-4 text-lg font-bold text-gray-800 truncate group-hover:text-red-600 transition-colors">{book.title}</h3>
                                        <p className="text-gray-500">{book.author}</p>
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                     <button
                        onClick={() => scroll('right')}
                        className="absolute top-1/2 -right-4 md:-right-6 -translate-y-1/2 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition opacity-0 group-hover:opacity-100 focus:outline-none"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                </div>
            </div>
        </section>
    );
};


// --- Main Home Component --- //
export default function Home() {
  return (
    <>
      <HeroSection />
      <HowToRent />
      <PopularBooks />
    </>
  );
}
