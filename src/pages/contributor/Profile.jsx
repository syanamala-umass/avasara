import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ContributorProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    portfolioUrl: '',
    skills: []
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedExperience, setSelectedExperience] = useState(1);
  const [selectedProficiency, setSelectedProficiency] = useState('beginner');

  // In a real app, you would fetch profile data and skills from your API
  useEffect(() => {
    // Simulate API call with mock data
    setFormData({
      firstName: 'John',
      lastName: 'Developer',
      bio: 'I am a full-stack developer with 5 years of experience in React, Node.js, and MongoDB.',
      portfolioUrl: 'https://johndeveloper.com',
      skills: [
        { id: 1, name: 'React', category: 'development', experienceYears: 3, proficiencyLevel: 'expert' },
        { id: 2, name: 'Node.js', category: 'development', experienceYears: 4, proficiencyLevel: 'expert' },
        { id: 3, name: 'MongoDB', category: 'development', experienceYears: 2, proficiencyLevel: 'intermediate' }
      ]
    });

    setAvailableSkills([
      { id: 1, name: 'React', category: 'development' },
      { id: 2, name: 'Node.js', category: 'development' },
      { id: 3, name: 'MongoDB', category: 'development' },
      { id: 4, name: 'Angular', category: 'development' },
      { id: 5, name: 'Vue.js', category: 'development' },
      { id: 6, name: 'UI/UX Design', category: 'design' },
      { id: 7, name: 'Graphic Design', category: 'design' },
      { id: 8, name: 'Content Writing', category: 'marketing' },
      { id: 9, name: 'SEO', category: 'marketing' },
      { id: 10, name: 'Legal Documentation', category: 'legal' }
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddSkill = () => {
    if (!selectedSkill) return;
    
    const skill = availableSkills.find(s => s.id === parseInt(selectedSkill));
    
    if (!skill) return;
    
    // Check if already added
    if (formData.skills.some(s => s.id === skill.id)) {
      setError('This skill is already added to your profile.');
      return;
    }
    
    setFormData({
      ...formData,
      skills: [
        ...formData.skills,
        {
          ...skill,
          experienceYears: selectedExperience,
          proficiencyLevel: selectedProficiency
        }
      ]
    });
    
    setSelectedSkill('');
    setSelectedExperience(1);
    setSelectedProficiency('beginner');
    setError('');
  };

  const handleRemoveSkill = (skillId) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill.id !== skillId)
    });
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
      
      navigate('/contributor/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contributor Profile</h2>
      
      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8 bg-white shadow p-6 rounded-lg">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-3">
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>
          
          <div className="sm:col-span-6">
            <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-700">
              Portfolio URL
            </label>
            <input
              type="url"
              id="portfolioUrl"
              name="portfolioUrl"
              value={formData.portfolioUrl}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>
          
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label htmlFor="skill" className="block text-sm font-medium text-gray-700">
                Skill
              </label>
              <select
                id="skill"
                name="skill"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a skill</option>
                {availableSkills.map(skill => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name} ({skill.category})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <select
                id="experience"
                name="experience"
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(parseInt(e.target.value))}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(year => (
                  <option key={year} value={year}>
                    {year} {year === 1 ? 'year' : 'years'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="sm:col-span-2">
              <label htmlFor="proficiency" className="block text-sm font-medium text-gray-700">
                Proficiency Level
              </label>
              <select
                id="proficiency"
                name="proficiency"
                value={selectedProficiency}
                onChange={(e) => setSelectedProficiency(e.target.value)}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div className="sm:col-span-6">
              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Skill
              </button>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Your Skills</h4>
            
            {formData.skills.length === 0 ? (
              <p className="text-sm text-gray-500">
                No skills added yet. Add skills above to showcase your expertise.
              </p>
            ) : (
              <ul className="space-y-2">
                {formData.skills.map(skill => (
                  <li key={skill.id} className="bg-gray-50 p-3 rounded-md flex justify-between items-center">
                    <div>
                      <span className="font-medium">{skill.name}</span>{' '}
                      <span className="text-gray-500">({skill.category})</span>
                      <div className="text-sm text-gray-500">
                        {skill.experienceYears} {skill.experienceYears === 1 ? 'year' : 'years'} | {skill.proficiencyLevel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/contributor/dashboard')}
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

export default ContributorProfile;