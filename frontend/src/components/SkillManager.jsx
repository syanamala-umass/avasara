import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Star, CheckCircle, Filter, Zap } from 'lucide-react';
import { fetchSkills, addNewUserSkill, createSkill } from '../api';

const SkillManager = ({ 
  userId, 
  userSkills = [], 
  onSkillsChange, 
  showCategories = true, 
  maxSkills = null,
  readOnly = false 
}) => {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [skillCategory, setSkillCategory] = useState('all');
  const [error, setError] = useState(null);
  const [newSkillCategory, setNewSkillCategory] = useState('');

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetchSkills();
        setAvailableSkills(response.data);
      } catch (err) {
        console.error('Error loading skills:', err);
        setError('Failed to load skills');
      }
    };
    loadSkills();
  }, []);

  const handleAddSkill = async () => {
    if (!selectedSkill || !userId) return;

    try {
      const response = await addNewUserSkill(userId, {
        skill_name: selectedSkill
      });

      const newSkill = response.data;
      onSkillsChange([...userSkills, newSkill]);
      setSelectedSkill('');
      setSkillSearch('');
      setShowSkillDropdown(false);
    } catch (error) {
      console.error('Error adding skill:', error);
      setError('Failed to add skill. Please try again.');
    }
  };

  const handleRemoveSkill = (skillId) => {
    const updatedSkills = userSkills.filter(skill => skill.id !== skillId);
    onSkillsChange(updatedSkills);
  };

  const handleAddNewSkill = async () => {
    if (!skillSearch.trim() || !newSkillCategory) return;
    setAddingSkill(true);
    try {
      const response = await createSkill({ name: skillSearch.trim(), category: newSkillCategory });
      const newSkill = response.data;
      setAvailableSkills(prev => [...prev, newSkill]);
      setSelectedSkill(newSkill.name);
      setSkillSearch('');
      setShowSkillDropdown(false);
      setNewSkillCategory('');
    } catch (err) {
      setError('Failed to add new skill.');
      console.error('Error creating skill:', err);
    } finally {
      setAddingSkill(false);
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

  const skillLimitReached = maxSkills && userSkills.length >= maxSkills;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Skill Search */}
      {!readOnly && (
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={skillLimitReached ? "Skill limit reached" : "Search for skills to add..."}
              value={skillSearch}
              onChange={e => {
                setSkillSearch(e.target.value);
                setShowSkillDropdown(true);
              }}
              onFocus={() => !skillLimitReached && setShowSkillDropdown(true)}
              disabled={skillLimitReached}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            {showSkillDropdown && !skillLimitReached && (
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
                  <div className="py-3 px-4 border-t border-gray-200">
                    <div className="mb-2 text-sm text-gray-700">Select a category for "{skillSearch}"</div>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                      value={newSkillCategory}
                      onChange={e => setNewSkillCategory(e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="Development">Development</option>
                      <option value="Design">Design</option>
                      <option value="Content">Content</option>
                      <option value="Media">Media</option>
                      <option value="Audio">Audio</option>
                      <option value="Video">Video</option>
                      <option value="Research">Research</option>
                      <option value="Translation">Translation</option>
                      <option value="Other">Other</option>
                    </select>
                    <button
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      onClick={handleAddNewSkill}
                      disabled={!newSkillCategory || addingSkill}
                    >
                      + Add "{skillSearch}" as new skill
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAddSkill}
            disabled={!selectedSkill || skillLimitReached}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      )}

      {/* Skill Categories Filter */}
      {showCategories && userSkills.length > 0 && (
        <div>
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
      <div className="space-y-3">
        {filteredUserSkills.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No skills found in this category</p>
            {!readOnly && <p className="text-xs">Add some skills to get started!</p>}
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
                  <span className="text-xs px-2 py-1 rounded-full bg-white/50 font-medium">
                    {getRatingLabel(skill.rating)}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{skill.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-xs text-gray-600">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>{skill.num_tasks || 0} tasks</span>
                  </div>
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillManager; 