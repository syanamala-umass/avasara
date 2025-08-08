import React, { useState } from 'react';
import { registerUser, getOAuthUrl } from './api';
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
    last_name: ''
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



    try {
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
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

  const handleOAuthLogin = async (provider) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getOAuthUrl(provider);
      const authUrl = response.data.auth_url;
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (err) {
      console.error(`${provider} OAuth error:`, err);
      setError(`Failed to initiate ${provider} login. Please try again.`);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Clean background overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2"
          aria-label="Close signup form"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Join Avasara
          </h2>
          <p className="text-gray-600">Create your account to get started</p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center text-red-700">
              <X className="w-4 h-4 mr-2" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="first_name">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="John"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="last_name">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>
          </div>
          

          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="john@example.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <Users className="w-5 h-5" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>
        
        {/* Divider */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>
          
          {/* OAuth Buttons */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
        
        {/* Login Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <button
              onClick={onShowLogin}
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup; 