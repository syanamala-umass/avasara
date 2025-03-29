import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 text-xl font-bold">
              Startup Platform
            </Link>
            <div className="ml-10">
              <div className="flex items-baseline space-x-4">
                <Link to="/" className="px-3 py-2 rounded-md hover:bg-blue-700">
                  Home
                </Link>
                {currentUser ? (
                  <>
                    {currentUser.user_type === 'startup_admin' ? (
                      <>
                        <Link to="/startup/dashboard" className="px-3 py-2 rounded-md hover:bg-blue-700">
                          Dashboard
                        </Link>
                        <Link to="/startup/tasks/create" className="px-3 py-2 rounded-md hover:bg-blue-700">
                          Post Task
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link to="/contributor/dashboard" className="px-3 py-2 rounded-md hover:bg-blue-700">
                          Dashboard
                        </Link>
                        <Link to="/contributor/tasks" className="px-3 py-2 rounded-md hover:bg-blue-700">
                          Find Tasks
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <Link to="/register" className="px-3 py-2 rounded-md hover:bg-blue-700">
                    Register
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div>
            {currentUser ? (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md hover:bg-blue-700"
              >
                Logout
              </button>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-md hover:bg-blue-700">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;