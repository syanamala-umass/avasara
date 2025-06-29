import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { createTask, fetchSkills } from './api';

const DispatchTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [formData, setFormData] = useState({
    title: 'Untitled Task',
    description: 'No description provided',
    compensation_type: 'cash',
    compensation_amount: '0',
    review_compensation_type: 'cash',
    review_compensation_amount: '0',
    skills: [],
    num_reviewers: 2,  // Default to 2 reviewers
    max_contributors: 1  // Default to 1 contributor, not shown in UI
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetchSkills();
        setAvailableSkills(response.data);
      } catch (err) {
        console.error('Error loading skills:', err);
      }
    };
    loadSkills();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format the data according to the API requirements
      const formattedData = {
        ...formData,
        // Convert skills array to list of skill IDs
        skills: formData.skills.map(skill => skill.id),
        // Convert compensation amounts to float
        compensation_amount: parseFloat(formData.compensation_amount),
        review_compensation_amount: parseFloat(formData.review_compensation_amount)
      };

      const response = await createTask(formattedData);
      onTaskCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.response?.data?.detail) {
        // Handle validation errors
        if (Array.isArray(err.response.data.detail)) {
          // If it's an array of validation errors
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else {
          // If it's a single error message
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to create task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = (skill) => {
    if (!formData.skills.some(s => s.id === skill.id)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const handleRemoveSkill = (skillId) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId)
    }));
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Dispatch New Task</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Task Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Describe the task in detail"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="compensation_type" className="block text-sm font-medium text-gray-700">
                Task Compensation Type
              </label>
              <select
                id="compensation_type"
                name="compensation_type"
                required
                value={formData.compensation_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="equity">Equity</option>
              </select>
            </div>

            <div>
              <label htmlFor="compensation_amount" className="block text-sm font-medium text-gray-700">
                Task Compensation Amount
              </label>
              <input
                type="number"
                id="compensation_amount"
                name="compensation_amount"
                required
                min="0"
                value={formData.compensation_amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="review_compensation_type" className="block text-sm font-medium text-gray-700">
                Review Compensation Type
              </label>
              <select
                id="review_compensation_type"
                name="review_compensation_type"
                required
                value={formData.review_compensation_type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="equity">Equity</option>
              </select>
            </div>

            <div>
              <label htmlFor="review_compensation_amount" className="block text-sm font-medium text-gray-700">
                Review Compensation Amount
              </label>
              <input
                type="number"
                id="review_compensation_amount"
                name="review_compensation_amount"
                required
                min="0"
                value={formData.review_compensation_amount}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter amount"
              />
            </div>
          </div>

          <div>
            <label htmlFor="num_reviewers" className="block text-sm font-medium text-gray-700">
              Number of Reviews Required
            </label>
            <input
              type="number"
              id="num_reviewers"
              name="num_reviewers"
              required
              min="1"
              max="5"
              value={formData.num_reviewers}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter number of reviews required"
            />
            <p className="mt-1 text-sm text-gray-500">How many people need to review this task (1-5)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Required Skills</label>
            <div className="mt-1">
              <input
                type="text"
                placeholder="Search for skills"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
                onFocus={() => setShowSkillDropdown(true)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {showSkillDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                  {filteredSkills.length > 0 ? (
                    filteredSkills.map(skill => (
                      <div
                        key={skill.id}
                        className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                        onClick={() => handleAddSkill(skill)}
                      >
                        <span className="block truncate">{skill.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50">
                      <span className="block truncate">No matching skills</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.skills.map(skill => (
                <div
                  key={skill.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {skill.name}
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

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Dispatching...' : 'Dispatch Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchTaskModal; 