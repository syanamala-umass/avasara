import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import SkillsModal from './SkillsModal';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (error || errorMessage) {
          setStatus('error');
          setMessage(errorMessage || 'Authentication failed');
          return;
        }

        if (code) {
          console.log('Received OAuth code:', code);
          // Exchange code for token with backend
          try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
            console.log('Calling backend at:', `${API_URL}/oauth/token`);
            
            const response = await fetch(`${API_URL}/oauth/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                provider: 'google',
                code: code
              })
            });
            
            console.log('Backend response status:', response.status);
            
            if (response.ok) {
              const data = await response.json();
              console.log('Backend response data:', data);
              const token = data.access_token;
              const userData = data.user;  // User data is already included in the response
              
              // Store the token and user data
              localStorage.setItem('token', token);
              localStorage.setItem('userData', JSON.stringify(userData));
              
              setStatus('success');
              setMessage('Successfully signed in with Google!');
              setUserData(userData);
              
              // Check if user has skills - only show skills modal for new OAuth users
              try {
                if (userData && userData.id) {
                  // Only show skills modal for new OAuth users who have no skills
                  const isNewUser = userData.is_new_user === true;
                  
                  if (isNewUser) {
                    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
                    const skillsResponse = await fetch(`${API_URL}/users/${userData.id}/skills`, {
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      }
                    });
                    
                    if (skillsResponse.ok) {
                      const skillsData = await skillsResponse.json();
                      const userSkills = skillsData.data || [];
                      
                      if (userSkills.length === 0) {
                        // New OAuth user has no skills, show skills modal
                        setShowSkillsModal(true);
                        return; // Don't redirect to dashboard, let skills modal handle it
                      }
                    }
                  }
                }
              } catch (skillsError) {
                console.error('Error checking user skills:', skillsError);
                // If we can't check skills, proceed to dashboard anyway
              }
              
              // Only redirect to dashboard if user has skills or skills check failed
              navigate('/dashboard');
            } else {
              const errorText = await response.text();
              console.error('Backend error response:', errorText);
              let errorMessage = 'Failed to authenticate with Google';
              try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.detail || errorMessage;
              } catch (e) {
                errorMessage = errorText || errorMessage;
              }
              throw new Error(errorMessage);
            }
          } catch (err) {
            console.error('Error processing OAuth callback:', err);
            setStatus('error');
            setMessage(err.message || 'Authentication failed. Please try again.');
          }
        } else {
          setStatus('error');
          setMessage('No authorization code received from Google');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate]);

  const handleSkillsModalComplete = () => {
    // Close skills modal and redirect to dashboard
    setShowSkillsModal(false);
    navigate('/dashboard', { replace: true });
  };

  const handleSkillsModalClose = () => {
    // Close skills modal and redirect to dashboard
    setShowSkillsModal(false);
    navigate('/dashboard', { replace: true });
  };

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
      
      {/* Skills Modal - exactly like login popup */}
      <SkillsModal 
        isOpen={showSkillsModal}
        onClose={handleSkillsModalClose}
        onComplete={handleSkillsModalComplete}
      />
    </div>
  );
};

export default OAuthCallback; 