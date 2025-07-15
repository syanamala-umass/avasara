import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, DollarSign, Tag, CheckCircle, XCircle, AlertCircle, Users, ArrowLeft, Eye, Plus } from 'lucide-react';
import { fetchTasks, canUndertakeTask, fetchSkills, createTaskAssignment, fetchReviewTasks } from './api';
import { useNavigate, useLocation } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';

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

  useEffect(() => {
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

  // Trigger search when skill filter changes (but not when capability changes)
  useEffect(() => {
    if (filters.skillId && availableSkills.length > 0) {
      handleSearch();
    }
  }, [filters.skillId, availableSkills]);

  const loadSkills = async () => {
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
    try {
      const response = await canUndertakeTask(task.id);
      if (response.data.can_undertake) {
        // Actually create the task assignment
        await createTaskAssignment({
          task_id: task.id,
          assignment_type: 'task',
          status: 'in_progress',
          notes: 'Task undertaken'
        });
        
        console.log('Task undertaken:', task.id);
        alert('Task undertaken successfully! You can now view it in your Active Tasks.');
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
        const assignmentType = task.category === 'review' ? 'review' : 'task';
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

      // Fetch both regular tasks and review tasks
      const [tasksResponse, reviewTasksResponse] = await Promise.all([
        fetchTasks(params),
        fetchReviewTasks({ status: 'open' })
      ]);
      
      // Combine and categorize the results
      const regularTasks = (tasksResponse.data || []).map(task => ({ ...task, category: 'task' }));
      const reviewTasks = (reviewTasksResponse.data || []).map(task => ({ ...task, category: 'review' }));
      
      const allTasks = [...regularTasks, ...reviewTasks];
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
    if (!task.compensation_amount || !task.compensation_type) return 'Not specified';
    if (task.compensation_type === 'cash') {
      return `$${task.compensation_amount}`;
    } else if (task.compensation_type === 'equity') {
      return `${task.compensation_amount}% equity`;
    }
    return `${task.compensation_amount} ${task.compensation_type}`;
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
    
    console.log(`Capability filter: ${filters.capability}, Total results: ${results.length}, Filtered results: ${filtered.length}`);
    return filtered;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Find Tasks</h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-2 text-blue-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Task Availability</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            You can view all tasks, but you can only undertake tasks that match your skills. 
            Look for the green checkmark to see which tasks you're qualified for.
          </p>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-500" />
              Search Filters
            </h2>
            
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Title Search */}
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <Search className="h-5 w-5 text-indigo-400 mr-3" />
                <input
                  type="text"
                  name="title"
                  value={filters.title}
                  onChange={handleChange}
                  placeholder="Search by title..."
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500"
                />
              </div>
              
              {/* Category */}
              {/* <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <Tag className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div> */}
              
              {/* Task Type */}
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <Users className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="taskType"
                  value={filters.taskType}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  {taskTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All Task Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Compensation Type */}
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <DollarSign className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="compensationType"
                  value={filters.compensationType}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  {compensationTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'Any Compensation' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Skill Category */}
              {/* <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <Tag className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="skillCategory"
                  value={filters.skillCategory}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  <option value="All">All Skill Categories</option>
                  {Object.keys(skillCategories).filter(cat => cat !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div> */}
              
              {/* Skill Filter */}
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <Tag className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="skillId"
                  value={filters.skillId}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  <option value="">All Skills</option>
                  {availableSkills.map(skill => (
                    <option key={skill.id} value={skill.id.toString()}>{skill.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Minimum Skill Rating - Only show when a skill is selected */}
              {filters.skillId && (
                <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                  <Tag className="h-5 w-5 text-indigo-400 mr-3" />
                  <input
                    type="number"
                    name="minSkillRating"
                    value={filters.minSkillRating}
                    onChange={handleChange}
                    placeholder="Min skill level (0.0-5.0)"
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              )}
              
              {/* Capability Filter */}
              <div className="flex items-center bg-indigo-50 rounded-xl px-4 py-3">
                <CheckCircle className="h-5 w-5 text-indigo-400 mr-3" />
                <select
                  name="capability"
                  value={filters.capability}
                  onChange={handleChange}
                  className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900"
                >
                  {capabilityTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'All' ? 'All Tasks' : 
                       type === 'can_undertake' ? 'Can Undertake' : 
                       'Cannot Undertake'}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Search Button */}
              <div className="flex items-center">
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Search className="h-5 w-5 mr-2" />
                      Search Tasks
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Compensation Range - Only show when cash is selected */}
            {filters.compensationType === 'cash' && (
              <div className="mt-4">
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="h-5 w-5 text-indigo-400" />
                    <span className="text-sm font-medium text-indigo-700">Minimum Compensation</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-indigo-600 mb-1">Minimum Amount</label>
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
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {getFilteredResults().length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredResults().map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{task.title}</h3>
                        {getCapabilityIcon(task.id)}
                        {task.category === 'review' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                            Review Task
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{task.creator_name || 'Unknown Creator'}</div>
                      <div className="flex items-center text-xs text-gray-500 gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span>{task.category}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{formatCompensation(task)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {renderSkillRequirements(task)}

                  <div className={`text-sm font-medium mb-4 ${getCapabilityClass(task.id)}`}>
                    {getCapabilityText(task.id)}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewDetails(task)}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                    {taskCapabilities[task.id]?.can_undertake && (
                      <button
                        onClick={(e) => handleUndertakeTask(e, task)}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold shadow hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Undertake
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
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
    </div>
  );
};

export default TasksPage; 