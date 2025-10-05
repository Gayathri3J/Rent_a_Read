import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Book, Tag, Type, MapPin, UploadCloud, DollarSign, IndianRupee, X } from 'lucide-react';
import api from '../api/axios';

const AddBook = () => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genres, setGenres] = useState('');
  const [language, setLanguage] = useState('English');
  const [condition, setCondition] = useState('Like New');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [rentalFee, setRentalFee] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [ownerPhotos, setOwnerPhotos] = useState([]);

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();

      // Append text data
      const genresArray = genres.split(',').map(g => g.trim()).filter(g => g);
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      genresArray.forEach(genre => formData.append('genres[]', genre));
      formData.append('language', language);
      formData.append('condition', condition);
      formData.append('rentalFee', Number(rentalFee));
      formData.append('address', address);

      // Append files
      if (coverImage) {
        formData.append('coverImage', coverImage);
      }
      ownerPhotos.forEach(photo => {
        formData.append('ownerPhotos', photo);
      });
      
      await api.post('/books', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/browse'); // Redirect to browse page on success
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the book.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // The first file becomes the cover image
    if (!coverImage) {
      setCoverImage(files.shift());
    }
    
    // The rest are added to owner photos
    setOwnerPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setOwnerPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-800 pt-16">
      <Navbar />
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Add a New Book</h1>
          <p className="text-slate-500 mb-8">Fill out the details below to list your book for others to borrow or rent.</p>
          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

          <form className="space-y-6" onSubmit={submitHandler}>
            {/* Book Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="text-sm font-semibold text-slate-700 block mb-1.5">Book Title</label>
                <div className="relative">
                  <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., The Midnight Library" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Book className="w-5 h-5" /></div>
                </div>
              </div>
              {/* Author */}
              <div>
                <label htmlFor="author" className="text-sm font-semibold text-slate-700 block mb-1.5">Author</label>
                <div className="relative">
                  <input type="text" id="author" value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="e.g., Matt Haig" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Type className="w-5 h-5" /></div>
                </div>
              </div>
            </div>

            {/* Genre & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="genre" className="text-sm font-semibold text-slate-700 block mb-1.5">Genre</label>
                <div className="relative">
                  <input type="text" id="genre" value={genres} onChange={(e) => setGenres(e.target.value)} required placeholder="e.g., Fantasy, Sci-Fi" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Tag className="w-5 h-5" /></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">Separate multiple genres with a comma.</p>
              </div>
              <div>
                <label htmlFor="condition" className="text-sm font-semibold text-slate-700 block mb-1.5">Condition</label>
                <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition bg-white">
                  <option>Like New</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Worn</option>
                </select>
              </div>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="language" className="text-sm font-semibold text-slate-700 block mb-1.5">Language</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} required className="w-full py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition bg-white">
                <option>English</option>
                <option>Malayalam</option>
                <option>Hindi</option>
                <option>Tamil</option>
                <option>Telugu</option>
                <option>Kannada</option>
                <option>Bengali</option>
                <option>Gujarati</option>
                <option>Marathi</option>
                <option>Punjabi</option>
                <option>Urdu</option>
                <option>Odia</option>
                <option>Assamese</option>
                <option>Spanish</option>
                <option>French</option>
                <option>German</option>
                <option>Chinese</option>
                <option>Japanese</option>
                <option>Korean</option>
                <option>Arabic</option>
                <option>Russian</option>
                <option>Portuguese</option>
                <option>Italian</option>
              </select>
            </div>
            
            {/* Rental Fee & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="rentalFee" className="text-sm font-semibold text-slate-700 block mb-1.5">Rental Fee</label>
                <div className="relative">
                  <input type="number" id="rentalFee" value={rentalFee} onChange={(e) => setRentalFee(e.target.value)} required placeholder="e.g., 5.00" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" step="0.01" min="0" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IndianRupee className="w-5 h-5" /></div>
                </div>
              </div>
              <div>
                <label htmlFor="address" className="text-sm font-semibold text-slate-700 block mb-1.5">Pickup Address</label>
                <div className="relative">
                  <input type="text" id="address" value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="e.g., Kazhakoottam, Thiruvananthapuram, Kerala" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><MapPin className="w-5 h-5" /></div>
                </div>
                <p className="text-xs text-slate-400 mt-1">This helps nearby users find your book.</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="text-sm font-semibold text-slate-700 block mb-1.5">Description</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows="4" className="w-full p-4 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" placeholder="Share a brief summary of the book and its condition..."></textarea>
            </div>

            {/* Photo Upload */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Book Photos</label>
              {/* File Input Area */}
              <div className="mt-1">
                <label htmlFor="file-upload" className="relative flex justify-center w-full px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md cursor-pointer hover:border-red-400 transition-colors">
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex text-sm text-slate-600">
                        <span className="font-medium text-red-600">Upload files</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} accept="image/*" />
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">First image is the cover. PNG, JPG up to 10MB.</p>
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {(coverImage || ownerPhotos.length > 0) && (
                <div className="mt-6">
                  {coverImage && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">Cover Photo</p>
                      <div className="relative w-24 h-36">
                        <img src={URL.createObjectURL(coverImage)} alt="Cover preview" className="w-full h-full object-cover rounded-md shadow-md" />
                        <button type="button" onClick={() => setCoverImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><X size={14} /></button>
                      </div>
                    </div>
                  )}
                  {ownerPhotos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-700 mb-2">Additional Photos</p>
                      <div className="flex flex-wrap gap-4">
                        {ownerPhotos.map((photo, index) => (
                          <div key={index} className="relative w-24 h-36">
                            <img src={URL.createObjectURL(photo)} alt={`Owner photo ${index + 1}`} className="w-full h-full object-cover rounded-md shadow-md" />
                            <button type="button" onClick={() => removePhoto(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-lg"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed">
                <Book className="w-5 h-5" />
                {loading ? 'Listing Book...' : 'List My Book'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddBook;