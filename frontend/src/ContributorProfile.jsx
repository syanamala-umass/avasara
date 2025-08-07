import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, UserCircle, Edit3, Save, X, Plus, Star, 
  Briefcase, Globe, FileText, Award, TrendingUp, 
  CheckCircle, Clock, DollarSign, Sparkles, Search, 
  Filter, Zap, Target, Users, Calendar, Eye, Trash2,
  AlertCircle, CheckSquare, Clock3, UserCheck
} from 'lucide-react';
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
  const [success, setSuccess] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [addingSkill, setAddingSkill] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [userData, setUserData] = useState(null);
  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    totalEarnings: 0,
    completionRate: 0,
    reviewsCompleted: 0
  });
  const [skillCategory, setSkillCategory] = useState('all');
  


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Get user data from localStorage
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
        if (!userDataFromStorage || !userDataFromStorage.id) {
          throw new Error('User data not found');
        }

        setUserData(userDataFromStorage);

        // Fetch user profile
        const profileResponse = await fetchUserProfile(userDataFromStorage.id);
        const profileData = profileResponse.data;

        // Fetch user's skills with ratings
        const skillsResponse = await fetchUserSkills(userDataFromStorage.id);
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
            rating: skill.rating || 2.5,
            num_tasks: skill.num_tasks || 0,
            total_score: skill.total_score || 0
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
    if (!selectedSkill) return;

    try {
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData || !userData.id) {
        throw new Error('User data not found');
      }

      const response = await addNewUserSkill(userData.id, {
        skill_name: selectedSkill
      });

      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, response.data]
      }));
      setSelectedSkill('');
      setSkillSearch('');
      setShowSkillDropdown(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill. Please try again.');
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

      // Update skills (only skill IDs, ratings are managed by the system)
      await addUserSkills(userData.id, {
        skill_ids: formData.skills.map(skill => skill.id)
      });

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
      const response = await createSkill({ name: skillSearch.trim(), category: 'Other' });
      const newSkill = response.data;
      // Add to availableSkills and select it
      setAvailableSkills(prev => [...prev, newSkill]);
      setSelectedSkill(newSkill.name);
      setSkillSearch('');
      setShowSkillDropdown(false);
    } catch (err) {
      setError('Failed to add new skill.');
      console.error('Error creating skill:', err);
    } finally {
      setAddingSkill(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100 border-green-200';
    if (rating >= 4.0) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (rating >= 3.0) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Expert';
    if (rating >= 4.0) return 'Advanced';
    if (rating >= 3.5) return 'Intermediate';
    if (rating >= 3.0) return 'Beginner';
    return 'Novice';
  };

  const getSkillCategory = (skillName) => {
    const techSkills = ['javascript', 'python', 'react', 'node.js', 'sql', 'html', 'css', 'java', 'c++', 'php', 'ruby', 'swift', 'kotlin', 'go', 'rust', 'typescript', 'angular', 'vue.js', 'django', 'flask', 'express', 'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'];
    const designSkills = ['ui/ux', 'figma', 'sketch', 'adobe xd', 'photoshop', 'illustrator', 'invision', 'prototyping', 'wireframing', 'user research', 'design systems', 'typography', 'color theory', 'visual design', 'interaction design'];
    const businessSkills = ['project management', 'agile', 'scrum', 'kanban', 'product management', 'business analysis', 'strategy', 'marketing', 'sales', 'customer success', 'operations', 'finance', 'analytics', 'data analysis'];
    const creativeSkills = ['content writing', 'copywriting', 'blogging', 'social media', 'video editing', 'animation', 'illustration', 'photography', 'graphic design', 'branding', 'storytelling', 'creative direction'];
    
    const lowerSkill = skillName.toLowerCase();
    if (techSkills.some(skill => lowerSkill.includes(skill))) return 'tech';
    if (designSkills.some(skill => lowerSkill.includes(skill))) return 'design';
    if (businessSkills.some(skill => lowerSkill.includes(skill))) return 'business';
    if (creativeSkills.some(skill => lowerSkill.includes(skill))) return 'creative';
    return 'other';
  };



  const filteredUserSkills = formData.skills.filter(skill => {
    if (skillCategory === 'all') return true;
    return getSkillCategory(skill.name) === skillCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-spin-slow"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
                </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Avasara</span>
            </div>
      </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl">
            <p className="font-medium">Success</p>
            <p className="text-sm">Profile updated successfully!</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
              {/* Profile Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <UserCircle className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">
                  {formData.firstName && formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`
                    : userData?.username || 'User'
                  }
                </h1>
                <p className="text-gray-300">{userData?.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Member since {formatDate(userData?.created_at)}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">Tasks Completed</p>
                  <p className="text-lg font-bold text-white">{userStats.tasksCompleted}</p>
                </div>
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 text-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">Total Earnings</p>
                  <p className="text-lg font-bold text-white">${userStats.totalEarnings}</p>
                </div>
              </div>

              {/* Skills Summary */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-white mb-3">Skills Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Skills</span>
                    <span className="font-medium text-white">{formData.skills.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Expert Level</span>
                    <span className="font-medium text-green-400">
                      {formData.skills.filter(s => s.rating >= 4.5).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Advanced Level</span>
                    <span className="font-medium text-blue-400">
                      {formData.skills.filter(s => s.rating >= 4.0 && s.rating < 4.5).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium shadow-lg"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>View Dashboard</span>
                </button>
                <button
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-purple-500/10 transition-all duration-300 font-medium"
                >
                  <Target className="h-4 w-4" />
                  <span>Browse Tasks</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Edit3 className="h-4 w-4" />
                  <span>Edit your profile</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
                <input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
                      placeholder="Enter your first name"
                />
            </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
                      placeholder="Enter your last name"
                />
              </div>
            </div>

                {/* Bio Field */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                Bio
              </label>
                <textarea
                  id="bio"
                  name="bio"
                    rows={4}
                  value={formData.bio}
                  onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
                    placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                />
            </div>

                {/* Portfolio URL */}
                <div>
                  <label htmlFor="portfolioUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Portfolio URL
              </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                <input
                  type="url"
                  name="portfolioUrl"
                  id="portfolioUrl"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
                      placeholder="https://your-portfolio.com"
                />
              </div>
            </div>

                {/* Enhanced Skills Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">
                      Skills & Expertise
                    </label>
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Zap className="h-4 w-4" />
                      <span>Ratings based on performance</span>
                    </div>
                  </div>
                  
                  {/* Skill Search */}
                  <div className="mb-6">
                    <div className="flex space-x-3">
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                  <input
                    type="text"
                          placeholder="Search for skills to add..."
                    value={skillSearch}
                          onChange={e => {
                            setSkillSearch(e.target.value);
                            setShowSkillDropdown(true);
                          }}
                          onFocus={() => setShowSkillDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-white placeholder-gray-400"
                        />
                        {showSkillDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-slate-800/90 backdrop-blur-sm shadow-lg max-h-60 rounded-xl border border-purple-500/30 py-1 text-base overflow-auto focus:outline-none">
                      {filteredSkills.length > 0 ? (
                        filteredSkills.map(skill => (
                          <div
                            key={skill.id}
                                  className="cursor-pointer select-none relative py-3 px-4 hover:bg-purple-500/20 text-gray-300"
                            onClick={() => {
                                    setSelectedSkill(skill.name);
                              setSkillSearch(skill.name);
                                    setShowSkillDropdown(false);
                            }}
                          >
                            <span className="block truncate">{skill.name}</span>
                          </div>
                        ))
                      ) : (
                              <div className="py-3 px-4 text-gray-400">
                                No matching skills found
                        </div>
                      )}
                      {skillSearch && !filteredSkills.some(skill => skill.name.toLowerCase() === skillSearch.toLowerCase()) && (
                        <div
                                className="cursor-pointer select-none relative py-3 px-4 hover:bg-green-500/20 border-t border-purple-500/30 text-green-400"
                          onClick={handleAddNewSkill}
                        >
                                <span className="block truncate font-medium">
                                  + Add "{skillSearch}" as new skill
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSkill}
                        disabled={!selectedSkill}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                        <Plus className="h-4 w-4" />
                        <span>Add Skill</span>
                </button>
              </div>
                  </div>

                  {/* Skill Categories Filter */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <Filter className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-300">Filter by category:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'all', label: 'All Skills', count: formData.skills.length },
                        { key: 'tech', label: 'Technology', count: formData.skills.filter(s => getSkillCategory(s.name) === 'tech').length },
                        { key: 'design', label: 'Design', count: formData.skills.filter(s => getSkillCategory(s.name) === 'design').length },
                        { key: 'business', label: 'Business', count: formData.skills.filter(s => getSkillCategory(s.name) === 'business').length },
                        { key: 'creative', label: 'Creative', count: formData.skills.filter(s => getSkillCategory(s.name) === 'creative').length },
                        { key: 'other', label: 'Other', count: formData.skills.filter(s => getSkillCategory(s.name) === 'other').length }
                      ].map(category => (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => setSkillCategory(category.key)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
                            skillCategory === category.key
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 border border-purple-500/20'
                          }`}
                        >
                          {category.label} ({category.count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Skills Display */}
                  <div className="space-y-3">
                    {filteredUserSkills.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <Target className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                        <p className="text-sm">No skills found in this category</p>
                        <p className="text-xs">Add some skills to get started!</p>
                      </div>
                    ) : (
                      filteredUserSkills.map(skill => (
                        <div
                          key={skill.id}
                          className="flex items-center justify-between p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl cursor-pointer hover:border-purple-400/40 transition-all duration-300"
                          onClick={() => navigate(`/skills/${skill.id}`)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-white underline underline-offset-2">{skill.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 fill-current text-yellow-400" />
                              <span className="text-sm font-medium text-white">{skill.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>{skill.num_tasks || 0} tasks</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); handleRemoveSkill(skill.id); }}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
            </div>
          </div>





                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-purple-500/20">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 border border-purple-500/30 text-gray-300 rounded-xl hover:bg-purple-500/10 transition-all duration-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
            </button>
          </div>
        </form>
      </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContributorProfile; 