import React, { useState } from 'react';
import { registerUser } from './api';
import { 
  X, 
  User, 
  AtSign, 
  Mail, 
  Lock, 
  Shield, 
  Sparkles,
  ArrowRight,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignupPopup = ({ isOpen, onClose, onShowLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name
      });

      if (response.data) {
        // Redirect to check email page
        onClose();
        navigate('/check-email');
        return;
      }
    } catch (err) {
      // Handle validation errors from the backend
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Handle array of validation errors
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else {
          // Handle single error message
          setError(err.response.data.detail);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-8 z-10 mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button at Top Right */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-20"
          aria-label="Close signup form"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 sm:gap-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Join the Community
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">Start your journey with Avasara</p>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-base">
            <div className="flex items-center">
              <X className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="first_name">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="Enter your first name"
                required
                disabled={loading}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="last_name">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="Enter your last name"
                required
                disabled={loading}
              />
            </div>
          </div>
          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="Choose a username"
                required
              />
            </div>
          </div>
          {/* Email */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          {/* Password */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-xs sm:text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          {/* Submit Button */}
          <div className="pt-2 sm:pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-2 sm:py-3 px-6 border border-transparent rounded-xl shadow-lg text-xs sm:text-sm font-semibold text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Join the Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm text-gray-500 mb-4">
            <Users className="w-4 h-4" />
            <span>Already part of our community?</span>
          </div>
          <button
            onClick={() => {
              onClose();
              if (onShowLogin) onShowLogin();
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors text-xs sm:text-base"
          >
            Sign in to your account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup; 