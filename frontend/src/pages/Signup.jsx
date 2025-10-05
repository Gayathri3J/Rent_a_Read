import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { User, Mail, Lock, MapPin, BookOpen } from 'lucide-react';
import { useAuth } from './AuthContext';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await api.post(
        '/users', // baseURL is already set in the instance
        { name, email, password, location },
        config
      );

      // Auto-login after successful signup
      login(data);
      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="flex justify-center items-center">
                <BookOpen className="w-12 h-12 text-red-600" />
                <h2 className="ml-3 text-center text-3xl font-bold tracking-tight text-gray-900">
                    Rent a Read
                </h2>
            </div>
            <h3 className="mt-2 text-center text-lg text-gray-600">
                Create your account
            </h3>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
              {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}
              <form className="space-y-6" onSubmit={submitHandler}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" placeholder="Full Name" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input id="email-address" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" placeholder="Email address" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" placeholder="Password" />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input id="location" name="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition" placeholder="Location (e.g., City, State)" />
                </div>
                <div>
                  <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-md border border-transparent bg-red-600 py-3 px-4 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:bg-red-400">
                    {loading ? 'Creating Account...' : 'Sign up'}
                  </button>
                </div>
                <p className="text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-red-600 hover:text-red-500 focus:outline-none">
                        Sign In
                    </Link>
                </p>
              </form>
            </div>
        </div>
    </div>
  );
};

export default Signup;
