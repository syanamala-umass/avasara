import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Clock, Star, Clipboard, Lightbulb, Users, LogOut, Trash2, XCircle, Sparkles, ArrowRight, UserCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskDetailModal from './TaskDetailModal';
import TaskActionModal from './TaskActionModal';
import DispatchTaskModal from './DispatchTaskModal';
import ReviewSubmissionsModal from './ReviewSubmissionsModal';
import FindTasksModal from './FindTasksModal';
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
  fetchMyReviews
} from './api'; // Adjust path as needed


const UserDashboard = () => {
  // Add navigate for routing
  const navigate = useNavigate();
  
  // Initialize all state arrays properly
  const [createdTasks, setCreatedTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
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
  const [activeTab, setActiveTab] = useState('undertaking');
  
  // Task modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTaskActionModalOpen, setIsTaskActionModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState('submit');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [isReviewSubmissionsModalOpen, setIsReviewSubmissionsModalOpen] = useState(false);
  const [success, setSuccess] = useState(null);
  const [isFindTasksModalOpen, setIsFindTasksModalOpen] = useState(false);

  useEffect(() => {
    // Check for authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('userData'));
        console.log('User data from localStorage:', userData);
        
        if (!userData || !userData.id) {
          console.log('Missing user data or id');
          throw new Error('User data not found');
        }

        // Fetch all task data
        const [
          createdTasksResponse, 
          assignedTasksResponse, 
          completedTasksResponse, 
          completedReviewsResponse,
          reviewableTasksResponse,
          pendingReviewResponse,
          rejectedTasksResponse
        ] = await Promise.all([
          fetchTasks({ creator_id: userData.id }),
          fetchMyAssignments('in_progress'),
          fetchTaskAssignments({ status: 'completed' }),
          fetchMyReviews(),
          fetchTasks({ status: 'submitted' }),
          fetchMyAssignments('submitted_for_review'),
          fetchMyAssignments('rejected')
        ]);

        setCreatedTasks(createdTasksResponse.data || []);
        setAssignedTasks(assignedTasksResponse.data || []);
        setCompletedTasks(completedTasksResponse.data || []);
        setCompletedReviews(completedReviewsResponse.data || []);
        setReviewableTasks(reviewableTasksResponse.data || []);
        setPendingReviewTasks(pendingReviewResponse.data || []);
        setRejectedTasks(rejectedTasksResponse.data || []);

        console.log('Dashboard data loaded:');
        console.log('Created tasks:', createdTasksResponse.data?.length || 0);
        console.log('Assigned tasks:', assignedTasksResponse.data?.length || 0);
        console.log('Assigned tasks data:', assignedTasksResponse.data);
        console.log('Completed tasks:', completedTasksResponse.data?.length || 0);
        console.log('Completed reviews:', completedReviewsResponse.data?.length || 0);
        console.log('Reviewable tasks:', reviewableTasksResponse.data?.length || 0);
        console.log('Pending review tasks:', pendingReviewResponse.data?.length || 0);
        console.log('Rejected tasks:', rejectedTasksResponse.data?.length || 0);

      } catch (err) {
        console.error('Error loading dashboard data:', err);
        if (err.response?.status === 401) {
          // Clear invalid token and redirect to login
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

  // Handler for opening task modal
  const handleTaskClick = async (task) => {
    try {
      setLoading(true);
      // Fetch complete task details including skills and other related data
      // Both undertaking and pending_review tabs contain assignment data with task_id
      // Other tabs (completed, dispatched, rejected) contain task data with id
      const taskId = (activeTab === 'undertaking' || activeTab === 'pending_review') ? task.task_id : task.id;
      const response = await fetchTaskById(taskId);
      const taskData = response.data;
      
      console.log('Task clicked:', task);
      console.log('Task data:', taskData);
      console.log('Assignment type:', task.assignment_type);
      console.log('Active tab:', activeTab);
      console.log('Using taskId:', taskId);
      
      // Set modal state for all tasks (including review tasks)
      console.log('Opening modal for task');
      setSelectedTask(taskData);
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

  // Handler for submitting task
  const handleTaskSubmit = async (taskId, formData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await submitTask(taskId, formData);
      
      // Refresh task data to get updated lists
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [assignedTasksResponse, pendingReviewResponse] = await Promise.all([
        fetchMyAssignments('in_progress'),
        fetchMyAssignments('submitted_for_review')
      ]);
      
      // Update the lists with fresh data
      setAssignedTasks(assignedTasksResponse.data || []);
      setPendingReviewTasks(pendingReviewResponse.data || []);

      console.log('Task submission completed:');
      console.log('Assigned tasks after submission:', assignedTasksResponse.data?.length || 0);
      console.log('Pending review tasks after submission:', pendingReviewResponse.data?.length || 0);

      setSuccess('Work submitted successfully! Your submission is now pending review.');
      
      // Close the modal
      setIsTaskActionModalOpen(false);
      setSelectedTask(null);
      
    } catch (error) {
      console.error('Error submitting task:', error);
      setError('Failed to submit task for review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for reviewing task
  const handleTaskReview = async (taskId, reviewData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Only send rating and feedback to the backend
      const { rating, feedback } = reviewData;
      await reviewTask(taskId, { rating, feedback });
      
      // Refresh task data to get updated lists
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [completedTasksResponse, completedReviewsResponse] = await Promise.all([
        fetchTaskAssignments({ status: 'completed' }),
        fetchMyReviews()
      ]);
      
      // Update the lists with fresh data
      setCompletedTasks(completedTasksResponse.data || []);
      setCompletedReviews(completedReviewsResponse.data || []);
      
      // Close the modal
      setIsTaskActionModalOpen(false);
      setSelectedTask(null);
      setSuccess('Review submitted successfully!');
      
    } catch (error) {
      console.error('Error reviewing task:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handler for navigating to idea detail page
  const handleIdeaClick = (ideaId) => {
    navigate(`/ideas/${ideaId}`);
  };

  // Handler for adding a new idea
  const handleAddNewIdea = () => {
    navigate('/ideas/new');
  };

  // Add logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    navigate('/');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatCompensation = (amount, type) => {
    if (!amount || !type) return 'No compensation specified';
    if (type === 'cash') {
      return `$${amount}`;
    } else if (type === 'equity') {
      return `${amount}% equity`;
    }
    return `${amount} ${type}`;
  };

  const handleTaskCreated = (newTask) => {
    console.log('Task created:', newTask);
    setCreatedTasks(prev => [newTask, ...prev]);
    setSuccess('Task created successfully!');
  };

  // Add handleUndertakeTask function
  const handleUndertakeTask = async (task) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      if (task.category === 'review') {
        // For review tasks, create assignment with in_progress status
        await createTaskAssignment({
          task_id: task.id,
          assignment_type: 'review',
          status: 'in_progress',
          notes: 'Task being reviewed'
        });
        
        // Update the task status in the UI
        setAssignedTasks(prevTasks => [{
          ...task,
          status: 'in_progress',
          task_id: task.id,
          assignment_type: 'review'
        }, ...prevTasks]);
        setSuccess('Successfully started reviewing the task!');
      } else {
        // For regular tasks, create assignment with in_progress status
        await createTaskAssignment({
          task_id: task.id,
          assignment_type: 'task',
          status: 'in_progress',
          notes: 'Task undertaken'
        });
        
        // Update the task status in the UI
        setAssignedTasks(prevTasks => [{
          ...task,
          status: 'in_progress',
          task_id: task.id,
          assignment_type: 'task'
        }, ...prevTasks]);
        setSuccess('Successfully undertaken the task!');
      }
      
      // Refresh task data
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [createdTasksResponse, assignedTasksResponse] = await Promise.all([
        fetchTasks({ creator_id: userData.id }),
        fetchMyAssignments('in_progress')
      ]);
      
      setCreatedTasks(createdTasksResponse.data || []);
      setAssignedTasks(assignedTasksResponse.data || []);
      
      // Close the modal after a short delay to show the success message
      setTimeout(() => {
        setIsTaskModalOpen(false);
        setSelectedTask(null);
      }, 1500);
      
    } catch (error) {
      console.error('Error undertaking task:', error);
      setError('Failed to undertake task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation(); // Prevent task modal from opening
    
    if (!window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await deleteTask(taskId);
      
      // Remove the task from the created tasks list
      setCreatedTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      setSuccess('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async (task) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Reset the task status back to in_progress for resubmission
      await updateTaskAssignment(task.task_id, { status: 'in_progress' });
      
      // Refresh task data to get updated lists
      const userData = JSON.parse(localStorage.getItem('userData'));
      const [assignedTasksResponse, rejectedTasksResponse] = await Promise.all([
        fetchMyAssignments('in_progress'),
        fetchMyAssignments('rejected')
      ]);
      
      // Update the lists with fresh data
      setAssignedTasks(assignedTasksResponse.data || []);
      setRejectedTasks(rejectedTasksResponse.data || []);

      setSuccess('Task has been reset for resubmission. You can now submit your work again.');
      
      // Close the modal
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      
    } catch (error) {
      console.error('Error resubmitting task:', error);
      setError('Failed to reset task for resubmission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Gradient Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg rounded-b-3xl mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">Welcome to Your Dashboard</h1>
              <p className="text-indigo-100 text-sm md:text-base mt-1">Track your tasks, reviews, and progress in the Avasara community</p>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex items-center space-x-4">
            {/* Find Tasks Button */}
            <button
              onClick={() => setIsFindTasksModalOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 shadow transition-all duration-200 border-2 border-white/40 focus:outline-none mr-2"
              title="Find Tasks"
            >
              <Search className="h-7 w-7 text-indigo-100" />
            </button>
            {/* Profile Button */}
            <button
              onClick={() => navigate('/profile')}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 shadow transition-all duration-200 border-2 border-white/40 focus:outline-none mr-2"
              title="Profile"
            >
              <UserCircle className="h-7 w-7 text-white" />
            </button>
            <button
              onClick={handleLogout}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-semibold shadow hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message if present */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl shadow">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success Message if present */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl shadow">
            <p className="font-bold">Success</p>
            <p>{success}</p>
          </div>
        )}

        {/* Top Tab Navigation */}
        <div className="mb-10 flex flex-wrap gap-2 justify-center">
          {[
            { key: 'undertaking', label: 'Undertaking', icon: <Clipboard className="h-5 w-5 mr-2" /> },
            { key: 'completed', label: 'Completed', icon: <CheckCircle className="h-5 w-5 mr-2" /> },
            { key: 'pending_review', label: 'Pending Review', icon: <Clock className="h-5 w-5 mr-2" /> },
            { key: 'rejected', label: 'Rejected', icon: <XCircle className="h-5 w-5 mr-2" /> },
            { key: 'dispatched', label: 'Dispatched', icon: <Lightbulb className="h-5 w-5 mr-2" /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-6 py-3 rounded-full font-semibold text-sm shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white scale-105 shadow-xl'
                  : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-indigo-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-12 py-3 border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-base"
                placeholder="Search for tasks or startups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="submit"
                  className="h-full px-6 border-l border-indigo-200 text-indigo-600 font-semibold hover:text-indigo-800 focus:outline-none"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results (Conditional) */}
        {showSearchResults && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              <button 
                onClick={() => setShowSearchResults(false)}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Close
              </button>
            </div>
            {searchResults.length === 0 ? (
              <div className="bg-white shadow rounded-2xl p-8 text-center text-gray-500">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="bg-white shadow rounded-2xl overflow-hidden">
                <ul className="divide-y divide-indigo-100">
                  {searchResults.map(task => (
                    <li 
                      key={task.id} 
                      className="p-6 hover:bg-indigo-50 transition cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">{task.startup_name}</span>
                            <span className="mr-3">•</span>
                            <span className="mr-3">Due: {formatDate(task.deadline)}</span>
                            <span className="mr-3">•</span>
                            <span className="font-medium text-indigo-600">{formatCompensation(task.compensation_amount, task.compensation_type)}</span>
                          </div>
                        </div>
                        <button 
                          className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow hover:from-indigo-700 hover:to-purple-700 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskClick(task);
                          }}
                        >
                          View Task
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'undertaking' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks I'm Undertaking</h2>
            
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">Loading your tasks...</p>
              </div>
            ) : assignedTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">You don't have any active tasks.</p>
                <button 
                  onClick={() => navigate('/contributor/tasks')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Find Tasks
                </button>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {assignedTasks.map(task => {
                    console.log('Rendering task in undertaking tab:', task);
                    console.log('Task assignment_type:', task.assignment_type);
                    console.log('Task status:', task.status);
                    return (
                    <li 
                      key={task.id} 
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{task.task_title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">Task ID: {task.task_id}</span>
                            <span className="mr-3">•</span>
                            <span className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              Status: {formatStatus(task.status)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button 
                            className={`px-4 py-2 text-white rounded hover:bg-opacity-90 transition flex items-center ${
                              task.assignment_type === 'review' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Task action clicked:', task);
                              console.log('Assignment type:', task.assignment_type);
                              console.log('Task status:', task.status);
                              handleTaskAction(task, task.assignment_type === 'review' ? 'review' : 'submit');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {task.assignment_type === 'review' ? 'Submit Review' : 'Submit Work'}
                          </button>
                        </div>
                      </div>
                    </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Tasks & Reviews</h2>
            
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">Loading completed tasks...</p>
              </div>
            ) : (completedTasks.length === 0 && completedReviews.length === 0) ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No completed tasks or reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Completed Tasks Section */}
                {completedTasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Completed Tasks</h3>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {completedTasks.map(task => (
                          <li 
                            key={task.id} 
                            className="p-4 hover:bg-gray-50 transition cursor-pointer"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <span className="mr-3">{task.startup_name}</span>
                                  <span className="mr-3">•</span>
                                  <span className="mr-3">Status: {formatStatus(task.status)}</span>
                                  <span className="mr-3">•</span>
                                  <span className="mr-3">Completed: {formatDate(task.completed_at)}</span>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mr-4">
                                  {formatCompensation(task.review_compensation, 'cash')}
                                </span>
                                <button 
                                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskClick(task);
                                  }}
                                >
                                  <Star className="h-4 w-4 mr-2" />
                                  Review
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Completed Reviews Section */}
                {completedReviews.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Completed Reviews</h3>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {completedReviews.map(review => (
                          <li 
                            key={review.id} 
                            className="p-4 hover:bg-gray-50 transition cursor-pointer"
                            onClick={() => handleTaskClick({ id: review.task_id })}
                          >
                            <div className="flex justify-between">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{review.task_title || `Task ${review.task_id}`}</h3>
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                  <span className="mr-3">Reviewed by: {review.reviewer_name}</span>
                                  <span className="mr-3">•</span>
                                  <span className={`mr-3 px-2 py-1 rounded-full text-xs font-medium ${
                                    review.is_approved 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {review.is_approved ? 'Approved' : 'Rejected'}
                                  </span>
                                  <span className="mr-3">•</span>
                                  <span className="mr-3">Reviewed: {formatDate(review.created_at)}</span>
                                </div>
                                {review.feedback && (
                                  <div className="mt-2 text-sm text-gray-600">
                                    <strong>Feedback:</strong> {review.feedback}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center">
                                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mr-4">
                                  {formatCompensation(review.compensation_amount, 'cash')}
                                </span>
                                <button 
                                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTaskClick({ id: review.task_id });
                                  }}
                                >
                                  View Task
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending_review' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks Pending Review</h2>
            
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : pendingReviewTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No tasks pending review.</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {pendingReviewTasks.map(task => (
                    <li 
                      key={task.id} 
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{task.task_title || task.title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">Task ID: {task.task_id || task.id}</span>
                            <span className="mr-3">•</span>
                            <span className="mr-3">Submitted: {formatDate(task.submitted_at)}</span>
                            <span className="mr-3">•</span>
                            <span className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              Pending Review
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rejected' && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Rejected Tasks</h2>
            
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">Loading rejected tasks...</p>
              </div>
            ) : rejectedTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">No rejected tasks yet.</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {rejectedTasks.map(task => (
                    <li 
                      key={task.id} 
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{task.title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">{task.startup_name}</span>
                            <span className="mr-3">•</span>
                            <span className="mr-3">Rejected: {formatDate(task.rejected_at)}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dispatched' && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Tasks I've Dispatched</h2>
              <button 
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Dispatch New Task
              </button>
            </div>
            
            {loading ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">Loading your tasks...</p>
              </div>
            ) : createdTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <p className="text-gray-500">You haven't dispatched any tasks yet.</p>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {createdTasks.map(task => (
                    <li 
                      key={task.id} 
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{task.title || 'Untitled Task'}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className="mr-3">Status: {formatStatus(task.status || 'open')}</span>
                            <span className="mr-3">•</span>
                            <span className="mr-3">Due: {formatDate(task.deadline)}</span>
                            {task.status !== 'completed' && (
                              <>
                                <span className="mr-3">•</span>
                                <span className="mr-3">{task.num_people_working || 0} {(task.num_people_working || 0) === 1 ? 'person' : 'people'} working</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {formatCompensation(task.compensation_amount, task.compensation_type)}
                          </span>
                          {task.status === 'open' && (
                            <button 
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition"
                              onClick={(e) => handleDeleteTask(task.id, e)}
                              title="Delete Task"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                          {task.status === 'submitted_for_review' && (
                            <button 
                              className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-medium hover:bg-yellow-200 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTask(task);
                                setIsReviewSubmissionsModalOpen(true);
                              }}
                              title="View Review Submissions"
                            >
                              View Submissions
                            </button>
                          )}
                          <button 
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Summary Widget */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
            Your Summary
          </h2>
          <div className="bg-gradient-to-r from-indigo-100/80 via-white/80 to-purple-100/80 backdrop-blur-md shadow-2xl rounded-3xl overflow-hidden p-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Undertaking */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <Clipboard className="h-8 w-8 text-indigo-500 group-hover:text-indigo-700 mb-2 transition" />
                <div className="text-4xl font-extrabold text-gray-900 group-hover:text-indigo-700 transition">{assignedTasks.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-indigo-700 transition">Undertaking</div>
              </div>
              {/* Dispatched */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <Lightbulb className="h-8 w-8 text-yellow-500 group-hover:text-yellow-700 mb-2 transition" />
                <div className="text-4xl font-extrabold text-gray-900 group-hover:text-yellow-700 transition">{createdTasks.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-yellow-700 transition">Dispatched</div>
              </div>
              {/* Completed Tasks */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <CheckCircle className="h-8 w-8 text-green-500 group-hover:text-green-700 mb-2 transition" />
                <div className="text-4xl font-extrabold text-gray-900 group-hover:text-green-700 transition">{completedTasks.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-green-700 transition">Completed</div>
              </div>
              {/* Completed Reviews */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <Star className="h-8 w-8 text-blue-500 group-hover:text-blue-700 mb-2 transition" />
                <div className="text-4xl font-extrabold text-blue-600 group-hover:text-blue-800 transition">{completedReviews.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-blue-700 transition">Reviews</div>
              </div>
              {/* Pending Review */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <Clock className="h-8 w-8 text-yellow-600 group-hover:text-yellow-800 mb-2 transition" />
                <div className="text-4xl font-extrabold text-gray-900 group-hover:text-yellow-800 transition">{pendingReviewTasks.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-yellow-800 transition">Pending Review</div>
              </div>
              {/* Rejected */}
              <div className="group flex flex-col items-center justify-center p-8 transition-all duration-200 hover:scale-105 cursor-pointer rounded-2xl bg-white/60 shadow-md m-2">
                <XCircle className="h-8 w-8 text-red-500 group-hover:text-red-700 mb-2 transition" />
                <div className="text-4xl font-extrabold text-red-600 group-hover:text-red-800 transition">{rejectedTasks.length}</div>
                <div className="mt-1 text-base font-medium text-gray-600 group-hover:text-red-700 transition">Rejected</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Task Detail Modal */}
      <TaskDetailModal 
        isOpen={isTaskModalOpen}
        task={selectedTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
          setSuccess(null);
          setError(null);
        }}
        onUndertake={() => handleUndertakeTask(selectedTask)}
        isReviewTask={selectedTask?.assignment_type === 'review'}
        onResubmit={handleResubmit}
      />

      {/* Task Action Modal */}
      <TaskActionModal
        isOpen={isTaskActionModalOpen}
        task={selectedTask}
        onClose={() => setIsTaskActionModalOpen(false)}
        onSubmit={actionMode === 'submit' ? handleTaskSubmit : handleTaskReview}
        mode={actionMode}
      />

      {/* Dispatch Task Modal */}
      <DispatchTaskModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />

      {/* Review Submissions Modal */}
      <ReviewSubmissionsModal
        isOpen={isReviewSubmissionsModalOpen}
        task={selectedTask}
        onClose={() => setIsReviewSubmissionsModalOpen(false)}
      />

      {/* Find Tasks Modal */}
      <FindTasksModal
        isOpen={isFindTasksModalOpen}
        onClose={() => setIsFindTasksModalOpen(false)}
        onTaskClick={handleTaskClick}
        onUndertakeTask={handleUndertakeTask}
      />
    </div>
  );
};

export default UserDashboard;