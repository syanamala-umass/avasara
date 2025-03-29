import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="md:max-w-2xl">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Connect Startups with Top Talent
            </h1>
            <p className="mt-6 text-xl">
              A platform where startups can find skilled contributors and professionals can discover exciting opportunities.
            </p>
            
            {currentUser && (
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  to={currentUser.user_type === 'startup_admin' ? "/startup/dashboard" : "/contributor/dashboard"}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md bg-white text-blue-600 hover:bg-gray-100 md:py-4 md:text-lg md:px-10"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to={currentUser.user_type === 'startup_admin' ? "/startup/tasks/create" : "/contributor/tasks"}
                  className="px-8 py-3 border border-transparent text-base font-medium rounded-md bg-blue-700 hover:bg-blue-800 md:py-4 md:text-lg md:px-10"
                >
                  {currentUser.user_type === 'startup_admin' ? "Post Task" : "Find Tasks"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">How It Works</h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900">For Startups</h3>
              <p className="mt-2 text-gray-600">
                Post tasks, find the right talent, and get work done efficiently. Pay with cash or equity.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900">For Contributors</h3>
              <p className="mt-2 text-gray-600">
                Find tasks that match your skills, complete work, and build your portfolio while earning.
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900">Task Marketplace</h3>
              <p className="mt-2 text-gray-600">
                A transparent process from task posting to payment, with peer reviews for quality assurance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;