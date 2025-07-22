import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, User, FileText, MessageSquare, Calendar, DollarSign, AlertCircle, Star } from 'lucide-react';
import { fetchReviewTaskDetails, canUndertakeTask } from './api';

const ReviewDetailModal = ({ 
  isOpen, 
  task = {
    title: 'Untitled Review Task',
    description: 'No description provided',
    skills: [],
    compensation_type: 'cash',
    compensation_amount: 0,
    status: 'open',
    creator_name: 'Unknown Creator',
    type: 'review',
    id: null
  }, 
  onClose, 
  onUndertake,
  onReview 
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [taskDetails, setTaskDetails] = useState(null);
  const [error, setError] = useState(null);
  const [canUndertake, setCanUndertake] = useState(null);
  const [capabilityLoading, setCapabilityLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task?.id) {
      // For review tasks, default to submissions tab since that's what reviewers need to see
      setActiveTab('submissions');
      
      // Load detailed task information
      fetchAndSetTaskDetails();
      
      // Check capability for undertaking review tasks
      checkTaskCapability();
    }
  }, [isOpen, task?.id]);

  const fetchAndSetTaskDetails = async () => {
    if (!task?.id) return;
    
    try {
      const response = await fetchReviewTaskDetails(task.id);
      const taskData = response.data || response;
      
      // Add current user ID to task details
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData && userData.id) {
        taskData.current_user_id = userData.id;
      }
      
      setTaskDetails(taskData);
    } catch (err) {
      console.error('Error loading task details:', err);
      setError('Failed to load task details');
    }
  };

  const checkTaskCapability = async () => {
    if (!task?.id) return;
    
    setCapabilityLoading(true);
    try {
      const response = await canUndertakeTask(task.id, 'review');
      setCanUndertake(response.data);
    } catch (err) {
      console.error('Error checking task capability:', err);
      setCanUndertake({
        can_undertake: false,
        reason: 'Unable to check capabilities'
      });
    } finally {
      setCapabilityLoading(false);
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  const formatCompensation = (comp) => {
    if (!comp || !comp.compensation_type || !comp.amount) return 'No compensation specified';
    if (comp.compensation_type === 'cash') {
      return `$${comp.amount}`;
    } else if (comp.compensation_type === 'equity') {
      return `${comp.amount}% equity`;
    }
    return `${comp.amount} ${comp.compensation_type}`;
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-sm rounded-full font-medium";
    switch (status) {
      case 'open':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'submitted':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'resubmitted':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'needs_review':
        return `${baseClasses} bg-pink-100 text-pink-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
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

  const getStatusDescription = (status) => {
    switch (status) {
      case 'open':
        return 'This review task is available for assignment';
      case 'in_progress':
        return 'This review task is currently being worked on';
      case 'submitted':
        return 'This review task has been submitted for review';
      case 'completed':
        return 'This review task has been completed';
      case 'rejected':
        return 'This review task was rejected';
      default:
        return 'Status information not available';
    }
  };

  const renderCapabilityIndicator = () => {
    if (capabilityLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Checking capabilities...
        </div>
      );
    }

    if (!canUndertake) {
      return null;
    }

    // If the user already has an assignment for this review task, show nothing
    if (taskDetails?.has_assignment) {
      return null;
    }

    if (canUndertake.can_undertake) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          You can undertake this review task
        </div>
      );
    } else {
      // If reason is empty, render nothing
      if (!canUndertake.reason) {
        return null;
      }
      return (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <XCircle className="h-4 w-4" />
          {canUndertake.reason || 'You cannot undertake this review task'}
        </div>
      );
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Capability Indicator */}
      {renderCapabilityIndicator()}

      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Title</p>
            <p className="text-sm font-medium text-gray-900">{task.title}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <div className="flex items-center mt-1">
              <span className={getStatusBadge(task.status)}>
                {task.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created By</p>
            <p className="text-sm font-medium text-gray-900">{task.creator_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Created Date</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(task.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Parent Task</p>
            <p className="text-sm font-medium text-gray-900">{taskDetails?.parent_task_title || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm font-medium text-gray-900 capitalize">Review Task</p>
          </div>
        </div>
      </div>

      {/* Review Task Configuration */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-3">Review Task Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-600">Review Compensation</p>
            <p className="text-sm font-medium text-blue-900">
              {formatCompensation(taskDetails?.compensation)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Review Assignments</p>
            <p className="text-sm font-medium text-blue-900">
              {taskDetails?.assignments_count || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Reviews Submitted</p>
            <p className="text-sm font-medium text-blue-900">
              {taskDetails?.reviews_count || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.description}</p>
        </div>
      </div>

      {/* Skills Required */}
      {taskDetails?.skill_requirements && Object.keys(taskDetails.skill_requirements).length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-700 mb-3">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(taskDetails.skill_requirements).map(([skillName, level]) => (
              <span key={skillName} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {skillName} (Level {level})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Review Statistics */}
      {taskDetails && (
        <div className="bg-indigo-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-indigo-700 mb-3">Review Statistics</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded border border-indigo-200">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {taskDetails.assignments_count || 0}
                </div>
                <div className="text-xs text-indigo-600">Review Assignments</div>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-indigo-200">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {taskDetails.reviews_count || 0}
                </div>
                <div className="text-xs text-indigo-600">Reviews Submitted</div>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-indigo-200">
              <div className="text-center">
                <div className="text-lg font-bold text-indigo-600">
                  {taskDetails.approval_rate || 0}%
                </div>
                <div className="text-xs text-indigo-600">Approval Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissionsTab = () => {
    if (!taskDetails?.assignments || taskDetails.assignments.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No submissions found for review</p>
        </div>
      );
    }

    // Only show assignments of type 'task' (the actual submission)
    const submissionAssignments = taskDetails.assignments.filter(a => a.assignment_type === 'task');
    if (submissionAssignments.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No submissions found for review</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            Submissions ({submissionAssignments.length})
          </h4>
        </div>
        
        {submissionAssignments.map((assignment, index) => (
          <div key={assignment.id} className={`bg-white border rounded-lg p-4 ${
            assignment.is_submission_being_reviewed 
              ? 'border-yellow-300 bg-yellow-50' 
              : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className={`h-4 w-4 ${
                    assignment.is_submission_being_reviewed ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {assignment.contributor_name || assignment.reviewer_name || 'Unknown User'}
                  </span>
                  {assignment.is_submission_being_reviewed && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Submission Being Reviewed
                    </span>
                  )}
                  <span className={getStatusBadge(assignment.status)}>
                    {assignment.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Started</p>
                    <p className="font-medium">{formatDate(assignment.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium">{formatDate(assignment.submitted_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(assignment.updated_at)}</p>
                  </div>
                </div>

                {/* Submission Notes - prominent for the submission being reviewed */}
                {assignment.is_submission_being_reviewed && assignment.notes && (
                  <div className="mt-3">
                    <p className="text-xs text-yellow-700 mb-1 font-semibold">Submission Notes</p>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-sm text-gray-900">{assignment.notes}</p>
                    </div>
                  </div>
                )}
                {/* Regular notes for other assignments */}
                {!assignment.is_submission_being_reviewed && assignment.notes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  </div>
                )}

                {assignment.submission_files && assignment.submission_files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Submitted Files</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.submission_files.map((file, fileIndex) => (
                        <span key={fileIndex} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          <FileText className="h-3 w-3 mr-1" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show evaluation results if available */}
                {assignment.status === 'completed' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Work Approved</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      This work was approved by peer reviewers.
                    </p>
                  </div>
                )}
                
                {assignment.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Work Rejected</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      This work was rejected by peer reviewers.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Action buttons for the submission being reviewed */}
              {assignment.is_submission_being_reviewed && onReview && (
                <div className="ml-4">
                  <button
                    onClick={() => onReview(task, assignment)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                  >
                    Review This Submission
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReviewsTab = () => {
    if (!taskDetails?.reviews || taskDetails.reviews.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No reviews submitted yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Reviews ({taskDetails.reviews.length})</h4>
        </div>
        
        {taskDetails.reviews.map((review, index) => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {review.reviewer_name || 'Unknown Reviewer'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    review.is_approved 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {review.is_approved ? 'Approved' : 'Rejected'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <span className="text-gray-500">Reviewed on: </span>
                  <span className="font-medium">{formatDate(review.created_at)}</span>
                </div>

                {review.feedback && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Review Feedback</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{review.feedback}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Review Statistics */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-3">Review Statistics</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {taskDetails?.assignments_count || 0}
              </div>
              <div className="text-xs text-blue-600">Review Assignments</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {taskDetails?.reviews_count || 0}
              </div>
              <div className="text-xs text-blue-600">Reviews Submitted</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {taskDetails?.approval_rate || 0}%
              </div>
              <div className="text-xs text-blue-600">Approval Rate</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {taskDetails?.active_assignments || 0}
              </div>
              <div className="text-xs text-blue-600">Active Reviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Progress */}
      {taskDetails?.reviews && taskDetails.reviews.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-700 mb-3">Review Progress</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Approved Reviews</span>
              <span className="font-medium text-green-600">
                {taskDetails.reviews.filter(r => r.is_approved).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rejected Reviews</span>
              <span className="font-medium text-red-600">
                {taskDetails.reviews.filter(r => !r.is_approved).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Reviews</span>
              <span className="font-medium text-gray-900">
                {taskDetails.reviews.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Review Task Details: {task.title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {taskDetails?.assignments?.length > 0 || taskDetails?.reviews?.length > 0 ? (
                // Show all tabs for review tasks with data
                ['overview', 'submissions', 'reviews', 'stats'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))
              ) : (
                // Show only overview tab if no data
                <button
                  className="py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600"
                >
                  Overview
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'submissions' && renderSubmissionsTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'stats' && renderStatsTab()}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            {/* Undertake Review Task Button */}
            {onUndertake && 
              canUndertake?.can_undertake && 
              task.status === 'open'
            && (
              <button
                onClick={() => onUndertake(task)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Undertake Review Task
              </button>
            )}
            
            {/* Cannot Undertake Button */}
            {onUndertake && 
              canUndertake && 
              !canUndertake.can_undertake && 
              task.status === 'open'
            && !taskDetails?.has_assignment && (
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium cursor-not-allowed"
                title={canUndertake.reason}
              >
                Cannot Undertake
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewDetailModal; 