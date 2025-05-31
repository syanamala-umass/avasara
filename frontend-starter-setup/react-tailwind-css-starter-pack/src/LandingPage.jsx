import React, { useState, useEffect } from 'react';
import { ArrowRight, Award, Building, CheckCircle, Users } from 'lucide-react';
import LoginPopup from './LoginPopup';
import { fetchLandingStats } from './api';

const LandingPage = () => {
  const [stats, setStats] = useState({
    startupCount: 0,
    completedTasksCount: 0,
    topContributors: []
  });
  const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const openLoginPopup = () => {
    setShowLoginPopup(true);
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  useEffect(() => {
    // Fetch landing page statistics from the API
    const fetchStats = async () => {
      try {
        const response = await fetchLandingStats();

        const data = response.data;

        console.log("API response:", data);
        setStats(data);
      } catch (error) {
        console.error('Error fetching landing page stats:', error);
        // Fallback to sample data if API request fails
        setStats({
          startupCount: 0,
          completedTasksCount: 0,
          topContributors: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">Avasara</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="px-4 py-2 rounded text-blue-600 font-medium hover:bg-blue-50 transition"
                onClick={openLoginPopup}
              >
                Log In
              </button>
              <button className="px-4 py-2 bg-blue-600 rounded text-white font-medium hover:bg-blue-700 transition">
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Popup */}
      <LoginPopup isOpen={showLoginPopup} onClose={closeLoginPopup} />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Connect Startups with Top Talent
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            A peer-review platform where startups can find skilled contributors to complete tasks and receive quality feedback.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <button className="px-6 py-3 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700 transition flex items-center">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {/* Startup Count */}
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600 mb-4">
                <Building size={24} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                {loading ? '...' : stats.startupCount}
              </h2>
              <p className="mt-2 text-lg text-gray-600">Startups Registered</p>
            </div>

            {/* Completed Tasks */}
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle size={24} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                {loading ? '...' : stats.completedTasksCount}
              </h2>
              <p className="mt-2 text-lg text-gray-600">Tasks Completed</p>
            </div>

            {/* Active Contributors */}
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Users size={24} />
              </div>
              <h2 className="text-4xl font-bold text-gray-900">
                {loading ? '...' : stats.topContributors.length * 20}+
              </h2>
              <p className="mt-2 text-lg text-gray-600">Active Contributors</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Top Contributors</h2>
          <p className="mt-2 text-xl text-gray-600">Meet the talented individuals helping startups succeed</p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading top contributors...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.topContributors.map((contributor) => (
              <div key={contributor.id} className="bg-white rounded-lg shadow-md p-6 flex items-center">
                <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-medium">
                  {contributor.avatar ? (
                    <img
                      src={contributor.avatar}
                      alt={contributor.name}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    contributor.name.charAt(0)
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {contributor.name}
                    {contributor.id <= 3 && (
                      <Award className="ml-1 h-5 w-5 text-yellow-500" />
                    )}
                  </h3>
                  <div className="mt-1 flex items-center">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(contributor.rating)
                              ? 'text-yellow-400'
                              : i < contributor.rating
                              ? 'text-yellow-300'
                              : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">{contributor.rating}</span>
                    </div>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-gray-600">{contributor.completedTasks} tasks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="bg-blue-600 py-12 md:py-20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to get started?</h2>
          <p className="mt-4 text-xl text-blue-100 max-w-3xl mx-auto">
            Join our platform today and connect with talented contributors or find exciting startup projects.
          </p>
          <div className="mt-8">
            <button className="px-8 py-3 bg-white rounded-lg text-blue-600 font-medium hover:bg-blue-50 transition">
              Sign Up Now
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <span className="text-2xl font-bold text-white">Avasara</span>
              <p className="mt-2 text-gray-400 max-w-md">
                Connecting startups with talented contributors through a peer-review system.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <h3 className="text-white font-medium mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-medium mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-medium mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Cookies</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center md:text-left">
            <p className="text-gray-400">&copy; 2025 Avasara. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;