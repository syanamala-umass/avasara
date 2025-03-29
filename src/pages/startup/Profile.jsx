import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StartupProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    fundingStage: 'seed',
    logo: null
  });

  // In a real app, you would fetch profile data from your API
  useEffect(() => {
    // Simulate API call with mock data
    setFormData({
      name: 'My Startup',
      description: 'We are building an amazing platform to connect startups with talent.',
      website: 'https://mystartup.com',
      fundingStage: 'seed',
      logo: null
    });
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'logo' && files?.length) {
      setFormData({
        ...formData,
        logo: files[0]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // In a real app, you would send this data to your API
      console.log('Saving profile data:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      navigate('/startup/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Startup Profile</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow p-6 rounded-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Startup Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          ></textarea>
        </div>
        
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            value={formData.website}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="fundingStage" className="block text-sm font-medium text-gray-700">
            Funding Stage
          </label>
          <select
            id="fundingStage"
            name="fundingStage"
            value={formData.fundingStage}
            onChange={handleChange}
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="pre-seed">Pre-seed</option>
            <option value="seed">Seed</option>
            <option value="series-a">Series A</option>
            <option value="series-b">Series B</option>
            <option value="series-c">Series C+</option>
            <option value="public">Public</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700">
            Logo
          </label>
          <input
            type="file"
            id="logo"
            name="logo"
            accept="image/*"
            onChange={handleChange}
            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          {formData.logo && (
            <p className="mt-2 text-sm text-gray-500">
              Selected file: {formData.logo.name}
            </p>
          )}
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/startup/dashboard')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartupProfile;