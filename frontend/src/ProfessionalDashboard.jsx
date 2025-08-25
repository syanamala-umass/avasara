import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, CheckCircle, Clock, Star, Clipboard, Lightbulb, Users, LogOut, 
  Trash2, XCircle, Sparkles, ArrowRight, UserCircle, Filter, MapPin, 
  DollarSign, Calendar, TrendingUp, Award, Target, Zap, Briefcase,
  Eye, Heart, Share2, Bookmark, MessageCircle, Settings, User, Plus, ChevronDown, Tag
} from 'lucide-react';
import NotificationBell from './components/NotificationBell';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';
import ReviewDetailModal from './ReviewDetailModal';
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
import Logo from './components/Logo';

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
        const taskData = response.data || response;
        setSelectedTask({ ...taskData, type: 'review' });
        setIsTaskModalOpen(true);
      } else {
        // For regular tasks, use the regular task endpoint
        let taskId;
        if (activeTab === 'completed') {
          taskId = task.task_id || task.id;
        } else if (activeTab === 'undertaking' || activeTab === 'pending_review') {
          taskId = task.task_id || task.id;
        } else {
          taskId = task.id;
        }
        response = await fetchTaskById(taskId);
        const taskData = response.data || response;
        let displayStatus = taskData.status;
        if ((activeTab === 'undertaking' || activeTab === 'pending_review') && task.status) {
          displayStatus = task.status;
        }
        setSelectedTask({ ...taskData, status: displayStatus, type: 'task' });
        setIsTaskModalOpen(true);
      }
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
    window.location.href = '/';
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
      'draft': 'bg-gray-100 text-gray-800',
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
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              {/* Logo and Brand */}
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  Avasara
                </span>
              </div>

                          {/* Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {/* Empty for now - removed Post Task and Profile buttons */}
            </div>

                            {/* User Menu */}
              <div className="flex items-center space-x-4">
                <NotificationBell />
                
                <button
                  onClick={() => navigate('/profile')}
                  className="text-white hover:text-gray-200 transition-colors p-2"
                  title="Profile"
                >
                  <UserCircle className="h-5 w-5" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-red-200 transition-colors p-2"
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-spin-slow"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl">
                {success}
              </div>
            )}

            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome back, <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{userData?.first_name || 'User'}</span>
              </h1>
              <p className="text-gray-300">Here's what's happening with your tasks today</p>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Active Tasks</p>
                    <p className="text-3xl font-bold text-white">{assignedTasks.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                    <Briefcase className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold text-white">{completedTasks.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Reviews</p>
                    <p className="text-3xl font-bold text-white">{completedReviews.length}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Earnings</p>
                    <p className="text-3xl font-bold text-white">${totalEarnings}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Recommended Tasks */}
              <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Tasks</span> Recommended for You
                    </h2>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {recommendedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Briefcase className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-400 text-lg">No recommended tasks available</p>
                      <p className="text-gray-500 text-sm mt-2">Complete your profile to get personalized recommendations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recommendedTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 cursor-pointer hover:border-purple-400/40 transition-all duration-300"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                            {task.matching_skills_count > 0 && (
                              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium">
                                {task.matching_skills_count} skills match
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span>{task.category || 'General'}</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>{formatCompensation(task.compensation)}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Tasks Section */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 mb-8">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Your Active
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"> Tasks</span>
                  </h2>
                  {assignedTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-400 text-lg">No active tasks</p>
                      <p className="text-gray-500 text-sm mt-2">Start by browsing available tasks</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {assignedTasks.map(task => (
                        <div
                          key={task.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{task.task_title}</h3>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {formatStatus(task.status)}
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {task.notes || 'No additional notes provided'}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                            <span className="flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span>Task #{task.task_id}</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{task.user_name}</span>
                            </span>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskAction(task, 'submit');
                              }}
                              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                            >
                              Submit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTaskClick({ id: task.task_id });
                              }}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Tasks & Reviews Section */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Completed</span> Tasks & Reviews
                    </h2>
                    <button
                      onClick={() => navigate('/task-management')}
                      className="text-green-400 hover:text-green-300 text-sm font-medium flex items-center space-x-1"
                    >
                      <span>Manage Tasks</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {completedTasks.length === 0 && completedReviews.length === 0 && pendingReviewTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-gray-400 text-lg">No completed work yet</p>
                      <p className="text-gray-500 text-sm mt-2">Complete your first task to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Under Review Tasks */}
                      {pendingReviewTasks.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{task.task_title}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-xs rounded-full font-medium">
                                Under Review
                              </span>
                              <span className="text-orange-400 text-sm font-medium">
                                Task #{task.task_id}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {task.notes || 'No additional notes provided'}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Submitted {formatDate(task.submitted_at || task.completed_at)}</span>
                            </span>
                            <button
                              onClick={() => handleTaskClick({ id: task.task_id })}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Completed Tasks */}
                      {completedTasks.slice(0, 5).map(task => (
                        <div
                          key={task.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">{task.task_title}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium">
                                Completed
                              </span>
                              <span className="text-green-400 text-sm font-medium">
                                Task #{task.task_id}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {task.notes || 'No additional notes provided'}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Completed {formatDate(task.completed_at)}</span>
                            </span>
                            <button
                              onClick={() => handleTaskClick({ id: task.task_id })}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Completed Reviews */}
                      {completedReviews.slice(0, 3).map(review => (
                        <div
                          key={review.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Review: {review.task_title}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs rounded-full font-medium">
                                Review
                              </span>
                              <span className="text-yellow-400 text-sm font-medium">
                                +${formatCompensation(review.compensation)}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              review.is_approved 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {review.is_approved ? 'Approved' : 'Rejected'}
                            </span>
                            {review.feedback && (
                              <span className="text-gray-400 ml-2">- {review.feedback}</span>
                            )}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <span className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>Reviewed {formatDate(review.created_at)}</span>
                            </span>
                            <button
                              onClick={() => handleTaskClick({ id: review.task_id })}
                              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
                            >
                              View Task
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* View All Button */}
                      {(completedTasks.length > 5 || completedReviews.length > 3 || pendingReviewTasks.length > 3) && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => navigate('/task-management')}
                            className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center justify-center space-x-2 mx-auto"
                          >
                            <span>Manage All Tasks</span>
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Quick Actions & Stats */}
              <div className="space-y-8">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setIsDispatchModalOpen(true)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                    >
                      <Plus className="h-5 w-5" />
                      <span>Post New Task</span>
                    </button>
                    <button
                      onClick={() => navigate('/tasks')}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                    >
                      <Briefcase className="h-5 w-5" />
                      <span>Browse Tasks</span>
                    </button>
                    <button
                      onClick={() => setIsSkillsModalOpen(true)}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                    >
                      <Target className="h-5 w-5" />
                      <span>Update Skills</span>
                    </button>
                  </div>
                </div>

                {/* Skills in Demand */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Skills in Demand</h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                    </div>
                  ) : !topSkills || topSkills.length === 0 ? (
                    <p className="text-gray-400 text-sm">No skills data available</p>
                  ) : (
                    <div className="space-y-3">
                      {topSkills.slice(0, 5).map((skill, index) => (
                        <div 
                          key={skill.id} 
                          className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                          onClick={() => navigate(`/skills/${skill.id}`)}
                        >
                          <span className="text-gray-300 text-sm">{skill.name}</span>
                          <span className="text-purple-400 text-xs font-medium">{skill.task_count} tasks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posted Tasks */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Posted Tasks</h3>
                  {createdTasks.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-gray-400 text-sm">No posted tasks yet</p>
                      <p className="text-gray-500 text-xs mt-1">Create your first task to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {createdTasks.slice(0, 3).map(task => (
                        <div 
                          key={task.id}
                          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-xl p-3 cursor-pointer hover:border-indigo-400/40 transition-all duration-300"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white line-clamp-1">{task.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                              {formatStatus(task.status)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{formatCompensation(task.compensation)}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(task.created_at)}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                      {createdTasks.length > 3 && (
                        <button
                          onClick={() => navigate('/task-management')}
                          className="w-full text-purple-400 hover:text-purple-300 text-xs font-medium text-center py-2"
                        >
                          View All {createdTasks.length} Posted Tasks →
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Top Skills */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Your Top Skills</h3>
                  {userSkills.length === 0 ? (
                    <p className="text-gray-400 text-sm">No skills added yet</p>
                  ) : (
                    <div className="space-y-3">
                      {userSkills.slice(0, 5).map((skill, index) => (
                        <div 
                          key={skill.id} 
                          className="flex items-center justify-between cursor-pointer hover:bg-slate-700/30 rounded-lg p-2 transition-colors"
                          onClick={() => navigate(`/skills/${skill.id}`)}
                        >
                          <span className="text-gray-300 text-sm">{skill.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                style={{ width: `${(skill.rating / 5) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-gray-400 text-xs">{skill.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {completedTasks.slice(0, 3).map(task => (
                      <div key={task.id} className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{task.task_title}</p>
                          <p className="text-gray-400 text-xs">Completed {formatDate(task.completed_at)}</p>
                        </div>
                      </div>
                    ))}
                    {completedTasks.length === 0 && (
                      <p className="text-gray-400 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isTaskModalOpen && selectedTask && (
        selectedTask.type === 'review' ? (
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
            onSubmit={handleTaskSubmitFromModal}
            onUndertake={async (task) => {
              // You can customize this logic as needed
              // For now, just navigate to /tasks and open the undertake modal for this task
              setIsTaskModalOpen(false);
              navigate('/tasks', { state: { openTaskId: task.id } });
            }}
          />
        )
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
    </>
  );
};

export default ProfessionalDashboard; 