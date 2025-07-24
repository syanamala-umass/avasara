import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, ArrowRight, Star, Sparkles, Users, Target, 
  Search, Plus, X, Filter, Zap, ArrowLeft 
} from 'lucide-react';
import { fetchSkills, fetchUserSkills, addUserSkills, createSkill, addNewUserSkill } from './api';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [skillCategory, setSkillCategory] = useState('all');
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        // Get user data from localStorage
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
        if (!userDataFromStorage || !userDataFromStorage.id) {
          navigate('/');
          return;
        }
        setUserData(userDataFromStorage);

        // Load available skills
        const skillsResponse = await fetchSkills();
        setAvailableSkills(skillsResponse.data);

        // Load user's existing skills
        const userSkillsResponse = await fetchUserSkills(userDataFromStorage.id);
        setUserSkills(userSkillsResponse.data);
      } catch (err) {
        console.error('Error initializing onboarding:', err);
        setError('Failed to load skills. Please try again.');
      }
    };

    initializeOnboarding();
  }, [navigate]);

  const handleAddSkill = async () => {
    if (!selectedSkill || !userData) return;

    try {
      const response = await addNewUserSkill(userData.id, {
        skill_name: selectedSkill
      });

      setUserSkills(prev => [...prev, response.data]);
      setSelectedSkill('');
      setSkillSearch('');
      setShowSkillDropdown(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill. Please try again.');
    }
  };

  const handleRemoveSkill = (skillId) => {
    setUserSkills(prev => prev.filter(skill => skill.id !== skillId));
  };

  const handleAddNewSkill = async () => {
    if (!skillSearch.trim()) return;
    setLoading(true);
    try {
      const response = await createSkill({ name: skillSearch.trim() });
      const newSkill = response.data;
      setAvailableSkills(prev => [...prev, newSkill]);
      setSelectedSkill(newSkill.name);
      setSkillSearch('');
      setShowSkillDropdown(false);
    } catch (err) {
      setError('Failed to add new skill.');
      console.error('Error creating skill:', err);
    } finally {
      setLoading(false);
    }
  };

  const completeSkillsSelection = async () => {
    if (userSkills.length === 0) {
      setError('Please add at least one skill to continue');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Update user skills
      await addUserSkills(userData.id, {
        skill_ids: userSkills.map(skill => skill.id)
      });
      
      setCurrentStep('complete');
    } catch (error) {
      console.error('Error completing skills selection:', error);
      setError('Failed to save skills. Please try again.');
    } finally {
      setLoading(false);
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

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const filteredUserSkills = userSkills.filter(skill => {
    if (skillCategory === 'all') return true;
    return getSkillCategory(skill.name) === skillCategory;
  });

  const renderWelcomeStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to Avasara
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Let's get you started on your journey to connect with amazing opportunities
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Target className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Find Your Path</h3>
            <p className="text-gray-600">Select your skills and interests to discover relevant opportunities</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect & Collaborate</h3>
            <p className="text-gray-600">Work with startups and contribute to meaningful projects</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Grow & Earn</h3>
            <p className="text-gray-600">Build your reputation and earn compensation for your work</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentStep('skills')}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center mx-auto"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderSkillsStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setCurrentStep('welcome')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What are your skills?</h2>
          <p className="text-gray-600">Add your skills to get matched with relevant opportunities. All skills start with a neutral rating and improve based on your performance.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Skill Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Skills
            </label>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Zap className="h-4 w-4" />
              <span>Search and add skills</span>
            </div>
          </div>
          
          <div className="flex space-x-3 mb-4">
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {showSkillDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg border border-gray-200 py-1 text-base overflow-auto focus:outline-none">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(skill => (
                      <div
                        key={skill.id}
                        className="cursor-pointer select-none relative py-3 px-4 hover:bg-indigo-50"
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
                    <div className="py-3 px-4 text-gray-500">
                      No matching skills found
                    </div>
                  )}
                  {skillSearch && !filteredSkills.some(skill => skill.name.toLowerCase() === skillSearch.toLowerCase()) && (
                    <div
                      className="cursor-pointer select-none relative py-3 px-4 hover:bg-green-50 border-t border-gray-200"
                      onClick={handleAddNewSkill}
                    >
                      <span className="block truncate text-green-600 font-medium">
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
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              <span>Add</span>
            </button>
          </div>

          {/* Available Skills List */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Popular Skills</h4>
              <span className="text-xs text-gray-500">Click to add</span>
            </div>
            
            <div className="space-y-3">
              {/* Technology Skills */}
              <div>
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Technology</h5>
                <div className="flex flex-wrap gap-2">
                  {availableSkills
                    .filter(skill => getSkillCategory(skill.name) === 'tech')
                    .slice(0, 8)
                    .map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(skill.name);
                          setSkillSearch(skill.name);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-indigo-200"
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Design Skills */}
              <div>
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Design</h5>
                <div className="flex flex-wrap gap-2">
                  {availableSkills
                    .filter(skill => getSkillCategory(skill.name) === 'design')
                    .slice(0, 6)
                    .map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(skill.name);
                          setSkillSearch(skill.name);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-purple-200"
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Business Skills */}
              <div>
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Business</h5>
                <div className="flex flex-wrap gap-2">
                  {availableSkills
                    .filter(skill => getSkillCategory(skill.name) === 'business')
                    .slice(0, 6)
                    .map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(skill.name);
                          setSkillSearch(skill.name);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-green-200"
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Creative Skills */}
              <div>
                <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">Creative</h5>
                <div className="flex flex-wrap gap-2">
                  {availableSkills
                    .filter(skill => getSkillCategory(skill.name) === 'creative')
                    .slice(0, 6)
                    .map(skill => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => {
                          setSelectedSkill(skill.name);
                          setSkillSearch(skill.name);
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 hover:border-yellow-200"
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              </div>

              {/* Show more skills if available */}
              {availableSkills.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowSkillDropdown(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
                  >
                    <span>View all {availableSkills.length} available skills</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skill Categories Filter */}
        {userSkills.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by category:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Skills', count: userSkills.length },
                { key: 'tech', label: 'Technology', count: userSkills.filter(s => getSkillCategory(s.name) === 'tech').length },
                { key: 'design', label: 'Design', count: userSkills.filter(s => getSkillCategory(s.name) === 'design').length },
                { key: 'business', label: 'Business', count: userSkills.filter(s => getSkillCategory(s.name) === 'business').length },
                { key: 'creative', label: 'Creative', count: userSkills.filter(s => getSkillCategory(s.name) === 'creative').length },
                { key: 'other', label: 'Other', count: userSkills.filter(s => getSkillCategory(s.name) === 'other').length }
              ].map(category => (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSkillCategory(category.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    skillCategory === category.key
                      ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.label} ({category.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Skills Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills ({userSkills.length})</h3>
          
          <div className="space-y-3">
            {filteredUserSkills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No skills found in this category</p>
                <p className="text-xs">Add some skills to get started!</p>
              </div>
            ) : (
              filteredUserSkills.map(skill => (
                <div
                  key={skill.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${getRatingColor(skill.rating)}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{skill.name}</span>
                      {/* Removed skill rating label */}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm font-medium">{skill.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={completeSkillsSelection}
            disabled={loading || userSkills.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue with {userSkills.length} skill{userSkills.length !== 1 ? 's' : ''}</span>
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Your skills have been saved successfully. You can now browse tasks and start contributing to amazing projects.
        </p>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Skills Summary</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {userSkills.slice(0, 5).map(skill => (
              <span
                key={skill.id}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
              >
                {skill.name}
              </span>
            ))}
            {userSkills.length > 5 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                +{userSkills.length - 5} more
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => navigate('/contributor/tasks')}
            className="w-full px-8 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200"
          >
            Browse Tasks
          </button>
        </div>
      </div>
    </div>
  );

  // Render current step
  switch (currentStep) {
    case 'welcome':
      return renderWelcomeStep();
    case 'skills':
      return renderSkillsStep();
    case 'complete':
      return renderCompleteStep();
    default:
      return renderWelcomeStep();
  }
};

export default OnboardingFlow; 