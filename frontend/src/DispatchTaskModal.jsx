import React, { useState, useEffect } from 'react';
import { X, Sparkles, DollarSign, Target, CheckCircle, ArrowRight, ArrowLeft, Minus, Star } from 'lucide-react';
import { createTask, fetchSkills } from './api';

const DispatchTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    compensation_type: 'cash',
    compensation_amount: '0',
    review_compensation_type: 'cash',
    review_compensation_amount: '0',
    skills: [],
    num_reviewers: 2,
    skill_review_requirements: {}  // {"skill_name": min_skill_level_required}
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
      const formattedData = {
        ...formData,
        skills: formData.skills.map(skill => skill.id),
        compensation_amount: parseFloat(formData.compensation_amount),
        review_compensation_amount: parseFloat(formData.review_compensation_amount)
      };

      const response = await createTask(formattedData);
      onTaskCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else {
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
        skills: [...prev.skills, skill],
        // Initialize skill level requirement for this skill
        skill_review_requirements: {
          ...prev.skill_review_requirements,
          [skill.name]: 0  // Default to level 0 required
        }
      }));
    }
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const handleRemoveSkill = (skillId) => {
    const skillToRemove = formData.skills.find(s => s.id === skillId);
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId),
      // Remove skill level requirement for this skill
      skill_review_requirements: skillToRemove ? 
        Object.fromEntries(
          Object.entries(prev.skill_review_requirements).filter(([key]) => key !== skillToRemove.name)
        ) : prev.skill_review_requirements
    }));
  };

  const updateSkillLevelRequirement = (skillName, value) => {
    setFormData(prev => ({
      ...prev,
      skill_review_requirements: {
        ...prev.skill_review_requirements,
        [skillName]: Math.max(0, Math.min(5, parseFloat(value) || 0))  // Between 0-5
      }
    }));
  };

  const renderSkillLevelStars = (level) => {
    const numLevel = parseFloat(level);
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3 h-3 ${
              star <= numLevel ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-xs text-gray-600 ml-1">({numLevel.toFixed(1)})</span>
      </div>
    );
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold">Basic Information</h3>
      </div>
      
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
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Compensation & Skills</h3>
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
          Number of Reviewers
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
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Required Skills & Minimum Levels
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Select skills and set the minimum skill level required (0.0-5.0) for contributors to undertake this task. Use 0.0 for no requirement or enter precise values like 2.7, 3.2, etc.
        </p>
        <div className="relative">
          <input
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            onFocus={() => setShowSkillDropdown(true)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Search for skills..."
          />
          {showSkillDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredSkills.map(skill => (
                <div
                  key={skill.id}
                  onClick={() => handleAddSkill(skill)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {skill.name}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-3 space-y-3">
          {formData.skills.map(skill => (
            <div key={skill.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="flex-1 text-sm font-medium text-blue-800">{skill.name}</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Min Level:</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={formData.skill_review_requirements[skill.name] || 0.0}
                    onChange={(e) => updateSkillLevelRequirement(skill.name, parseFloat(e.target.value) || 0)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 w-16"
                    placeholder="0.0"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {renderSkillLevelStars(formData.skill_review_requirements[skill.name] || 0.0)}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Review & Create</h3>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Title:</label>
          <p className="text-gray-900">{formData.title}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Description:</label>
          <p className="text-gray-900">{formData.description}</p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Compensation:</label>
          <p className="text-gray-900">
            {formData.compensation_amount} {formData.compensation_type} (Task) / 
            {formData.review_compensation_amount} {formData.review_compensation_type} (Review)
          </p>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-700">Skills & Minimum Levels:</label>
          <div className="space-y-2 mt-1">
            {formData.skills.map(skill => (
              <div key={skill.id} className="flex justify-between items-center">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {skill.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Min Level:</span>
                  {renderSkillLevelStars(formData.skill_review_requirements[skill.name] || 0.0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
            <p className="text-gray-600">Step {currentStep} of 3</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{Math.round((currentStep / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {renderStepContent()}
          
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
              >
                {loading ? 'Creating Task...' : 'Create Task'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchTaskModal; 