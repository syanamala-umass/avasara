import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, DollarSign, Tag, CheckCircle, XCircle, AlertCircle, Users, ArrowLeft, Eye, Plus } from 'lucide-react';
import { fetchTasks, canUndertakeTask, fetchSkills, createTaskAssignment, fetchReviewTasks, assignReviewTask } from './api';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';
import ReviewDetailModal from './ReviewDetailModal';
import LoginPopup from './LoginPopup';

// const categories = [
//   'All',
//   'Development',
//   'Design',
//   'Marketing',
//   'Research',
//   'Operations',
//   'Other',
// ];

// const skillCategories = {
//   'Development': ['programming', 'coding', 'software', 'development', 'frontend', 'backend', 'fullstack', 'react', 'python', 'javascript', 'java', 'node.js', 'database', 'api'],
//   'Design': ['design', 'ui', 'ux', 'graphic', 'visual', 'illustration', 'photoshop', 'figma', 'sketch', 'prototyping', 'wireframing'],
//   'Marketing': ['marketing', 'social media', 'content', 'seo', 'advertising', 'branding', 'campaign', 'analytics', 'growth'],
//   'Research': ['research', 'analysis', 'data', 'survey', 'interview', 'market research', 'competitive analysis', 'user research'],
//   'Operations': ['operations', 'management', 'coordination', 'planning', 'strategy', 'process', 'optimization', 'efficiency'],
//   'Other': []
// };

const compensationTypes = ['All', 'cash', 'equity'];
const taskTypes = ['All', 'task', 'review'];
const capabilityTypes = ['All', 'can_undertake', 'cannot_undertake'];

const TasksPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { taskId } = useParams();
  const [filters, setFilters] = useState({
    title: '',
    category: 'All',
    compensationType: 'All',
    minCompensation: '',
    skillCategory: 'All',
    skillId: '',
    minSkillRating: '',
    taskType: 'All',
    capability: 'All',
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [taskCapabilities, setTaskCapabilities] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Check authentication before making any API calls
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      // Show login popup for unauthenticated users
      setShowLoginPopup(true);
      return;
    }
  }, []);

  // Listen for storage changes to handle login from popup
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue) {
        // User logged in, close popup and load data
        setShowLoginPopup(false);
        loadSkills();
        handleSearch();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    // Only load data if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      return; // Don't load data if not authenticated
    }

    loadSkills();
    
    // Check if we have a selected skill from navigation
    if (location.state?.selectedSkill) {
      const selectedSkillName = location.state.selectedSkill;
      
      // Find the skill ID by name and trigger search
      const findSkillIdAndSearch = async () => {
        try {
          const response = await fetchSkills();
          const skills = response.data || [];
          const skill = skills.find(s => s.name.toLowerCase() === selectedSkillName.toLowerCase());
          
          if (skill) {
            setFilters(prev => ({
              ...prev,
              skillId: skill.id.toString()
            }));
            
            // Trigger search with the skill filter
            const params = { skill_id: skill.id };
            const searchResponse = await fetchTasks(params);
            setResults(searchResponse.data || []);
            
            // Check capabilities for the filtered tasks
            if (searchResponse.data && searchResponse.data.length > 0) {
              await checkTaskCapabilities(searchResponse.data);
            }
          }
        } catch (err) {
          console.error('Failed to find skill ID or search:', err);
          // Fall back to regular search if skill filtering fails
          handleSearch();
        }
      };
      
      findSkillIdAndSearch();
    } else {
      handleSearch();
    }
  }, [location.state]);

  // Handle opening a specific task modal from navigation state or URL params
  useEffect(() => {
    const targetTaskId = location.state?.openTaskId || (taskId ? parseInt(taskId) : null);
    
    if (targetTaskId && results.length > 0) {
      const taskToOpen = results.find(task => task.id === targetTaskId);
      if (taskToOpen) {
        setSelectedTask(taskToOpen);
        setIsTaskModalOpen(true);
      }
    }
  }, [location.state?.openTaskId, taskId, results]);

  // Trigger search when skill filter changes (but not when capability changes)
  useEffect(() => {
    if (filters.skillId && availableSkills.length > 0) {
      handleSearch();
    }
  }, [filters.skillId, availableSkills]);

  const loadSkills = async () => {
    // Check authentication before making API call
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      return; // Don't load skills if not authenticated
    }
    
    try {
      const response = await fetchSkills();
      setAvailableSkills(response.data || []);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If skill ID changes, reset min skill rating
    if (name === 'skillId') {
      setFilters(prev => ({ 
        ...prev, 
        [name]: value,
        minSkillRating: '' // Reset min skill rating when specific skill changes
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  // Filter skills based on selected category
  // const getFilteredSkills = () => {
  //   if (filters.skillCategory === 'All') {
  //     return availableSkills;
  //   }
    
  //   const categoryKeywords = skillCategories[filters.skillCategory] || [];
  //   return availableSkills.filter(skill => 
  //     categoryKeywords.some(keyword => 
  //       skill.name.toLowerCase().includes(keyword.toLowerCase())
  //     )
  //   );
  // };

  const handleViewDetails = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleUndertakeTask = async (e, task) => {
    e?.stopPropagation();
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    
    try {
      // Use correct assignment type for capability check
      const assignmentType = task.type === 'review' ? 'review' : 'task';
      const response = await canUndertakeTask(task.id, assignmentType);
      
      if (response.data.can_undertake) {
        if (task.type === 'review') {
          // For review tasks, use the review task assignment endpoint
          await assignReviewTask(task.id);
          alert('Review task assigned successfully! You can now view it in your Active Tasks.');
        } else {
          // For regular tasks, create a task assignment
          await createTaskAssignment({
            task_id: task.id,
            assignment_type: 'task',
            status: 'in_progress',
            notes: 'Task undertaken'
          });
          alert('Task undertaken successfully! You can now view it in your Active Tasks.');
        }
        
        // Optionally navigate to the dashboard or refresh the task list
        navigate('/dashboard');
      } else {
        alert(response.data.reason || 'You cannot undertake this task at this time.');
      }
    } catch (err) {
      console.error('Failed to undertake task:', err);
      alert('Failed to undertake task. Please try again.');
    }
  };

  const checkTaskCapabilities = async (tasks) => {
    const capabilities = {};
    for (const task of tasks) {
      try {
        // Use 'review' assignment type for review tasks, 'task' for regular tasks
        const assignmentType = task.type === 'review' ? 'review' : 'task';
        
        const response = await canUndertakeTask(task.id, assignmentType);
        capabilities[task.id] = response.data;
      } catch (err) {
        console.error(`Failed to check capabilities for task ${task.id}:`, err);
        capabilities[task.id] = { can_undertake: false };
      }
    }
    setTaskCapabilities(capabilities);
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // Check authentication before making API call
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      setShowLoginPopup(true);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const params = {};
      
      if (filters.title) params.title = filters.title;
      // if (filters.category && filters.category !== 'All') params.category = filters.category;
      if (filters.taskType && filters.taskType !== 'All') params.task_type = filters.taskType;
      if (filters.compensationType && filters.compensationType !== 'All') params.compensation_type = filters.compensationType;
      if (filters.minCompensation) params.min_compensation = filters.minCompensation;
      // if (filters.skillCategory && filters.skillCategory !== 'All') {
      //   const categorySkills = skillCategories[filters.skillCategory];
      //   if (categorySkills && categorySkills.length > 0) {
      //     params.skill_name = categorySkills.join(',');
      //   }
      // }
      if (filters.skillId) {
        params.skill_id = parseInt(filters.skillId);
      }
      if (filters.minSkillRating) {
        params.min_skill_rating = parseFloat(filters.minSkillRating);
      }

      // Fetch all tasks (both regular and review tasks) from a single API call
      const tasksResponse = await fetchTasks(params);
      
      // The API already returns both regular and review tasks with correct 'type' field
      const allTasks = tasksResponse.data || [];
      
      setResults(allTasks);
      
      // Check capabilities for all tasks
      if (allTasks.length > 0) {
        await checkTaskCapabilities(allTasks);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getCapabilityIcon = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return null;
    
    if (capability.can_undertake) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getCapabilityText = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return 'Checking...';
    
    if (capability.can_undertake) {
      // Find the task to determine if it's a review task
      const task = results.find(t => t.id === taskId);
      const actionText = task?.category === 'review' ? 'review' : 'undertake';
      return `You can ${actionText} this task`;
    } else {
      return capability.reason || 'You cannot undertake this task';
    }
  };

  const getCapabilityClass = (taskId) => {
    const capability = taskCapabilities[taskId];
    if (!capability) return 'text-gray-500';
    
    if (capability.can_undertake) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  const renderSkillRequirements = (task) => {
    if (!task.skills || task.skills.length === 0) {
      return <div className="text-sm text-gray-500">No specific skills required</div>;
    }

    return (
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          {task.skills.map(skill => {
            const minLevel = task.skill_review_requirements?.[skill.name] || skill.min_level || 0.0;
            const displayLevel = typeof minLevel === 'number' ? minLevel.toFixed(1) : minLevel;
            return (
              <div key={skill.id} className="flex items-center gap-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs">
                <span>{skill.name}</span>
                <span className="text-blue-600 ml-0.5">({displayLevel})</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatCompensation = (task) => {
    const comp = task.type === 'review' ? task.compensation?.review : task.compensation?.task;
    if (!comp || !comp.compensation_type || !comp.amount) return 'Not specified';
    if (comp.compensation_type === 'cash') {
      return `$${comp.amount}`;
    } else if (comp.compensation_type === 'equity') {
      return `${comp.amount}% equity`;
    }
    return `${comp.amount} ${comp.compensation_type}`;
  };

  // Filter results based on capability
  const getFilteredResults = () => {
    if (filters.capability === 'All') {
      return results;
    }
    
    const filtered = results.filter(task => {
      const capability = taskCapabilities[task.id];
      if (!capability) return false;
      
      if (filters.capability === 'can_undertake') {
        return capability.can_undertake;
      } else if (filters.capability === 'cannot_undertake') {
        return !capability.can_undertake;
      }
      
      return true;
    });
    
    return filtered;
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
    // After successful login, load the data
    loadSkills();
    handleSearch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-spin-slow"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span>Back</span>
                </button>
                <div className="h-6 w-px bg-purple-500/30"></div>
                <h1 className="text-2xl font-bold text-white">Find Tasks</h1>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
              >
                <Filter className="h-5 w-5" />
                <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info Banner */}
          <div className="mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 text-blue-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Task Availability</span>
            </div>
            <p className="text-blue-200 text-sm mt-2">
              You can view all tasks, but you can only undertake tasks that match your skills. 
              Look for the green checkmark to see which tasks you're qualified for.
            </p>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 mb-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <Filter className="h-5 w-5 text-purple-400" />
                Search Filters
              </h2>
              
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Title Search */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <Search className="h-5 w-5 text-purple-400 mr-3" />
                  <input
                    type="text"
                    name="title"
                    value={filters.title}
                    onChange={handleChange}
                    placeholder="Search by title..."
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Task Type */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <Users className="h-5 w-5 text-purple-400 mr-3" />
                  <select
                    name="taskType"
                    value={filters.taskType}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                  >
                    {taskTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'All' ? 'All Task Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Compensation Type */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <DollarSign className="h-5 w-5 text-purple-400 mr-3" />
                  <select
                    name="compensationType"
                    value={filters.compensationType}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                  >
                    {compensationTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'All' ? 'All Compensation Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Skill Filter */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <Tag className="h-5 w-5 text-purple-400 mr-3" />
                  <select
                    name="skillId"
                    value={filters.skillId}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                  >
                    <option value="">All Skills</option>
                    {availableSkills.map(skill => (
                      <option key={skill.id} value={skill.id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Min Compensation */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <DollarSign className="h-5 w-5 text-purple-400 mr-3" />
                  <input
                    type="number"
                    name="minCompensation"
                    value={filters.minCompensation}
                    onChange={handleChange}
                    placeholder="Min compensation..."
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder-gray-400"
                  />
                </div>
                
                {/* Capability Filter */}
                <div className="flex items-center bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl px-4 py-3">
                  <CheckCircle className="h-5 w-5 text-purple-400 mr-3" />
                  <select
                    name="capability"
                    value={filters.capability}
                    onChange={handleChange}
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-white"
                  >
                    {capabilityTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'All' ? 'All Tasks' : type === 'can_undertake' ? 'Match My Skills' : 'Unavailable Tasks'}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
              
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2"
                >
                  <Search className="h-5 w-5" />
                  <span>Search Tasks</span>
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Searching for tasks...</p>
              </div>
            ) : error ? (
              <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
                <p className="text-red-300">{error}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-400 text-lg">No tasks found</p>
                <p className="text-gray-500 text-sm mt-2">Try adjusting your search filters</p>
              </div>
            ) : getFilteredResults().length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-400 text-lg">
                  {filters.capability === 'can_undertake' 
                    ? 'No tasks match your skills' 
                    : 'No tasks match your filter criteria'
                  }
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  {filters.capability === 'can_undertake' 
                    ? 'Try updating your skills or browse all tasks to find opportunities' 
                    : 'Try adjusting your search filters'
                  }
                </p>
                {filters.capability === 'can_undertake' && (
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, capability: 'All' }))}
                    className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300"
                  >
                    View All Tasks
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredResults().map(task => (
                  <div
                    key={task.id}
                    className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 cursor-pointer hover:border-purple-400/40 transition-all duration-300"
                    onClick={() => handleViewDetails(task)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                      <div className="flex items-center space-x-2">
                        {taskCapabilities[task.id] && (
                          <div className={`p-1 rounded-full ${getCapabilityClass(task.id)}`}>
                            {getCapabilityIcon(task.id)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">{task.description}</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <span className="flex items-center space-x-2">
                          <Tag className="h-4 w-4" />
                          <span>{task.category || 'General'}</span>
                        </span>
                        <span className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCompensation(task)}</span>
                        </span>
                      </div>
                      
                      {task.deadline && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                    
                    {renderSkillRequirements(task)}
                    
                    <div className="flex space-x-3 mt-4">
                      {taskCapabilities[task.id] === 'can_undertake' && (
                        <button
                          onClick={(e) => handleUndertakeTask(e, task)}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-green-700 hover:to-emerald-700 transition-colors"
                        >
                          Undertake Task
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(task);
                        }}
                        className={`bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-colors ${
                          taskCapabilities[task.id] === 'can_undertake' ? 'flex-1' : 'w-full'
                        }`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && selectedTask.type === 'review' ? (
        <ReviewDetailModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onReview={(task, submission) => {
            // Handle review submission
            console.log('Review submission:', task, submission);
          }}
        />
      ) : (
        <TaskDetailModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onUndertake={() => handleUndertakeTask(null, selectedTask)}
        />
      )}
      
      {/* Login Popup */}
      <LoginPopup isOpen={showLoginPopup} onClose={closeLoginPopup} />
    </div>
  );
};

export default TasksPage; 