import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, LoaderCircle, LocateFixed, Search, X, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import axios from 'axios';


const FilterSidebar = ({
  genres,
  languages,
  filters,
  onFilterChange,
  showAllGenres,
  onToggleShowAllGenres,
  showAllLanguages,
  onToggleShowAllLanguages
}) => {
    const displayedGenres = showAllGenres ? genres : genres.slice(0, 5);
    const displayedLanguages = showAllLanguages ? languages : languages.slice(0, 5);
    return (
    <div className="w-full md:w-64 lg:w-72 flex-shrink-0">
        <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-medium text-gray-700">Genre</h4>
                    <div className="mt-2 space-y-2">
                        {displayedGenres.map(genre => (
                            <div key={genre} className="flex items-center">
                                <input
                                  id={genre}
                                  name={genre}
                                  type="checkbox"
                                  className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600"
                                  checked={filters.genres.includes(genre)}
                                  onChange={() => onFilterChange('genre', genre)}
                                />
                                <label htmlFor={genre} className="ml-3 text-sm text-gray-600">{genre}</label>
                            </div>
                        ))}
                        {genres.length > 5 && (
                            <button
                                onClick={onToggleShowAllGenres}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                {showAllGenres ? 'Show Less' : 'View More Genres'}
                            </button>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700">Price</h4>
                    <div className="mt-1 mb-2 text-sm font-semibold">
                      ₹{filters.minPrice || 0} – ₹{filters.maxPrice || 2000}+
                    </div>
                    <div className="relative w-full h-8">
                      {/* Track */}
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 rounded transform -translate-y-1/2"></div>
                      {/* Range Highlight */}
                      <div
                        className="absolute top-1/2 h-1 bg-red-600 rounded transform -translate-y-1/2"
                        style={{
                          left: `${(filters.minPrice / 2000) * 100}%`,
                          right: `${100 - (filters.maxPrice / 2000) * 100}%`,
                        }}
                      ></div>
                      {/* Min Handle */}
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="10"
                        value={filters.minPrice || 0}
                        onChange={e => {
                          const value = Math.min(Number(e.target.value), Number(filters.maxPrice) - 10);
                          onFilterChange('minPrice', value);
                        }}
                        className="absolute w-full h-8 bg-transparent appearance-none"
                        style={{ zIndex: 3 }}
                      />
                      {/* Max Handle */}
                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="10"
                        value={filters.maxPrice || 2000}
                        onChange={e => {
                          const value = Math.max(Number(e.target.value), Number(filters.minPrice) + 10);
                          onFilterChange('maxPrice', value);
                        }}
                        className="absolute w-full h-8 bg-transparent appearance-none"
                        style={{ zIndex: 4 }}
                      />
                    </div>

                </div>
                <div>
                    <h4 className="text-sm font-medium text-gray-700">Language</h4>
                    <div className="mt-2 space-y-2">
                        {displayedLanguages.map(language => (
                            <div key={language} className="flex items-center">
                                <input
                                  id={language}
                                  name={language}
                                  type="checkbox"
                                  className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600"
                                  checked={filters.languages.includes(language)}
                                  onChange={() => onFilterChange('language', language)}
                                />
                                <label htmlFor={language} className="ml-3 text-sm text-gray-600">{language}</label>
                            </div>
                        ))}
                        {languages.length > 5 && (
                            <button
                                onClick={onToggleShowAllLanguages}
                                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                {showAllLanguages ? 'Show Less' : 'View More Languages'}
                            </button>
                        )}
                    </div>
                </div>
                <div>
                     <h4 className="text-sm font-medium text-gray-700">Availability</h4>
                     <div className="mt-2 flex items-center">
                        <input
                          id="available"
                          name="available"
                          type="checkbox"
                          className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600"
                          checked={filters.availability.includes('Available')}
                          onChange={() => onFilterChange('availability', 'Available')}
                        />
                        <label htmlFor="available" className="ml-3 text-sm text-gray-600">Available Now</label>
                    </div>
                     {/* <div className="mt-2 flex items-center">
                        <input
                          id="rented"
                          name="rented" type="checkbox"
                          className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500 accent-red-600"
                          checked={filters.availability.includes('Rented')}
                          onChange={() => onFilterChange('availability', 'Rented')}
                        />
                        <label htmlFor="rented" className="ml-3 text-sm text-gray-600">Rented</label>
                    </div> */}
                </div>
            </div>
        </div>
    </div>
    );
};

const MainFilters = ({ filters, onFilterChange }) => (
  <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      {/* Search */}
      <div className="lg:col-span-2">
        <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search by Title or Author</label>
        <div className="relative mt-1">
          <input 
            type="text" 
            id="search" 
            placeholder="The Midnight Library..." 
            className="w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 pl-8"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
      {/* Location */}
      <div className="lg:col-span-2">
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
        <div className="relative mt-1">
          <input
            type="text"
            id="location"
            placeholder="Enter a city or address"
            className="w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-2 pl-8"
            value={filters.location.address}
            onChange={(e) => onFilterChange('location_address', e.target.value)}
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {filters.location.address && (
                <button onClick={() => onFilterChange('clear_location')} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            )}
            <button onClick={() => onFilterChange('use_current_location', true)} className="text-gray-400 hover:text-red-600" title="Use my current location">
                <LocateFixed size={16} />
            </button>
          </div>
        </div>
      </div>
      {/* Radius */}
      <div className="lg:col-span-1">
        <label htmlFor="radius" className="block text-sm font-medium text-gray-700">Radius</label>
        <select
            key={`radius-${filters.location.lat ? 'enabled' : 'disabled'}`}
            id="radius"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 sm:text-sm p-2"
            value={filters.location.radius}
            onChange={(e) => onFilterChange('radius', e.target.value)}
            disabled={!filters.location.lat}
        >
            <option value="5">5 km</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="">Any</option>
        </select>
      </div>
    </div>
  </div>
);

const BookCard = ({ book }) => (
  <Link to={`/book/${book._id}`} className="group block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
    <div className="relative">
      <img 
        src={book.coverImage} 
        alt={book.title} 
        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-1">
        <Star className="w-3 h-3 text-yellow-500 fill-current" />
        <span>
          {book.averageRating ? book.averageRating.toFixed(1) : 'New'}
        </span>
      </div>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-slate-800 truncate group-hover:text-red-600 transition-colors">{book.title}</h3>
      <p className="text-sm text-slate-500 truncate">by {book.author}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{book.location.address.split(',')[0]}</span>
        </div>
        <span className="text-md font-semibold text-green-600">₹{book.rentalFee.toFixed(2)}</span>
      </div>
    </div>
  </Link>
);

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

// --- Main App Component ---
export default function Browse() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allGenres, setAllGenres] = useState([]);
  const [allLanguages, setAllLanguages] = useState([]);
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    genres: [],
    languages: [],
    availability: [],
    minPrice: '',
    maxPrice: '',
    location: {
      address: '',
      lat: null,
      lng: null,
      radius: '10', // Default radius
    },
  });

  // Debounce search and address inputs to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search, 500);
  const debouncedAddress = useDebounce(filters.location.address, 1000);

  const genresString = filters.genres.join(',');
  const languagesString = filters.languages.join(',');
  const availabilityString = filters.availability.join(',');

  // Effect to fetch books when filters change
  useEffect(() => {
    const fetchFilteredBooks = async () => {
      // Show loading indicator on every filter change
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (genresString) params.append('genres', genresString);
      if (languagesString) params.append('languages', languagesString);
      if (availabilityString) {
        params.append('availability', availabilityString);
      }

      if (filters.location.lat && filters.location.lng &&
          filters.location.radius)
       {
        params.append('lat', filters.location.lat);
        params.append('lng', filters.location.lng);
        params.append('radius', filters.location.radius);
      }

      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

      try {
        const url = `/books?${params.toString()}`;
        const { data } = await api.get(url);

        setBooks(data);
        
        //Extract unique genres from the fetched books
        //setAllGenres(uniqueGenres);
        if (allGenres.length === 0 && !params.has('genres')) {
          const uniqueGenres = [...new Set(data.flatMap(book => book.genres))].sort();
          setAllGenres(uniqueGenres);
        }
        if (allLanguages.length === 0 && !params.has('languages')) {
          const uniqueLanguages = [...new Set(data.map(book => book.language))].sort();
          setAllLanguages(uniqueLanguages);
        }
      } catch (err) {
        setError('Could not fetch books. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredBooks();
  }, [debouncedSearch, genresString, languagesString, availabilityString, filters.location.lat, filters.location.lng, filters.location.radius, filters.minPrice, filters.maxPrice]);

  // Effect for geocoding the debounced address
  useEffect(() => {
    if (debouncedAddress && debouncedAddress !== 'My Current Location') {
      const geocodeAddress = async () => {
        try {
          const { data } = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedAddress)}&limit=1`);
          if (data && data.length > 0) {
            setFilters(prev => ({
              ...prev,
              location: {
                ...prev.location,
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              }
            }));
          }
        } catch (err) {
          console.error("Geocoding failed:", err);
          // Optionally show a small error to the user
        }
      };
      geocodeAddress();
    }
  }, [debouncedAddress]);


  const handleFilterChange = (type, value) => {
    if (type === 'use_current_location') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setFilters(prev => ({
              ...prev,
              location: {
                address: 'My Current Location',
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                radius: prev.location.radius || '10', // Ensure radius is not lost
              }
            }));
          },
          (error) => {
            console.error("Error getting location", error);
            alert("Could not get your location. Please enable location services in your browser.");
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
      return;
    }

    setFilters(prevFilters => {
      switch (type) {
        case 'search':
          return { ...prevFilters, search: value };
        case 'genre': {
          const newGenres = prevFilters.genres.includes(value)
            ? prevFilters.genres.filter((g) => g !== value)
            : [...prevFilters.genres, value, 'Pending']; // Also include Pending when Available is checked
          return { ...prevFilters, genres: newGenres };
        }
        case 'language': {
          const newLanguages = prevFilters.languages.includes(value)
            ? prevFilters.languages.filter((l) => l !== value)
            : [...prevFilters.languages, value];
          return { ...prevFilters, languages: newLanguages };
        }
        case 'availability': {
          const newAvailability = prevFilters.availability.includes(value)
            ? prevFilters.availability.filter(a => a !== value)
            : [...prevFilters.availability, value];
          return { ...prevFilters, availability: newAvailability };
        }
        case 'location_address':
          return { ...prevFilters, location: { ...prevFilters.location, address: value, lat: null, lng: null } };
        case 'radius':
          return { ...prevFilters, location: { ...prevFilters.location, radius: value } };
        case 'clear_location':
          return { ...prevFilters, location: { address: '', lat: null, lng: null, radius: '10' } };
        case 'minPrice':
          return { ...prevFilters, minPrice: value };
        case 'maxPrice':
          return { ...prevFilters, maxPrice: value };
        default:
          return prevFilters;
      }
    });
  };

  // The filtering logic is now on the backend.
  // The `books` state will always hold the filtered list from the API.
  const filteredBooks = books;

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Books</h1>
          <MainFilters filters={filters} onFilterChange={handleFilterChange} />
          <div className="flex flex-col md:flex-row gap-8">
              <FilterSidebar
                genres={allGenres}
                languages={allLanguages}
                filters={filters}
                onFilterChange={handleFilterChange}
                showAllGenres={showAllGenres}
                onToggleShowAllGenres={() => setShowAllGenres(!showAllGenres)}
                showAllLanguages={showAllLanguages}
                onToggleShowAllLanguages={() => setShowAllLanguages(!showAllLanguages)}
              />
              <div className="flex-1">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <LoaderCircle className="w-12 h-12 text-red-600 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-10 bg-red-50 text-red-700 rounded-lg">
                    <p>{error}</p>
                  </div>
                ) : (
                  filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredBooks.map(book => <BookCard key={book._id} book={book} />)}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-slate-100 rounded-lg">
                      {filters.location.lat && filters.location.radius ? (
                        <p className="text-slate-500">No books found within {filters.location.radius}km of the selected location.</p>
                      ) : (
                        <p className="text-slate-500">No books match the current filters.</p>
                      )}
                    </div>
                  )
                )}
              </div>
          </div>
      </div>
    </div>
  );
}
