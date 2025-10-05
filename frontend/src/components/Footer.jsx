import React from 'react';
// Import the necessary icons from lucide-react
import { Facebook, Twitter, Mail, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
// --- Footer Component --- //
const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Rent a Read</h3>
            <p className="text-gray-400">Sharing the joy of reading by connecting book lovers everywhere.</p>
          </div>
          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white">Home</Link>
              </li>
              <li>
                <Link to="/browse" className="text-gray-400 hover:text-white">Browse Books</Link>
              </li>
              <li><a href="/#how-to-rent" className="text-gray-400 hover:text-white">How It Works</a></li>
              <li><a href="mailto:gayathrij263@gmail.com" className="text-gray-400 hover:text-white">Contact Us</a></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
          {/* Social */}
          <div>
             <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
             <p className="text-gray-400 mb-2">Gayathri J</p>
             <p className="text-gray-400 mb-2">Adoor, Pathanamthitta</p>
             <p className="text-gray-400 mb-2">Phone: +91-6282311754</p>
             <div className="flex space-x-4">
                <a href="mailto:gayathrij263@gmail.com" className="text-gray-400 hover:text-white" aria-label="Email Gayathri J">
                    <Mail className="w-6 h-6" />
                </a>
                <a href="https://www.facebook.com/gayathri.j.35728/" className="text-gray-400 hover:text-white">
                    <Facebook className="w-6 h-6" />
                </a>
                <a href="https://x.com/Gayathri_J_" className="text-gray-400 hover:text-white">
                    <Twitter className="w-6 h-6" />
                 </a>
                <a href="https://www.linkedin.com/in/your-linkedin-profile" className="text-gray-400 hover:text-white">
                    <Linkedin className="w-6 h-6" />
                </a>
             </div>

          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Rent a Read. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
