import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  CheckCircle, 
  Sparkles, 
  ArrowRight,
  Zap
} from 'lucide-react';
import { fetchSkills, addNewUserSkill, createSkill, addUserSkills, fetchUserSkills, addUserSkillsBulk } from '../api';

const SkillsModal = ({ isOpen, onClose, onComplete }) => {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const initializeModal = async () => {
        try {
          // Get user data from localStorage
          const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
          if (!userDataFromStorage || !userDataFromStorage.id) {
            setError('User data not found');
            return;
          }
          setUserData(userDataFromStorage);

          // Load available skills and user's existing skills
          const [skillsResponse, userSkillsResponse] = await Promise.all([
            fetchSkills(),
            fetchUserSkills(userDataFromStorage.id)
          ]);
          
          setAvailableSkills(skillsResponse.data);
          setUserSkills(userSkillsResponse.data || []);
        } catch (err) {
          console.error('Error initializing skills modal:', err);
          setError('Failed to load skills. Please try again.');
        }
      };

      initializeModal();
    } else {
      setError(null); // Clear error when modal is closed
      setUserSkills([]); // Reset user skills when modal closes
    }
  }, [isOpen]);

  const handleAddSkill = (skillName) => {
    setError(null); // Clear error on new action
    if (!skillName) return;

    // Check if skill is already added
    if (userSkills.some(skill => skill.name === skillName)) {
      return;
    }

    // Find the skill in available skills to get the full skill object
    const skillToAdd = availableSkills.find(skill => skill.name === skillName);
    if (skillToAdd) {
      setUserSkills(prev => [...prev, skillToAdd]);
    }
  };

  const handleRemoveSkill = (skillId) => {
    setError(null); // Clear error on new action
    setUserSkills(prev => prev.filter(skill => skill.id !== skillId));
  };

  const handleAddNewSkill = () => {
    setError(null); // Clear error on new action
    if (!skillSearch.trim()) return;
    const newSkillName = skillSearch.trim();
    // Check if skill already exists
    if (availableSkills.some(skill => skill.name.toLowerCase() === newSkillName.toLowerCase())) {
      setError('This skill already exists. Please select it from the list.');
      return;
    }
    // Create a temporary skill object (will be created on backend when Continue is clicked)
    const tempSkill = {
      id: `temp_${Date.now()}`,
      name: newSkillName,
      category: 'Other',
      is_new: true
    };
    setAvailableSkills(prev => [...prev, tempSkill]);
    setUserSkills(prev => [...prev, tempSkill]);
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const handleComplete = async () => {
    if (userSkills.length === 0) {
      setError('Please add at least one skill to continue');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Separate existing skills from new skills
      const existingSkills = userSkills.filter(skill => !skill.is_new);
      const newSkills = userSkills.filter(skill => skill.is_new);
      
      // Use the bulk API to handle both existing and new skills
      await addUserSkillsBulk(userData.id, {
        existing_skill_ids: existingSkills.map(skill => skill.id),
        new_skill_names: newSkills.map(skill => skill.name)
      });
      
      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing skills selection:', error);
      setError('Failed to save skills. Please try again.');
    } finally {
      setLoading(false);
    }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 z-10 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome to Avasara!</h2>
              <p className="text-gray-600">Let's set up your skills to get you started</p>
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
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Skill Search */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Add Your Skills
            </label>
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
                  setError(null); // Clear error on typing
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
                          handleAddSkill(skill.name);
                          setSkillSearch('');
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
          </div>

          {/* Available Skills List */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">Popular Skills</h4>
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
                        onClick={() => handleAddSkill(skill.name)}
                        disabled={userSkills.some(userSkill => userSkill.name === skill.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          userSkills.some(userSkill => userSkill.name === skill.name)
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-700 border-gray-200 hover:border-indigo-200'
                        }`}
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
                        onClick={() => handleAddSkill(skill.name)}
                        disabled={userSkills.some(userSkill => userSkill.name === skill.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          userSkills.some(userSkill => userSkill.name === skill.name)
                            ? 'bg-pink-100 text-pink-700 border-pink-200 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-pink-100 text-gray-700 hover:text-pink-700 border-gray-200 hover:border-pink-200'
                        }`}
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
                        onClick={() => handleAddSkill(skill.name)}
                        disabled={userSkills.some(userSkill => userSkill.name === skill.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          userSkills.some(userSkill => userSkill.name === skill.name)
                            ? 'bg-green-100 text-green-700 border-green-200 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-green-100 text-gray-700 hover:text-green-700 border-gray-200 hover:border-green-200'
                        }`}
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
                        onClick={() => handleAddSkill(skill.name)}
                        disabled={userSkills.some(userSkill => userSkill.name === skill.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                          userSkills.some(userSkill => userSkill.name === skill.name)
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-200 cursor-not-allowed'
                            : 'bg-gray-100 hover:bg-yellow-100 text-gray-700 hover:text-yellow-700 border-gray-200 hover:border-yellow-200'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Skills Display */}
        {userSkills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Selected Skills</h3>
            <div className="flex flex-wrap gap-2">
              {userSkills.map(skill => (
                <span
                  key={skill.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 border border-indigo-200"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {skill.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Skip for now
          </button>
          <button
            onClick={handleComplete}
            disabled={loading || userSkills.length === 0}
            className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-colors ${
              loading || userSkills.length === 0
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal; 