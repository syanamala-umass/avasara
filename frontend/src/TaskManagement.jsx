import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Briefcase, Clock3, CheckCircle, AlertCircle, Star,
  Plus, DollarSign, Calendar, Tag, User, Sparkles
} from 'lucide-react';
import { fetchTasks, fetchMyAssignments, fetchTaskAssignments, fetchMyReviews } from './api';

const TaskManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTaskTab, setActiveTaskTab] = useState('posted');
  const [postedTasks, setPostedTasks] = useState([]);
  const [activeTasks, setActiveTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [underReviewTasks, setUnderReviewTasks] = useState([]);
  const [completedReviews, setCompletedReviews] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchTaskData = async () => {
      try {
        setLoading(true);
        
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
        if (!userDataFromStorage || !userDataFromStorage.id) {
          throw new Error('User data not found');
        }

        setUserData(userDataFromStorage);
        
        const [
          postedTasksResponse,
          activeTasksResponse,
          completedTasksResponse,
          underReviewTasksResponse,
          completedReviewsResponse
        ] = await Promise.allSettled([
          fetchTasks({ creator_id: userDataFromStorage.id, task_type: 'task' }),
          fetchMyAssignments('in_progress'),
          fetchTaskAssignments({ status: 'completed' }),
          fetchMyAssignments('submitted'),
          fetchMyReviews()
        ]);

        setPostedTasks(postedTasksResponse.status === 'fulfilled' ? (postedTasksResponse.value?.data || []) : []);
        setActiveTasks(activeTasksResponse.status === 'fulfilled' ? (activeTasksResponse.value?.data || []) : []);
        setCompletedTasks(completedTasksResponse.status === 'fulfilled' ? (completedTasksResponse.value?.data || []) : []);
        setUnderReviewTasks(underReviewTasksResponse.status === 'fulfilled' ? (underReviewTasksResponse.value?.data || []) : []);
        setCompletedReviews(completedReviewsResponse.status === 'fulfilled' ? (completedReviewsResponse.value?.data || []) : []);
      } catch (err) {
        console.error('Error fetching task data:', err);
        setError(err.message || 'Failed to fetch task data');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskData();
  }, []);

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const formatCompensation = (comp) => {
    if (!comp) return 'Not specified';
    return typeof comp === 'number' ? `$${comp}` : comp;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-spin-slow"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Profile</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Avasara</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Messages */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Task Management</h1>
              <p className="text-gray-400">Manage all your tasks and track your progress</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium flex items-center space-x-2 shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Post New Task</span>
            </button>
          </div>

          {/* Task Tabs */}
          <div className="border-b border-purple-500/20 mb-8">
            <nav className="flex space-x-8">
              {[
                { key: 'posted', label: 'Posted Tasks', count: postedTasks.length, icon: <Briefcase className="h-5 w-5" /> },
                { key: 'active', label: 'Active Tasks', count: activeTasks.length, icon: <Clock3 className="h-5 w-5" /> },
                { key: 'completed', label: 'Completed', count: completedTasks.length, icon: <CheckCircle className="h-5 w-5" /> },
                { key: 'under-review', label: 'Under Review', count: underReviewTasks.length, icon: <AlertCircle className="h-5 w-5" /> },
                { key: 'reviews', label: 'Reviews', count: completedReviews.length, icon: <Star className="h-5 w-5" /> }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTaskTab(tab.key)}
                  className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                    activeTaskTab === tab.key
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-purple-500/30'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span className="bg-slate-800/50 text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Task Content */}
          <div className="space-y-6">
            {/* Posted Tasks */}
            {activeTaskTab === 'posted' && (
              <div>
                {postedTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-xl mb-2">No posted tasks yet</p>
                    <p className="text-gray-500 text-sm">Create your first task to see it here</p>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 font-medium"
                    >
                      Post Your First Task
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">{task.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{task.description}</p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCompensation(task.compensation)}</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Posted {formatDate(task.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Tasks */}
            {activeTaskTab === 'active' && (
              <div>
                {activeTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <Clock3 className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-xl mb-2">No active tasks</p>
                    <p className="text-gray-500 text-sm">Tasks you're working on will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">{task.task_title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {task.notes || 'No additional notes provided'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="flex items-center space-x-2">
                            <Tag className="h-4 w-4" />
                            <span>Task #{task.task_id}</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{task.user_name}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Tasks */}
            {activeTaskTab === 'completed' && (
              <div>
                {completedTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-xl mb-2">No completed tasks</p>
                    <p className="text-gray-500 text-sm">Completed tasks will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">{task.task_title}</h3>
                          <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-200 rounded-full text-xs font-medium">
                            COMPLETED
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {task.notes || 'No additional notes provided'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Completed {formatDate(task.completed_at)}</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-green-400 font-medium">+${formatCompensation(task.compensation_amount)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Under Review Tasks */}
            {activeTaskTab === 'under-review' && (
              <div>
                {underReviewTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-xl mb-2">No tasks under review</p>
                    <p className="text-gray-500 text-sm">Tasks submitted for review will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {underReviewTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">{task.task_title}</h3>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-medium">
                            UNDER REVIEW
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {task.notes || 'No additional notes provided'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Submitted {formatDate(task.submitted_at || task.completed_at)}</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <Tag className="h-4 w-4" />
                            <span>Task #{task.task_id}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Reviews */}
            {activeTaskTab === 'reviews' && (
              <div>
                {completedReviews.length === 0 ? (
                  <div className="text-center py-16">
                    <Star className="h-16 w-16 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400 text-xl mb-2">No completed reviews</p>
                    <p className="text-gray-500 text-sm">Reviews you've completed will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedReviews.map(review => (
                      <div
                        key={review.id}
                        className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 hover:border-purple-400/40 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTaskClick(review)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white line-clamp-2">Review: {review.task_title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            review.is_approved 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {review.is_approved ? 'APPROVED' : 'REJECTED'}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                          {review.feedback || 'No feedback provided'}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Reviewed {formatDate(review.created_at)}</span>
                          </span>
                          <span className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span className="text-yellow-400 font-medium">+${formatCompensation(review.compensation)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskManagement; 