import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { getAssignmentDurationInfo, cancelOverdueAssignment } from '../api';
import { useNotifications } from '../contexts/NotificationContext';

const TaskDurationInfo = ({ assignmentId, task, onAssignmentCancelled }) => {
  const [durationInfo, setDurationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (assignmentId) {
      loadDurationInfo();
    }
  }, [assignmentId]);

  // Calculate warning states for useEffect hooks
  const getWarningStates = () => {
    if (!durationInfo) return { showOneHourWarning: false, showFinalWarning: false };
    
    const { duration_info, task_duration_limits, overdue_info } = durationInfo;
    const { task_duration_hours } = task_duration_limits;
    const { is_overdue, should_cancel } = overdue_info;

    // Calculate time remaining
    const getTimeRemaining = () => {
      if (!duration_info.created_at || !task_duration_hours) {
        return null;
      }
      const startTime = new Date(duration_info.created_at);
      const maxEndTime = new Date(startTime.getTime() + task_duration_hours * 60 * 60 * 1000);
      const now = new Date();
      const timeRemaining = maxEndTime - now;
      if (timeRemaining <= 0) {
        return { overdue: true, hours: Math.abs(timeRemaining) / (60 * 60 * 1000) };
      }
      return { overdue: false, hours: timeRemaining / (60 * 60 * 1000) };
    };

    const timeRemaining = getTimeRemaining();
    const showFinalWarning = is_overdue && should_cancel;
    const showOneHourWarning = timeRemaining && !timeRemaining.overdue && timeRemaining.hours <= 1;

    return { showOneHourWarning, showFinalWarning };
  };

  const { showOneHourWarning, showFinalWarning } = getWarningStates();

  // Send notifications for warnings - moved to top level
  useEffect(() => {
    if (showOneHourWarning) {
      addNotification({
        type: 'warning',
        title: 'Task Deadline Approaching',
        message: `You have less than 1 hour left to complete this task. If you do not submit before the deadline, your assignment will be cancelled and the task will be reopened for others.`
      });
    }
  }, [showOneHourWarning, addNotification]);

  useEffect(() => {
    if (showFinalWarning) {
      addNotification({
        type: 'error',
        title: 'Task Deadline Missed',
        message: 'You have missed the deadline! Your assignment will be cancelled soon and the task will be made available to others.'
      });
    }
  }, [showFinalWarning, addNotification]);

  const loadDurationInfo = async () => {
    try {
      setLoading(true);
      const response = await getAssignmentDurationInfo(assignmentId);
      setDurationInfo(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load duration information');
      console.error('Error loading duration info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAssignment = async () => {
    setShowConfirmDialog(true);
  };

  const confirmCancelAssignment = async () => {
    try {
      setCancelling(true);
      setShowConfirmDialog(false);
      await cancelOverdueAssignment(assignmentId);
      if (onAssignmentCancelled) {
        onAssignmentCancelled();
      }
      addNotification({
        type: 'success',
        title: 'Assignment Cancelled',
        message: 'Assignment cancelled successfully. Task is now available for other users.'
      });
    } catch (err) {
      setError('Failed to cancel assignment');
      console.error('Error cancelling assignment:', err);
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: 'Failed to cancel assignment. Please try again.'
      });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        <XCircle className="inline w-4 h-4 mr-1" />
        {error}
      </div>
    );
  }

  if (!durationInfo) {
    return null;
  }

  const { duration_info, task_duration_limits, overdue_info } = durationInfo;
  const { task_duration_hours } = task_duration_limits;
  const { is_overdue, hours_overdue, should_cancel } = overdue_info;

  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!duration_info.created_at || !task_duration_hours) {
      return null;
    }
    const startTime = new Date(duration_info.created_at);
    const maxEndTime = new Date(startTime.getTime() + task_duration_hours * 60 * 60 * 1000);
    const now = new Date();
    const timeRemaining = maxEndTime - now;
    if (timeRemaining <= 0) {
      return { overdue: true, hours: Math.abs(timeRemaining) / (60 * 60 * 1000) };
    }
    return { overdue: false, hours: timeRemaining / (60 * 60 * 1000) };
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="bg-white border rounded-lg p-3 sm:p-4 space-y-4 w-full max-w-full sm:max-w-lg mx-1 sm:mx-0">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Duration Information</h3>
      </div>

      {/* Task Duration */}
      <div className="text-sm">
        <span className="font-medium text-gray-600">Task Duration:</span>
        <span className="ml-2 text-gray-800">
          {task_duration_hours ? `${task_duration_hours} hours` : 'Not set'}
        </span>
      </div>

      {/* Work Status */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="font-medium text-green-800">Work Started</span>
        </div>
        <div className="text-sm text-gray-600">
          <div>Started: {new Date(duration_info.created_at).toLocaleString()}</div>
          {duration_info.actual_duration_hours && (
            <div>Time taken: {duration_info.actual_duration_hours.toFixed(1)} hours</div>
          )}
        </div>
        {/* Time Remaining Status */}
        {timeRemaining && (
          <div className={`border rounded-lg p-3 ${
            timeRemaining.overdue 
              ? 'bg-red-50 border-red-200' 
              : timeRemaining.hours < 2 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              {timeRemaining.overdue ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : timeRemaining.hours < 2 ? (
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-600" />
              )}
              <span className={`font-medium ${
                timeRemaining.overdue 
                  ? 'text-red-800' 
                  : timeRemaining.hours < 2 
                    ? 'text-orange-800' 
                    : 'text-green-800'
              }`}>
                {timeRemaining.overdue 
                  ? 'Overdue' 
                  : timeRemaining.hours < 2 
                    ? 'Time Running Out' 
                    : 'On Track'
                }
              </span>
            </div>
            <p className={`text-sm ${
              timeRemaining.overdue 
                ? 'text-red-700' 
                : timeRemaining.hours < 2 
                  ? 'text-orange-700' 
                  : 'text-green-700'
            }`}>
              {timeRemaining.overdue 
                ? `Task is ${timeRemaining.hours.toFixed(1)} hours overdue`
                : `${timeRemaining.hours.toFixed(1)} hours remaining`
              }
            </p>
          </div>
        )}
      </div>

      {/* Overdue Assignment Warning */}
      {is_overdue && should_cancel && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span className="font-medium text-red-800">Assignment Overdue</span>
          </div>
          <p className="text-sm text-red-700 mb-3">
            This assignment is {hours_overdue.toFixed(1)} hours overdue. 
            The assignment should be cancelled to make the task available for other users.
          </p>
          <button
            onClick={handleCancelAssignment}
            disabled={cancelling}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {cancelling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                Cancel Assignment
              </>
            )}
          </button>
        </div>
      )}

      {/* Task Completion Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-800">Task Completion</span>
        </div>
        <p className="text-sm text-blue-700">
          Tasks are completed automatically after peer review. Submit your work when ready. If you miss the deadline, your assignment will be cancelled and the task will be made available for others.
        </p>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-full sm:max-w-md w-full mx-2 sm:mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Cancellation</h3>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel this assignment? This will put the task back in open state for other users.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCancelAssignment}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDurationInfo; 