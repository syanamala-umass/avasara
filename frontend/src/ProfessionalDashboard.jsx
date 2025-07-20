import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, CheckCircle, Clock, Star, Clipboard, Lightbulb, Users, LogOut, 
  Trash2, XCircle, Sparkles, ArrowRight, UserCircle, Filter, MapPin, 
  DollarSign, Calendar, TrendingUp, Award, Target, Zap, Briefcase,
  Eye, Heart, Share2, Bookmark, MessageCircle, Settings, User
} from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';
import TaskActionModal from './TaskActionModal';
import DispatchTaskModal from './DispatchTaskModal';
import ReviewSubmissionsModal from './ReviewSubmissionsModal';
import SkillsModal from './components/SkillsModal';
import {
  fetchTasks,
  fetchTaskAssignments,
  fetchIdeas,
  fetchMyAssignments,
  submitTask,
  reviewTask,
  fetchTaskById,
  updateTaskAssignment,
  createTaskAssignment,
  deleteTask,
  fetchMyReviews,
  fetchUserSkills,
  fetchTopSkillsByTasks,
  fetchRecommendedTasks,
  fetchMyReviewAssignments,
  fetchReviewTaskDetails,
  submitReviewAssignment
} from './api';

const ProfessionalDashboard = () => {
  const navigate = useNavigate();
  
  // State management
  const [createdTasks, setCreatedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [assignedReviewTasks, setAssignedReviewTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [reviewableTasks, setReviewableTasks] = useState([]);
  const [pendingReviewTasks, setPendingReviewTasks] = useState([]);
  const [rejectedTasks, setRejectedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskActionModalOpen, setIsTaskActionModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState('submit');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isReviewSubmissionsModalOpen, setIsReviewSubmissionsModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [userData, setUserData] = useState(null);
  const [topSkills, setTopSkills] = useState([]);
  const [recommendedTasks, setRecommendedTasks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
        if (!userDataFromStorage || !userDataFromStorage.id) {
          throw new Error('User data not found');
        }

        setUserData(userDataFromStorage);

        // Make API calls individually to handle failures gracefully
        const [
          createdTasksResponse, 
          assignedTasksResponse, 
          assignedReviewTasksResponse,
          completedTasksResponse, 
          completedReviewsResponse,
          reviewableTasksResponse,
          pendingReviewResponse,
          rejectedTasksResponse,
          userSkillsResponse,
          topSkillsResponse,
          recommendedTasksResponse
        ] = await Promise.allSettled([
          fetchTasks({ creator_id: userDataFromStorage.id, task_type: 'task' }),
          fetchMyAssignments('in_progress'),
          fetchMyReviewAssignments('in_progress'),
          fetchTaskAssignments({ status: 'completed' }),
          fetchMyReviews(),
          fetchTasks({ status: 'submitted', task_type: 'task' }),
          fetchMyAssignments('submitted'),
          fetchMyAssignments('rejected'),
          fetchUserSkills(userDataFromStorage.id),
          fetchTopSkillsByTasks(),
          fetchRecommendedTasks()
        ]);

        // Handle Promise.allSettled results
        setCreatedTasks(createdTasksResponse.status === 'fulfilled' ? (createdTasksResponse.value?.data || []) : []);
        setAssignedTasks(assignedTasksResponse.status === 'fulfilled' ? (assignedTasksResponse.value?.data || []) : []);
        setAssignedReviewTasks(assignedReviewTasksResponse.status === 'fulfilled' ? (assignedReviewTasksResponse.value?.data || []) : []);
        setCompletedTasks(completedTasksResponse.status === 'fulfilled' ? (completedTasksResponse.value?.data || []) : []);
        setCompletedReviews(completedReviewsResponse.status === 'fulfilled' ? (completedReviewsResponse.value?.data || []) : []);
        setReviewableTasks(reviewableTasksResponse.status === 'fulfilled' ? (reviewableTasksResponse.value?.data || []) : []);
        setPendingReviewTasks(pendingReviewResponse.status === 'fulfilled' ? (pendingReviewResponse.value?.data || []) : []);
        setRejectedTasks(rejectedTasksResponse.status === 'fulfilled' ? (rejectedTasksResponse.value?.data || []) : []);
        setUserSkills(userSkillsResponse.status === 'fulfilled' ? (userSkillsResponse.value?.data || []) : []);
        
        // Handle top skills specifically
        const topSkillsData = topSkillsResponse.status === 'fulfilled' ? (topSkillsResponse.value?.data || []) : [];
        setTopSkills(topSkillsData);
        
        setRecommendedTasks(recommendedTasksResponse.status === 'fulfilled' ? (recommendedTasksResponse.value?.data || []) : []);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/');
        } else {
          setError('Failed to load dashboard data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);



  // Handle clicking outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetchTasks({ search: searchQuery });
      setSearchResults(response.data || []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching tasks:', error);
      setError("Search failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = async (task) => {
    try {
      setLoading(true);
      
      let response;
      
      // Check if this is a review task
      if (task.type === 'review' || task.parent_task_title) {
        // For review tasks, use the review task ID and call the review task endpoint
        const reviewTaskId = task.id || task.review_task_id;
        response = await fetchReviewTaskDetails(reviewTaskId);
      } else {
        // For regular tasks, use the regular task endpoint
        // Use task_id for completed tasks, otherwise use id or task_id based on tab
        let taskId;
        if (activeTab === 'completed') {
          taskId = task.task_id || task.id;
        } else if (activeTab === 'undertaking' || activeTab === 'pending_review') {
          taskId = task.task_id || task.id;
        } else {
          taskId = task.id;
        }
        response = await fetchTaskById(taskId);
      }
      
      const taskData = response.data;
      
      // For tasks from undertaking or pending_review tabs, use the assignment status instead of task status
      let displayStatus = taskData.status;
      if ((activeTab === 'undertaking' || activeTab === 'pending_review') && task.status) {
        // Use the assignment status from the task list item
        displayStatus = task.status;
      }
      
      // Ensure the task has the correct type for TaskDetailModal
      const taskWithType = {
        ...taskData,
        status: displayStatus, // Override with assignment status if available
        type: task.type === 'review' || task.parent_task_title ? 'review' : 'task'
      };
      setSelectedTask(taskWithType);
      setIsTaskModalOpen(true);
      
    } catch (error) {
      console.error('Error fetching task details:', error);
      setError('Failed to load task details. Please try again.');
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = (task, mode) => {
    setSelectedTask(task);
    setActionMode(mode);
    setIsTaskActionModalOpen(true);
  };

  const handleTaskSubmitFromModal = (task) => {
    // Determine if this is a review task or regular task
    const mode = task.type === 'review' ? 'review' : 'submit';
    handleTaskAction(task, mode);
  };

  const handleTaskSubmit = async (taskId, formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await submitTask(taskId, formData);
      
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [assignedTasksResponse, pendingReviewResponse] = await Promise.all([
        fetchMyAssignments('in_progress'),
        fetchMyAssignments('submitted')
      ]);
      
      setAssignedTasks(assignedTasksResponse.data || []);
      setPendingReviewTasks(pendingReviewResponse.data || []);

      setSuccess('Task submitted successfully! Your work is now under review.');
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      
    } catch (error) {
      console.error('Error submitting task:', error);
      setError('Failed to submit task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskReview = async (assignmentId, reviewData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      console.log('DEBUG: Submitting review for assignment ID:', assignmentId);
      console.log('DEBUG: Review data:', reviewData);

      await submitReviewAssignment(assignmentId, reviewData);
      
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [assignedTasksResponse, assignedReviewTasksResponse, completedReviewsResponse] = await Promise.all([
        fetchMyAssignments('in_progress'),
        fetchMyReviewAssignments('in_progress'),
        fetchMyReviews()
      ]);
      
      setAssignedTasks(assignedTasksResponse.data || []);
      setAssignedReviewTasks(assignedReviewTasksResponse.data || []);
      setCompletedReviews(completedReviewsResponse.data || []);

      setSuccess('Review submitted successfully! Thank you for your feedback.');
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatCompensation = (comp) => {
    if (!comp || !comp.compensation_type || !comp.amount) return 'No compensation specified';
    if (comp.compensation_type === 'cash') {
      return `$${comp.amount}`;
    } else if (comp.compensation_type === 'equity') {
      return `${comp.amount}% equity`;
    }
    return `${comp.amount} ${comp.compensation_type}`;
  };

  const formatStatus = (status) => {
    const statusMap = {
      'in_progress': 'In Progress',
      'submitted': 'Submitted',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'under_review': 'Under Review'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'in_progress': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'under_review': 'bg-purple-100 text-purple-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'in_progress': <Clock className="h-4 w-4" />,
      'submitted': <Clipboard className="h-4 w-4" />,
      'completed': <CheckCircle className="h-4 w-4" />,
      'rejected': <XCircle className="h-4 w-4" />,
      'under_review': <Eye className="h-4 w-4" />
    };
    return iconMap[status] || <Clock className="h-4 w-4" />;
  };

  // Calculate dashboard stats
  const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.compensation_amount || 0), 0);
  const totalReviews = completedReviews.length;
  const activeTasks = assignedTasks.length + assignedReviewTasks.length;
  
  // Debug logging for rendering
  const completionRate = completedTasks.length > 0 ? ((completedTasks.length / (completedTasks.length + rejectedTasks.length)) * 100).toFixed(1) : 0;

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Avasara</h1>
                <p className="text-xs text-gray-500">Professional Task Platform</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="Search for tasks, skills, or opportunities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="submit"
                    className="h-full px-4 text-indigo-600 font-medium hover:text-indigo-800 focus:outline-none text-sm"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tasks')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center space-x-2"
              >
                <Briefcase className="h-4 w-4" />
                <span>Find Work</span>
              </button>
              
              <NotificationBell />
              
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              
              <div className="relative profile-dropdown">
                <button 
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={toggleProfileDropdown}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <UserCircle className="h-5 w-5 text-white" />
                  </div>
                </button>
                
                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-6">
                      {/* User Info Header */}
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <UserCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {userData?.full_name || userData?.username || 'User'}
                          </h3>
                          <p className="text-sm text-gray-500">{userData?.email}</p>
                          <p className="text-xs text-gray-400">Member since {userData?.created_at ? formatDate(userData.created_at) : 'Recently'}</p>
                        </div>
                      </div>

                      {/* Stats Summary */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500">Tasks Completed</p>
                          <p className="text-lg font-bold text-gray-900">{completedTasks.length}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-gray-500">Total Earnings</p>
                          <p className="text-lg font-bold text-gray-900">${totalEarnings}</p>
                        </div>
                      </div>

                      {/* Skills */}
                      {/* This block is now removed */}

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate('/profile');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <UserCircle className="h-4 w-4" />
                          <span>View Full Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            setIsSkillsModalOpen(true);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Update Skills</span>
                        </button>
                        <hr className="my-2" />
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-0 sm:px-0 lg:px-0 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mx-4 sm:mx-6 lg:mx-8">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mx-4 sm:mx-6 lg:mx-8">
            <p className="font-medium">Success</p>
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="flex">
          {/* Skills in Demand Sidebar */}
          <div className="w-80 flex-shrink-0 pl-4 sm:pl-6 lg:pl-8">
            <div className="space-y-6">
              {/* Recommended Tasks */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Tasks</h3>
                <div className="space-y-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  ) : recommendedTasks.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm">No recommended tasks found.</p>
                  ) : (
                    recommendedTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Briefcase className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm truncate">{task.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{task.creator_name || 'Unknown'}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs font-medium text-indigo-600">
                                ${task.compensation_amount || 0}
                              </span>
                              <span className="text-xs text-gray-500">
                                {task.skills?.length || 0} skills match
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {recommendedTasks.length > 3 && (
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-full mt-4 text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View all recommendations →
                  </button>
                )}
              </div>

              {/* Skills in Demand */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 sticky top-24">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills in Demand</h3>
                
                <div className="space-y-3">
                  {(() => {
                    if (loading) {
                      return (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                        </div>
                      );
                    } else if (!topSkills || topSkills.length === 0) {
                      return (
                        <p className="text-center text-gray-500 text-sm py-6">No skills data available</p>
                      );
                    } else {
                      return topSkills.slice(0, 5).map((skill, index) => (
                        <button
                          key={skill.id}
                          onClick={() => navigate(`/skills/${skill.id}`)}
                          className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 border border-transparent transition-all duration-200 text-left group cursor-pointer"
                        >
                          <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{skill.name}</span>
                          <span className="text-sm text-gray-500">{skill.task_count} tasks</span>
                        </button>
                      ));
                    }
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Main Dashboard Content */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8">
            {/* Navigation Tabs */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-gray-200">
                {[
                  { key: 'overview', label: 'Overview', icon: <Sparkles className="h-4 w-4" /> },
                  { key: 'undertaking', label: 'Active Tasks', icon: <Target className="h-4 w-4" /> },
                  { key: 'completed', label: 'Completed', icon: <CheckCircle className="h-4 w-4" /> },
                  { key: 'pending_review', label: 'Under Review', icon: <Eye className="h-4 w-4" /> },
                  { key: 'dispatched', label: 'Posted Tasks', icon: <Lightbulb className="h-4 w-4" /> },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Overview Tab Content (at top when active) */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900">${totalEarnings}</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Tasks</p>
                        <p className="text-2xl font-bold text-gray-900">{activeTasks}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Reviews Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{totalReviews}</p>
                      </div>
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Star className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                      </div>
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-indigo-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tasks Posted</p>
                        <p className="text-2xl font-bold text-gray-900">{createdTasks.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Lightbulb className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => navigate('/tasks')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-indigo-200 transition-colors">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Find New Work</p>
                        <p className="text-sm text-gray-500">Discover tasks that match your skills</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                        <Lightbulb className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Post a Task</p>
                        <p className="text-sm text-gray-500">Share your project with the community</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('undertaking')}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                        <Clipboard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">My Tasks</p>
                        <p className="text-sm text-gray-500">View your active assignments</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {/* Combine regular tasks and review tasks, sort by creation date, and take first 3 */}
                    {[...assignedTasks, ...assignedReviewTasks]
                      .sort((a, b) => new Date(b.created_at || b.assigned_at) - new Date(a.created_at || a.assigned_at))
                      .slice(0, 3)
                      .map(task => {
                        const isReviewTask = task.parent_task_title; // Review tasks have this field
                        return (
                          <div key={task.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => {
                            handleTaskClick(isReviewTask ? { id: task.review_task_id, category: 'review' } : task);
                          }}>
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isReviewTask ? 'bg-yellow-100' : 'bg-indigo-100'
                              }`}>
                                {isReviewTask ? (
                                  <Eye className="h-5 w-5 text-yellow-600" />
                                ) : (
                                  <Clipboard className="h-5 w-5 text-indigo-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {isReviewTask ? `Review: ${task.parent_task_title}` : task.task_title}
                                </p>
                                <p className="text-sm text-gray-500">Started {formatDate(isReviewTask ? task.assigned_at : task.created_at)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isReviewTask && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Review
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {formatStatus(task.status)}
                              </span>
                              <ArrowRight className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        );
                    })}
                    {(assignedTasks.length === 0 && assignedReviewTasks.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Clipboard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">No active tasks</p>
                        <p className="text-sm">Start by finding work that matches your skills</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Other Tab Content (at top when active) */}
            {activeTab === 'undertaking' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Active Tasks</h2>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Find More Work
                  </button>
                </div>
                
                {loading ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your tasks...</p>
                  </div>
                ) : (assignedTasks.length === 0 && assignedReviewTasks.length === 0) ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Tasks</h3>
                    <p className="text-gray-500 mb-6">You're not currently working on any tasks.</p>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Find Work That Matches Your Skills
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {/* Regular Tasks */}
                    {assignedTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{task.task_title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {formatStatus(task.status)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Started {formatDate(task.created_at)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCompensation(task.compensation?.task)}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {task.notes || 'No additional notes provided.'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                task.assignment_type === 'review' 
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction(task, task.assignment_type === 'review' ? 'review' : 'submit');
                              }}
                            >
                              {task.assignment_type === 'review' ? 'Submit Review' : 'Submit Work'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Review Tasks */}
                    {assignedReviewTasks.map(reviewTask => (
                      <div key={reviewTask.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick({ id: reviewTask.review_task_id, category: 'review' })}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">Review: {reviewTask.parent_task_title}</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Review Task
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reviewTask.status)}`}>
                                {formatStatus(reviewTask.status)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Started {formatDate(reviewTask.assigned_at)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="h-4 w-4" />
                                <span>Submitted by: {reviewTask.submitter_name}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {reviewTask.assignment_notes || 'No additional notes provided.'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium text-sm hover:bg-yellow-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction(reviewTask, 'review');
                              }}
                            >
                              Submit Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'completed' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Completed Tasks & Reviews</h2>
                </div>
                
                {loading ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading completed tasks...</p>
                  </div>
                ) : (completedTasks.length === 0 && completedReviews.length === 0) ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Work</h3>
                    <p className="text-gray-500 mb-6">Complete your first task to see it here.</p>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Find Work to Complete
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Completed Tasks Section */}
                    {completedTasks.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Tasks</h3>
                        <div className="grid gap-4">
                          {completedTasks.map(task => (
                            <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{task.title || task.task_title || `Task ${task.id}`}</h3>
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      Completed
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Completed {formatDate(task.completed_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span>{formatCompensation(task.compensation?.task)}</span>
                                    </div>
                                  </div>
                                  <p className="text-gray-600 text-sm">
                                    {task.description || 'No description provided.'}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {formatCompensation(task.compensation?.task)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completed Reviews Section */}
                    {completedReviews.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Completed Reviews</h3>
                        <div className="grid gap-4">
                          {completedReviews.map(review => (
                            <div key={review.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick({ id: review.task_id })}>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900">{review.task_title || `Task ${review.task_id}`}</h3>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                      review.is_approved 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {review.is_approved ? 'Approved' : 'Rejected'}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>Reviewed {formatDate(review.created_at)}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span>{formatCompensation(review.compensation?.review)}</span>
                                    </div>
                                  </div>
                                  {review.feedback && (
                                    <p className="text-gray-600 text-sm">
                                      <strong>Feedback:</strong> {review.feedback}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                    {formatCompensation(review.compensation?.review)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending_review' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Tasks Under Review</h2>
                </div>
                
                {loading ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading tasks under review...</p>
                  </div>
                ) : pendingReviewTasks.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Under Review</h3>
                    <p className="text-gray-500 mb-6">Tasks you've submitted will appear here while being reviewed.</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {pendingReviewTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{task.task_title}</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Under Review
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Submitted {formatDate(task.created_at)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCompensation(task.compensation?.task)}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {task.notes || 'No additional notes provided.'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg font-medium text-sm"
                              disabled
                            >
                              Being Reviewed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'dispatched' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Tasks You've Posted</h2>
                  <button
                    onClick={() => setIsDispatchModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Post New Task
                  </button>
                </div>
                
                {loading ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading your posted tasks...</p>
                  </div>
                ) : createdTasks.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center">
                    <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Posted Tasks</h3>
                    <p className="text-gray-500 mb-6">Share your projects with the community to get help.</p>
                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Post Your First Task
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {createdTasks.map(task => (
                      <div key={task.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                {formatStatus(task.status)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {formatDate(task.created_at)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCompensation(task.compensation?.task)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Due {formatDate(task.deadline)}</span>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {task.description || 'No description provided.'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-medium text-sm hover:bg-red-200 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Are you sure you want to delete this task?')) {
                                  deleteTask(task.id);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {isTaskModalOpen && selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              setSelectedTask(null);
            }}
            onSubmit={handleTaskSubmitFromModal}
          />
        )}

        {isTaskActionModalOpen && selectedTask && (
          <TaskActionModal
            task={selectedTask}
            mode={actionMode}
            isOpen={isTaskActionModalOpen}
            onClose={() => {
              setIsTaskActionModalOpen(false);
              setSelectedTask(null);
            }}
            onSubmit={actionMode === 'review' ? handleTaskReview : handleTaskSubmit}
          />
        )}

        {isDispatchModalOpen && (
          <DispatchTaskModal
            isOpen={isDispatchModalOpen}
            onClose={() => setIsDispatchModalOpen(false)}
            onTaskCreated={(newTask) => {
              setCreatedTasks(prev => [newTask, ...prev]);
              setSuccess('Task created successfully!');
              setIsDispatchModalOpen(false);
            }}
          />
        )}

        {/* Skills Modal */}
        <SkillsModal 
          isOpen={isSkillsModalOpen}
          onClose={() => setIsSkillsModalOpen(false)}
          onComplete={() => {
            setIsSkillsModalOpen(false);
            setSuccess('Skills updated successfully!');
            // Refresh user skills
            // The original fetchDashboardData already handles this, but calling it again here
            // ensures the latest skills are displayed in the profile dropdown.
            // However, the original fetchDashboardData doesn't re-fetch userSkills.
            // For now, we'll just close the modal and show a success message.
            // A more robust solution would involve re-fetching userSkills after skills are updated.
          }}
        />
      </main>
    </div>
  );
};

export default ProfessionalDashboard; 