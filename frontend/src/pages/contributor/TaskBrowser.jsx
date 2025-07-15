import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import TaskDetailModal from '../../TaskDetailModal';
import { fetchTasks, fetchSkills, createTaskAssignment, assignTask, fetchReviewTasks } from '../../api';

const TaskBrowser = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'open',
    compensationType: '',
    minCompensation: '',
    skillId: '',
    search: '',
    category: 'all'  // Changed from 'task' to 'all' to show both types
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch skills
        const skillsResponse = await fetchSkills();
        setAvailableSkills(skillsResponse.data || []);

        // Fetch both regular tasks and review tasks
        const [tasksResponse, reviewTasksResponse] = await Promise.all([
          fetchTasks({ category: 'task' }),
          fetchReviewTasks({ status: 'open' })
        ]);
        
        setTasks(tasksResponse.data || []);
        setReviewTasks(reviewTasksResponse.data || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load tasks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Combine regular tasks and review tasks
  const allTasks = [
    ...tasks.map(task => ({ ...task, category: 'task' })),
    ...reviewTasks.map(task => ({ ...task, category: 'review' }))
  ];
  
  // Filter tasks based on criteria
  const filteredTasks = allTasks.filter(task => {
    // Category filter
    if (filters.category && filters.category !== 'all' && task.category !== filters.category) {
      return false;
    }
    
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Compensation type filter
    if (filters.compensationType && task.compensation_type !== filters.compensationType) {
      return false;
    }
    
    // Minimum compensation filter
    if (filters.minCompensation) {
      const minValue = parseFloat(filters.minCompensation);
      if (task.compensation_type === 'cash' || task.compensation_type === 'mixed') {
        if (task.compensation_amount < minValue) {
          return false;
        }
      }
    }
    
    // Skill filter
    if (filters.skillId) {
      const skillId = parseInt(filters.skillId);
      if (!task.skills.some(skill => skill.id === skillId)) {
        return false;
      }
    }
    
    // Search by title or description
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    // Always use TaskDetailModal for viewing task details
    setIsModalOpen(true);
  };

  const handleUndertakeTask = async (task) => {
    setError('');
    setSuccess('');
    try {
      if (task.category === 'review') {
        // For review tasks, create a review assignment
        await createTaskAssignment({
          task_id: task.id,
          assignment_type: 'review',
          status: 'in_progress',
          notes: 'Task being reviewed'
        });
        setSuccess('You have been assigned to review this task!');
      } else {
        // For regular tasks, use the assignTask function
        await assignTask(task.id);
        setSuccess('You have undertaken this task!');
      }
      // Update the task status in the UI
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'in_progress' } : t));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error undertaking task:', err);
      setError('Failed to undertake task. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
              Find Tasks
            </h2>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Tasks</option>
              <option value="task">Regular Tasks</option>
              <option value="review">Review Tasks</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="open">Open</option>
              <option value="">All Statuses</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="compensationType" className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              id="compensationType"
              name="compensationType"
              value={filters.compensationType}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="cash">Cash Only</option>
              <option value="equity">Equity Only</option>
              <option value="mixed">Cash & Equity</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="minCompensation" className="block text-sm font-medium text-gray-700">
              Min Amount ($)
            </label>
            <input
              type="number"
              id="minCompensation"
              name="minCompensation"
              value={filters.minCompensation}
              onChange={handleFilterChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="skillId" className="block text-sm font-medium text-gray-700">
              Required Skill
            </label>
            <select
              id="skillId"
              name="skillId"
              value={filters.skillId}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Skills</option>
              {availableSkills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found matching the selected filters.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <li key={task.id} className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {task.title}
                      </p>
                      {task.category === 'review' && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Review Task
                        </span>
                      )}
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        task.status === 'open' ? 'bg-green-100 text-green-800' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        task.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                        task.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.status.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {task.creator_name}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        {task.skills.map(skill => skill.name).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleTaskClick(task)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {isModalOpen && selectedTask && (
        <TaskDetailModal
          isOpen={isModalOpen}
          task={selectedTask}
          onClose={() => setIsModalOpen(false)}
          onUndertake={() => handleUndertakeTask(selectedTask)}
          isReviewTask={selectedTask.category === 'review'}
        />
      )}
    </div>
  );
};

export default TaskBrowser; 