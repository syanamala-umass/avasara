import React, { useState } from 'react';
import SkillSelector from '../common/SkillSelector';
import ResourceSelector from '../common/ResourceSelector';

const TaskCreationForm = ({ onSubmit }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    skills: [],
    compensationType: 'cash',
    compensationAmount: '',
    resources: [],
    deadline: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillsChange = (selectedSkills) => {
    setTaskData(prev => ({ ...prev, skills: selectedSkills }));
  };
  
  const handleResourcesChange = (selectedResources) => {
    setTaskData(prev => ({ ...prev, resources: selectedResources }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(taskData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Task Title</label>
        <input
          type="text"
          name="title"
          value={taskData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={taskData.description}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Required Skills</label>
        <SkillSelector
          selectedSkills={taskData.skills}
          onChange={handleSkillsChange}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Compensation Type</label>
          <select
            name="compensationType"
            value={taskData.compensationType}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="equity">Equity</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {taskData.compensationType === 'cash' ? 'Amount ($)' : 'Equity (%)'}
          </label>
          <input
            type="number"
            name="compensationAmount"
            value={taskData.compensationAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Required Resources</label>
        <ResourceSelector
          selectedResources={taskData.resources}
          onChange={handleResourcesChange}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Deadline</label>
        <input
          type="date"
          name="deadline"
          value={taskData.deadline}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Create Task
      </button>
    </form>
  );
};

export default TaskCreationForm;
