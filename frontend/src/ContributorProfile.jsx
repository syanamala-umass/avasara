import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile, fetchSkills, fetchUserSkills, updateUserProfile, addUserSkills, createSkill, addNewUserSkill } from './api';

const ContributorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    portfolioUrl: '',
    skills: []
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [skillLevel, setSkillLevel] = useState('beginner');
  const [success, setSuccess] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showNewSkillInput, setShowNewSkillInput] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData || !userData.id) {
          throw new Error('User data not found');
        }

        // Fetch user profile
        const profileResponse = await fetchUserProfile(userData.id);
        const profileData = profileResponse.data;

        // Fetch user's skills with ratings
        const skillsResponse = await fetchUserSkills(userData.id);
        const userSkills = skillsResponse.data;

        // Fetch all available skills
        const availableSkillsResponse = await fetchSkills();
        const allSkills = availableSkillsResponse.data;

        // Update form data with profile information
        setFormData({
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          bio: profileData.bio || '',
          portfolioUrl: profileData.portfolio_url || '',
          skills: userSkills.map(skill => ({
            id: skill.id,
            name: skill.name,
            level: skill.rating ? 
              skill.rating <= 2 ? 'beginner' :
              skill.rating <= 4 ? 'intermediate' : 'advanced'
            : 'beginner'
          }))
        });

        // Set available skills
        setAvailableSkills(allSkills);
      } catch (err) {
        setError(err.message || 'Failed to fetch profile data');
        console.error('Error fetching profile data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) return;

    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        throw new Error('User data not found');
      }

      const response = await addNewUserSkill(userData.id, {
        name: newSkill,
        rating: 5
      });

      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, response.data]
      }));
      setNewSkill('');
      setShowNewSkillInput(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      // Optionally show error message to user
    }
  };

  const handleRemoveSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        throw new Error('User data not found');
      }

      // Update profile information
      await updateUserProfile(userData.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
        portfolio_url: formData.portfolioUrl
      });

      // First, remove all existing skills by sending an empty array
      await addUserSkills(userData.id, {
        skill_ids: [],
        ratings: []
      });

      // Then add the current skills
      if (formData.skills.length > 0) {
        const skillsData = formData.skills.map(skill => ({
          skill_id: skill.id,
          rating: skill.level === 'beginner' ? 1 :
                  skill.level === 'intermediate' ? 3 : 5
        }));

        await addUserSkills(userData.id, {
          skill_ids: skillsData.map(s => s.skill_id),
          ratings: skillsData.map(s => s.rating)
        });
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const handleAddNewSkill = async () => {
    if (!skillSearch.trim()) return;
    setAddingSkill(true);
    try {
      // Create the new skill
      const response = await createSkill({ name: skillSearch.trim() });
      const newSkill = response.data;
      // Add to availableSkills and select it
      setAvailableSkills(prev => [...prev, newSkill]);
      setSelectedSkill(newSkill.id.toString());
      setSkillSearch('');
    } catch (err) {
      setError('Failed to add new skill.');
      console.error('Error creating skill:', err);
    } finally {
      setAddingSkill(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Navigation Bar */}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  <svg className="flex-shrink-0 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-2">Back to Dashboard</span>
                </button>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Profile Settings
          </h2>
        </div>
      </div>

      <div className="mt-8">
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
            Profile updated successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow sm:rounded-lg p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <div className="mt-1">
                <textarea
                  id="bio"
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700">
                Portfolio URL
              </label>
              <div className="mt-1">
                <input
                  type="url"
                  name="portfolioUrl"
                  id="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-sm font-medium text-gray-700">Skills</label>
              <div className="mt-2 flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search or add a skill"
                    value={skillSearch}
                    onChange={e => setSkillSearch(e.target.value)}
                    onFocus={() => setShowNewSkillInput(true)}
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                  {showNewSkillInput && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                      {filteredSkills.length > 0 ? (
                        filteredSkills.map(skill => (
                          <div
                            key={skill.id}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedSkill(skill.id.toString());
                              setSkillSearch(skill.name);
                              setShowNewSkillInput(false);
                            }}
                          >
                            <span className="block truncate">{skill.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50">
                          <span className="block truncate">No matching skills</span>
                        </div>
                      )}
                      {skillSearch && !filteredSkills.some(skill => skill.name.toLowerCase() === skillSearch.toLowerCase()) && (
                        <div
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 border-t border-gray-200"
                          onClick={handleAddNewSkill}
                        >
                          <span className="block truncate text-green-600">
                            Add "{skillSearch}" as new skill
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <select
                  value={skillLevel}
                  onChange={e => setSkillLevel(e.target.value)}
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-auto sm:text-sm border-gray-300 rounded-md"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Skill
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {formData.skills.map(skill => (
                  <div
                    key={skill.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill.name} ({skill.level})
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContributorProfile; 