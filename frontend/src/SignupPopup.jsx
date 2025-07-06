import React, { useState, useEffect } from 'react';
import { registerUser, fetchSkills, createSkill } from './api';
import Select from 'react-select';
import { 
  X, 
  User, 
  AtSign, 
  Mail, 
  Lock, 
  Shield, 
  Plus, 
  Sparkles,
  ArrowRight,
  Users,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SignupPopup = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    username: '',
    skills: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [newSkillName, setNewSkillName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available skills using fetchSkills from api.js
    fetchSkills()
      .then(res => setAvailableSkills(res.data))
      .catch(err => console.error('Error fetching skills:', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Multi-select handler
  const handleSkillsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      skills: selectedIds
    }));
  };

  const handleAddSkill = () => {
    // No longer needed with multi-select, but keep for compatibility
  };

  const handleRemoveSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(id => id !== skillId)
    }));
  };

  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      const response = await createSkill({ name: newSkillName.trim() });
      const newSkill = response.data;
      setAvailableSkills(prev => [...prev, newSkill]);
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.id]
      }));
      setNewSkillName('');
    } catch (err) {
      alert('Failed to create skill. It may already exist.');
    }
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

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setLoading(false);
      return;
    }

    try {
      const response = await registerUser({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        full_name: formData.full_name,
        skills: formData.skills
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 z-10 mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Join the Community
              </h2>
              <p className="text-sm text-gray-600">Start your journey with Avasara</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            <div className="flex items-center">
              <X className="w-4 h-4 mr-2" />
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="full_name">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="johndoe"
                required
                pattern="[a-zA-Z0-9_]+"
                title="Username can only contain letters, numbers, and underscores"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Only letters, numbers, and underscores allowed
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>
          
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skills & Expertise
            </label>
            <Select
              isMulti
              options={availableSkills.map(skill => ({
                value: skill.id,
                label: skill.name
              }))}
              value={availableSkills
                .filter(skill => formData.skills.includes(skill.id))
                .map(skill => ({ value: skill.id, label: skill.name }))}
              onChange={selectedOptions => {
                setFormData(prev => ({
                  ...prev,
                  skills: selectedOptions.map(option => option.value)
                }));
              }}
              className="mb-3"
              placeholder="Select your skills..."
              styles={{
                control: (provided) => ({
                  ...provided,
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '4px',
                  boxShadow: 'none',
                  '&:hover': {
                    border: '1px solid #6366f1'
                  }
                }),
                option: (provided, state) => ({
                  ...provided,
                  backgroundColor: state.isSelected ? '#6366f1' : state.isFocused ? '#f3f4f6' : 'white',
                  color: state.isSelected ? 'white' : '#374151'
                })
              }}
            />
            
            {/* Add New Skill */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={newSkillName}
                  onChange={e => setNewSkillName(e.target.value)}
                  placeholder="Add new skill"
                  className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateSkill}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
          </div>

          {/* Selected Skills Display */}
          {formData.skills.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map(skillId => {
                  const skill = availableSkills.find(s => s.id === skillId);
                  return skill ? (
                    <span
                      key={skillId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skillId)}
                        className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white transition-all duration-200 ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                <>
                  Join the Community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-4">
            <Users className="w-4 h-4" />
            <span>Already part of our community?</span>
          </div>
          <button
            onClick={onClose}
            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
          >
            Sign in to your account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignupPopup; 