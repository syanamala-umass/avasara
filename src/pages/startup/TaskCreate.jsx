import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchSkills, createTask } from '../../services/api';
import SkillSelector from '../../components/common/SkillSelector';

const TaskCreate = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    compensationType: 'cash',
    cashAmount: '',
    equityPercentage: '',
    selectedSkills: [],
    resources: {
      computingPower: false,
      storage: false,
      licenses: false,
      other: ''
    }
  });

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const skillsData = await fetchSkills();
        setSkills(skillsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load skills. Please try again later.');
        setLoading(false);
      }
    };
    
    loadSkills();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('resources.')) {
      const resourceKey = name.split('.')[1];
      setFormData({
        ...formData,
        resources: {
          ...formData.resources,
          [resourceKey]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSkillChange = (selectedSkills) => {
    setFormData({
      ...formData,
      selectedSkills
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Transform the data to match API expectations
      const taskData = {
        title: formData.title,
        description: formData.description,
        deadline: new Date(formData.deadline).toISOString(),
        compensation_type: formData.compensationType,
        cash_amount: formData.compensationType !== 'equity' ? parseFloat(formData.cashAmount) : 0,
        equity_percentage: formData.compensationType !== 'cash' ? parseFloat(formData.equityPercentage) : 0,
        skill_ids: formData.selectedSkills.map(skill => skill.id),
        resources_required: formData.resources
      };
      
      await createTask(taskData);
      navigate('/startup/tasks/manage', { state: { message: 'Task created successfully!' } });
    } catch (err) {
      setError('Failed to create task. Please try again.');
      setLoading(false);
    }
  };

  if (loading && !skills.length) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Task Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            className="w-full px-3 py-2 border rounded-md"
          ></textarea>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input
            type="date"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Compensation Type</label>
          <select
            name="compensationType"
            value={formData.compensationType}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="cash">Cash Only</option>
            <option value="equity">Equity Only</option>
            <option value="mixed">Cash and Equity</option>
          </select>
        </div>
        
        {(formData.compensationType === 'cash' || formData.compensationType === 'mixed') && (
          <div>
            <label className="block text-sm font-medium mb-1">Cash Amount ($)</label>
            <input
              type="number"
              name="cashAmount"
              value={formData.cashAmount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}
        
        {(formData.compensationType === 'equity' || formData.compensationType === 'mixed') && (
          <div>
            <label className="block text-sm font-medium mb-1">Equity Percentage (%)</label>
            <input
              type="number"
              name="equityPercentage"
              value={formData.equityPercentage}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium mb-1">Required Skills</label>
          <SkillSelector
            availableSkills={skills}
            selectedSkills={formData.selectedSkills}
            onChange={handleSkillChange}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-3">Resources Required</label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="resources.computingPower"
                checked={formData.resources.computingPower}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Computing Power</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="resources.storage"
                checked={formData.resources.storage}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Storage</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                name="resources.licenses"
                checked={formData.resources.licenses}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Software Licenses</label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Other Resources</label>
              <input
                type="text"
                name="resources.other"
                value={formData.resources.other}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/startup/dashboard')}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreate;
