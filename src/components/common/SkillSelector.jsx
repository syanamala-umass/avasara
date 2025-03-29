import React, { useState } from 'react';

const SkillSelector = ({ availableSkills, selectedSkills, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Get unique categories from available skills
  const categories = [...new Set(availableSkills.map(skill => skill.category))];

  // Filter skills based on search term and selected category
  const filteredSkills = availableSkills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? skill.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Check if a skill is already selected
  const isSelected = (skillId) => {
    return selectedSkills.some(skill => skill.id === skillId);
  };

  // Handle adding a skill
  const handleAddSkill = (skill) => {
    if (!isSelected(skill.id)) {
      onChange([...selectedSkills, skill]);
    }
  };

  // Handle removing a skill
  const handleRemoveSkill = (skillId) => {
    onChange(selectedSkills.filter(skill => skill.id !== skillId));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search skills..."
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Skills */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Skills</h4>
        <div className="flex flex-wrap gap-2">
          {selectedSkills.length === 0 ? (
            <p className="text-sm text-gray-500">No skills selected yet.</p>
          ) : (
            selectedSkills.map(skill => (
              <div 
                key={skill.id}
                className="flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm"
              >
                <span>{skill.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Available Skills */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Skills</h4>
        <div className="border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredSkills.length === 0 ? (
              <p className="text-sm text-gray-500 col-span-3">No matching skills found.</p>
            ) : (
              filteredSkills.map(skill => (
                <div key={skill.id} className="flex items-start">
                  <button
                    type="button"
                    onClick={() => handleAddSkill(skill)}
                    disabled={isSelected(skill.id)}
                    className={`text-left px-2 py-1 rounded-md text-sm ${
                      isSelected(skill.id)
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'hover:bg-blue-50 text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {skill.name}
                    <span className="block text-xs text-gray-500">{skill.category}</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillSelector;