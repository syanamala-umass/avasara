import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const provider = searchParams.get('provider');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (error || errorMessage) {
          setStatus('error');
          setMessage(errorMessage || 'Authentication failed');
          return;
        }

        if (token) {
          // Store the token
          localStorage.setItem('token', token);
          
          // Fetch user data
          try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://avasara-backend.onrender.com';
            const response = await fetch(`${API_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              localStorage.setItem('userData', JSON.stringify(userData));
              setStatus('success');
              setMessage(`Successfully signed in with ${provider}!`);
              
              // Redirect to dashboard after a short delay
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } else {
              throw new Error('Failed to fetch user data');
            }
          } catch (err) {
            console.error('Error fetching user data:', err);
            setStatus('error');
            setMessage('Authentication successful but failed to load user data');
          }
        } else {
          setStatus('error');
          setMessage('No authentication token received');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {getStatusIcon()}
          
          <h2 className={`text-2xl font-bold mt-4 ${getStatusColor()}`}>
            {status === 'loading' && 'Authenticating...'}
            {status === 'success' && 'Authentication Successful!'}
            {status === 'error' && 'Authentication Failed'}
          </h2>
          
          <p className="text-gray-600 mt-2">
            {message}
          </p>
          
          {status === 'loading' && (
            <p className="text-sm text-gray-500 mt-4">
              Please wait while we complete your authentication...
            </p>
          )}
          
          {status === 'error' && (
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Return to Home
              </button>
            </div>
          )}
          
          {status === 'success' && (
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to dashboard...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback; 