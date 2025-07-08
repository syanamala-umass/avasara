import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Calendar, DollarSign, Tag, CheckCircle, XCircle, AlertCircle, Star, Users } from 'lucide-react';
import { fetchTasks, canUndertakeTask } from './api';

const categories = [
  'All',
  'Development',
  'Design',
  'Marketing',
  'Research',
  'Operations',
  'Other',
];

const compensationTypes = ['All', 'cash', 'equity'];
const taskTypes = ['All', 'task', 'review'];

const FindTasksModal = ({ isOpen, onClose, onTaskClick, onUndertakeTask }) => {
  const [filters, setFilters] = useState({
    title: '',
    category: 'All',
    compensationType: 'All',
    minCompensation: '',
    maxCompensation: '',
    taskType: 'All',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taskCapabilities, setTaskCapabilities] = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleUndertakeTask = async (e, task) => {
    e.stopPropagation();
    if (onUndertakeTask) {
      onUndertakeTask(task);
    }
  };

  const checkTaskCapabilities = async (tasks) => {
    const capabilities = {};
    for (const task of tasks) {
      try {
        const response = await canUndertakeTask(task.id);
        capabilities[task.id] = response.data;
      } catch (err) {
        capabilities[task.id] = {
          can_undertake: false,
          reason: 'Unable to check capabilities'
        };
      }
    }
    setTaskCapabilities(capabilities);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Send all parameters to backend since it now supports all filters
      const params = {};
      
      // 1. Title search
      if (filters.title) params.title = filters.title;
      
      // 2. Skill set/category filtering
      if (filters.category !== 'All') params.category = filters.category;
      
      // 3. Task type filtering
      if (filters.taskType !== 'All') params.task_type = filters.taskType;
      
      // 4. Compensation type and range
      if (filters.compensationType !== 'All') params.compensation_type = filters.compensationType;
      if (filters.minCompensation) params.min_compensation = parseFloat(filters.minCompensation);
      if (filters.maxCompensation) params.max_compensation = parseFloat(filters.maxCompensation);
      
      // Fetch tasks from backend with all filters
      const response = await fetchTasks(params);
      const tasks = response.data || [];
      
      setResults(tasks);
      
      // Check capabilities for all tasks
      await checkTaskCapabilities(tasks);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  };

  const getCapabilityIcon = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return null;
    
    if (capability.can_undertake) {
      return <CheckCircle className="h-5 w-5 text-green-500" title="You can undertake this task" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" title={capability.reason} />;
    }
  };

  const getCapabilityText = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return 'Checking...';
    
    if (capability.can_undertake) {
      return 'Available';
    } else {
      return 'Not Available';
    }
  };

  const getCapabilityClass = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return 'text-gray-400';
    
    if (capability.can_undertake) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const renderSkillRequirements = (task) => {
    if (!task.skill_review_requirements || Object.keys(task.skill_review_requirements).length === 0) {
      return null;
    }

    return (
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">Required Skills:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(task.skill_review_requirements).map(([skillName, minLevel]) => (
            <div key={skillName} className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded text-xs">
              <span className="text-blue-800 font-medium">{skillName}</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-2 h-2 ${
                      star <= minLevel ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="text-blue-600 ml-0.5">({minLevel})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const formatCompensation = (task) => {
    if (!task.compensation_amount || !task.compensation_type) return 'Not specified';
    if (task.compensation_type === 'cash') {
      return `$${task.compensation_amount}`;
    } else if (task.compensation_type === 'equity') {
      return `${task.compensation_amount}% equity`;
    }
    return `${task.compensation_amount} ${task.compensation_type}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-indigo-600 transition"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-2">
          <Filter className="h-6 w-6 text-indigo-400" />
          Find Tasks
        </h2>
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Task Availability</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            You can view all tasks, but you can only undertake tasks that match your skills. 
            Look for the green checkmark to see which tasks you're qualified for.
          </p>
        </div>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 1. Title Search */}
          <div className="flex items-center bg-indigo-50 rounded-xl px-3">
            <Search className="h-5 w-5 text-indigo-400 mr-2" />
            <input
              type="text"
              name="title"
              value={filters.title}
              onChange={handleChange}
              placeholder="Search by title..."
              className="w-full bg-transparent border-none focus:ring-0 py-3"
            />
          </div>
          
          {/* 2. Skill Set/Category */}
          <div className="flex items-center bg-indigo-50 rounded-xl px-3">
            <Tag className="h-5 w-5 text-indigo-400 mr-2" />
            <select
              name="category"
              value={filters.category}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 py-3"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          {/* 3. Task Type */}
          <div className="flex items-center bg-indigo-50 rounded-xl px-3">
            <Users className="h-5 w-5 text-indigo-400 mr-2" />
            <select
              name="taskType"
              value={filters.taskType}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 py-3"
            >
              {taskTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Task Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* 4. Compensation Type */}
          <div className="flex items-center bg-indigo-50 rounded-xl px-3">
            <DollarSign className="h-5 w-5 text-indigo-400 mr-2" />
            <select
              name="compensationType"
              value={filters.compensationType}
              onChange={handleChange}
              className="w-full bg-transparent border-none focus:ring-0 py-3"
            >
              {compensationTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'All' ? 'Any Compensation' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          {/* 5. Compensation Range - Only show when cash is selected */}
          {filters.compensationType === 'cash' && (
            <div className="col-span-1 md:col-span-2">
              <div className="bg-indigo-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-5 w-5 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700">Compensation Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-indigo-600 mb-1">Minimum</label>
                    <input
                      type="number"
                      name="minCompensation"
                      value={filters.minCompensation}
                      onChange={handleChange}
                      placeholder="0"
                      min="0"
                      className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-indigo-600 mb-1">Maximum</label>
                    <input
                      type="number"
                      name="maxCompensation"
                      value={filters.maxCompensation}
                      onChange={handleChange}
                      placeholder="1000"
                      min="0"
                      className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="text-gray-400 text-center py-8">No tasks found. Try adjusting your filters.</div>
          ) : (
            <ul className="space-y-4">
              {results.map(task => (
                <li
                  key={task.id}
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow p-5 hover:shadow-lg transition cursor-pointer"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-indigo-800">{task.title}</h3>
                        {getCapabilityIcon(task.id)}
                        {task.category === 'review' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Review Task
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mb-2">{task.startup_name}</div>
                      <div className="flex items-center text-xs text-gray-400 gap-2 mb-2">
                        <Tag className="h-4 w-4" /> {task.category}
                        <DollarSign className="h-4 w-4 ml-4" /> {formatCompensation(task)}
                        <Calendar className="h-4 w-4 ml-4" /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                      </div>
                      {renderSkillRequirements(task)}
                      <div className={`text-sm font-medium ${getCapabilityClass(task.id)}`}>
                        {getCapabilityText(task.id)}
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex flex-col gap-2">
                      <button
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
                      >
                        View Task
                      </button>
                      {taskCapabilities[task.id]?.can_undertake && (
                        <button
                          className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold shadow hover:from-green-600 hover:to-emerald-600 transition-all duration-200"
                          onClick={(e) => handleUndertakeTask(e, task)}
                        >
                          Undertake Task
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindTasksModal; 