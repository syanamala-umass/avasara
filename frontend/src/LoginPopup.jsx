import React, { useState } from 'react';
import { loginUser, getOAuthUrl, fetchUserSkills, requestPasswordReset } from './api';
import { X, Mail, Lock, LogIn, AlertCircle, ArrowRight } from 'lucide-react';
import SkillsModal from './components/SkillsModal';

const LoginPopup = ({ isOpen, onClose, onShowSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await loginUser({
        username: email,
        password: password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.access_token) {
        // Store token in localStorage
        localStorage.setItem('token', response.data.access_token);
        
        // Store user data in localStorage
        if (response.data.user) {
          console.log('Storing user data:', response.data.user);
          localStorage.setItem('userData', JSON.stringify(response.data.user));
        } else {
          console.log('No user data in response');
        }
        
        // Check if user has skills
        try {
          const userData = response.data.user;
          if (userData && userData.id) {
            const skillsResponse = await fetchUserSkills(userData.id);
            const userSkills = skillsResponse.data || [];
            
            if (userSkills.length === 0) {
              // User has no skills, show skills modal
              setShowSkillsModal(true);
              return;
            }
          }
        } catch (skillsError) {
          console.error('Error checking user skills:', skillsError);
          // If we can't check skills, proceed to dashboard anyway
        }
        
        // Close popup and redirect
        onClose();
        window.location.href = '/dashboard';
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle validation errors
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // Handle array of validation errors
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else if (typeof err.response.data.detail === 'string') {
          // Handle string error message
          setError(err.response.data.detail);
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else {
        setError('Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsModalComplete = () => {
    // Close popup and redirect to dashboard
    onClose();
    window.location.href = '/dashboard';
  };

  const handleSkillsModalClose = () => {
    // Close skills modal and redirect to dashboard
    setShowSkillsModal(false);
    onClose();
    window.location.href = '/dashboard';
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
    <>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div 
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        ></div>
        
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 relative animate-fadeIn">
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Header */}
          {/* <div className="text-center mb-8">
           
            <p className="text-gray-600">Sign in to your Avasara account</p>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <Mail className="h-5 w-5 text-indigo-400 mr-3" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                <Lock className="h-5 w-5 text-indigo-400 mr-3" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-between items-center">
              <button
                type="button"
                className="text-blue-600 hover:underline text-sm"
                onClick={() => setShowForgotPassword(true)}
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
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
            
            {/* OAuth Buttons (Commented out for now) */}
            {/*
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
              
              <button
                type="button"
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  />
                </svg>
                Continue with GitHub
              </button>
            </div>
            */}
          </div>
          
          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                type="button"
                className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors underline bg-transparent border-none cursor-pointer p-0"
                onClick={() => {
                  onClose();
                  if (onShowSignup) onShowSignup();
                }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Skills Modal */}
      <SkillsModal 
        isOpen={showSkillsModal}
        onClose={handleSkillsModalClose}
        onComplete={handleSkillsModalComplete}
      />

      {/* Placeholder for forgot password modal/page */}
      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => {
            setShowForgotPassword(false);
            setForgotEmail('');
            setForgotError('');
            setForgotSuccess('');
          }}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10 relative animate-fadeIn">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess('');
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-indigo-600 transition-colors"
              aria-label="Close forgot password"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold mb-6 text-center">Reset Password</h2>
            {forgotSuccess ? (
              <div className="mb-6 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-xl w-full text-center text-sm">{forgotSuccess}</div>
            ) : (
              <>
                <p className="mb-6 text-gray-600 text-center text-sm">Enter your email address and we'll send you a link to reset your password.</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setForgotLoading(true);
                    setForgotError('');
                    setForgotSuccess('');
                    try {
                      await requestPasswordReset(forgotEmail);
                      setForgotSuccess('If an account with that email exists, a reset link has been sent.');
                    } catch (err) {
                      setForgotError('Failed to send reset email. Please try again.');
                    } finally {
                      setForgotLoading(false);
                    }
                  }}
                  className="space-y-6 w-full"
                >
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                      <Mail className="h-5 w-5 text-indigo-400 mr-3" />
                      <input
                        type="email"
                        id="forgot-email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
                        placeholder="Enter your email"
                        required
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>
                  {forgotError && <div className="mb-2 text-red-600 text-sm w-full text-center">{forgotError}</div>}
                  <button
                    type="submit"
                    className={`w-full flex justify-center items-center py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                      forgotLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                    disabled={forgotLoading || !forgotEmail}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            )}
            <button
              className="mt-8 text-indigo-600 hover:underline text-sm w-full text-center"
              onClick={() => {
                setShowForgotPassword(false);
                setForgotEmail('');
                setForgotError('');
                setForgotSuccess('');
              }}
            >
              Back to Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginPopup;