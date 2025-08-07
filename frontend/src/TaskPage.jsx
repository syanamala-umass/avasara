import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, User, Tag, Calendar, Share2 } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal';
import { fetchTaskById } from './api';

const TaskPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (!token || !userData) {
      // Redirect to login page with return URL
      navigate('/', { state: { returnUrl: `/tasks/${taskId}` } });
      return;
    }

    const fetchTask = async () => {
      try {
        setLoading(true);
        const response = await fetchTaskById(taskId);
        setTask(response.data);
      } catch (err) {
        setError('Task not found or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTask();
    }
  }, [taskId, navigate]);

  const handleShare = async () => {
    const taskUrl = `${window.location.origin}/tasks/${taskId}`;
    try {
      await navigator.clipboard.writeText(taskUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = taskUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const formatCompensation = (task) => {
    if (!task.compensation) return 'Not specified';
    
    if (typeof task.compensation === 'object') {
      const { type, amount } = task.compensation;
      if (type === 'cash') {
        return `$${amount}`;
      } else if (type === 'equity') {
        return `${amount}% equity`;
      }
    }
    
    return 'Not specified';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task...</p>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Task Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The task you are looking for does not exist.'}</p>
          <button
            onClick={() => navigate('/tasks')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Browse All Tasks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
            <button
              onClick={handleShare}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span>{shareSuccess ? 'Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {/* Task Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>
            
            <div className="flex items-center text-sm text-gray-500 gap-6 mb-4">
              <div className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                <span>{task.category || 'Other'}</span>
              </div>
              {formatCompensation(task) && formatCompensation(task) !== 'Not specified' && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatCompensation(task)}</span>
                </div>
              )}
              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-500 gap-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>Posted by {task.creator_name || 'Unknown User'}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(task.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Task Description */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
              {task.description}
            </div>
          </div>

          {/* Required Skills */}
          {task.skills && task.skills.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {task.skills.map((skill) => {
                  const minLevel = (task.skill_review_requirements || {})[skill.name] ?? 0.0;
                  return (
                    <span
                      key={skill.id || skill.name}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {skill.name} (Min {typeof minLevel === 'number' ? minLevel.toFixed(1) : minLevel})
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Assignments</div>
              <div className="text-2xl font-bold text-gray-900">{task.assignments_count || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Reviews</div>
              <div className="text-2xl font-bold text-gray-900">{task.reviews_count || 0}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500">Currently Working</div>
              <div className="text-2xl font-bold text-gray-900">{task.num_people_working || 0}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              View Full Details
            </button>
            <button
              onClick={() => navigate('/tasks')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Browse More Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={task}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onUndertake={async (task) => {
          setIsTaskModalOpen(false);
          navigate('/tasks', { state: { openTaskId: task.id } });
        }}
      />
    </div>
  );
};

export default TaskPage; 