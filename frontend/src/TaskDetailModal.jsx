import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, User, FileText, MessageSquare, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { fetchTaskDetails, fetchReviewTaskDetails, canUndertakeTask } from './api';
import TaskDurationInfo from './components/TaskDurationInfo';

const TaskDetailModal = ({ isOpen, task = {
  title: 'Untitled Task',
  description: 'No description provided',
  skills: [],
  compensation_type: 'cash',
  compensation_amount: 0,
  review_compensation_type: 'cash',
  review_compensation_amount: 0,
  status: 'open',
  creator_name: 'Unknown Creator',
  has_assignment: false,
  type: 'task',
  id: null
}, onClose, onUndertake, isReviewTask, onResubmit, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [taskDetails, setTaskDetails] = useState(null);
  const [error, setError] = useState(null);
  const [canUndertake, setCanUndertake] = useState(null);
  const [capabilityLoading, setCapabilityLoading] = useState(false);

  useEffect(() => {
    if (isOpen && task?.id) {
      
      
      // For review tasks, default to submissions tab since that's what reviewers need to see
      if (task.type === 'review') {
        console.log('Setting active tab to submissions for review task');
        setActiveTab('submissions');
      } else {
        setActiveTab('overview');
      }
      
      // Load detailed task information
      fetchAndSetTaskDetails();
      
      // Only check capability if this is not an already undertaken task
      // Check if the task has assignment information indicating it's already undertaken
      const isAlreadyUndertaken = task.has_assignment || task.assignment_id || task.status === 'in_progress' || task.status === 'submitted';
      console.log('DEBUG: Is task already undertaken?', isAlreadyUndertaken);
      
      if (!isAlreadyUndertaken) {
        checkTaskCapability();
      } else {
        console.log('DEBUG: Skipping capability check for already undertaken task');
        setCanUndertake(null); // Clear any previous capability data
      }
      
      console.log('=== END TASK DETAIL MODAL DEBUG ===');
    }
  }, [isOpen, task?.id]);

  const fetchAndSetTaskDetails = async () => {
    if (!task?.id) return;
    
    try {
      let response;
      if (task.type === 'review') {
        response = await fetchReviewTaskDetails(task.id);
      } else {
        response = await fetchTaskDetails(task.id);
      }
      
      const taskData = response.data || response;
      
      // Add current user ID to task details for duration component
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
      // Use 'review' assignment type for review tasks, 'task' for regular tasks
      const assignmentType = task.type === 'review' ? 'review' : 'task';
      
      const response = await canUndertakeTask(task.id, assignmentType);
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
        return 'This task is available for contributors to undertake.';
      case 'in_progress':
        return 'One or more contributors are currently working on this task.';
      case 'submitted':
        return 'Work has been submitted and is awaiting review from reviewers.';
      case 'completed':
        return 'This task has been successfully completed and approved.';
      case 'rejected':
        return 'The submitted work was rejected by majority of reviewers. Task is now open for other contributors. Task will be available for you after a grace period based on task status.';
      case 'resubmitted':
        return 'Work has been resubmitted and is awaiting review.';
      case 'needs_review':
        return 'The work is borderline and needs additional review.';
      default:
        return 'Status information not available.';
    }
  };

  const renderCapabilityIndicator = () => {
    // Check if this is an already undertaken task
    const isAlreadyUndertaken = task.has_assignment || task.assignment_id || task.status === 'in_progress' || task.status === 'submitted';
    
    // Don't show capability indicator for already undertaken tasks
    if (isAlreadyUndertaken) {
      return null;
    }
    
    if (capabilityLoading) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          <span className="text-sm">Checking availability...</span>
        </div>
      );
    }

    if (!canUndertake) return null;

    if (canUndertake.can_undertake) {
      const actionText = task.type === 'review' ? 'review' : 'undertake';
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">You can {actionText} this task</span>
        </div>
      );
    } else {
      // Check if user is blocked due to previous rejection
      if (canUndertake.block_details) {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">You are blocked from this task</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Block Details</span>
              </div>
              <p className="text-xs text-red-600 mb-2">{canUndertake.block_details.reason}</p>
              <div className="flex items-center justify-between text-xs text-red-600">
                <span>Days remaining: {canUndertake.block_details.days_remaining}</span>
                <span>Blocked until: {new Date(canUndertake.block_details.blocked_until).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{canUndertake.reason}</span>
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
            <p className="text-xs text-gray-500">Deadline</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(task.deadline)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Category</p>
            <p className="text-sm font-medium text-gray-900 capitalize">{task.category}</p>
          </div>
        </div>
      </div>

      {/* Task Configuration */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-3">Task Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-blue-600">Number of Reviewers</p>
            <p className="text-sm font-medium text-blue-900">
              {taskDetails?.num_reviewers || task.num_reviewers || 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Max Parallel Contributors</p>
            <p className="text-sm font-medium text-blue-900">
              {taskDetails?.max_parallel_contributors || task.max_parallel_contributors || 'Unlimited'}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-600">Time Limit (Hours)</p>
            <p className="text-sm font-medium text-blue-900">
              {taskDetails?.task_duration || task.task_duration || 'No limit'}
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

      {/* Review Status - Show for contributors and task creators only for submitted tasks */}
      {taskDetails?.review_status && (task.status === 'submitted' || task.status === 'under_review' || task.status === 'completed') && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-purple-700 mb-3">Review Status</h4>
          {taskDetails.review_status.all_submissions ? (
            // Task creator view - show all submissions
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Total Submissions:</span>
                <span className="text-sm font-medium text-purple-900">{taskDetails.review_status.total_submissions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">With Review Tasks:</span>
                <span className="text-sm font-medium text-purple-900">{taskDetails.review_status.submissions_with_reviews}</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-purple-600 font-medium">Individual Submissions:</p>
                {taskDetails.review_status.all_submissions.map((submission, index) => (
                  <div key={submission.assignment_id} className="bg-white p-3 rounded border border-purple-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-purple-900">{submission.contributor_name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${submission.review_tasks_created ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {submission.review_tasks_created ? 'Review Tasks Created' : 'Pending Review Tasks'}
                      </span>
                    </div>
                    <div className="text-xs text-purple-600">
                      {submission.review_progress} • {submission.review_tasks_count} review tasks
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Contributor view - show individual status
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Review Tasks Created:</span>
                <span className={`text-sm font-medium ${taskDetails.review_status.review_tasks_created ? 'text-green-600' : 'text-yellow-600'}`}>
                  {taskDetails.review_status.review_tasks_created ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Reviews Received:</span>
                <span className="text-sm font-medium text-purple-900">
                  {taskDetails.review_status.review_submissions_received} / {taskDetails.review_status.expected_reviewers}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Compensation */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-green-700 mb-3">Compensation Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-3 rounded border border-green-200">
            <h5 className="text-sm font-medium text-green-800 mb-2">Task Compensation</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-green-600">Type:</span>
                <span className="text-sm font-medium text-green-900 capitalize">
                  {taskDetails?.compensation?.task?.compensation_type || task.compensation?.task?.compensation_type || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-green-600">Amount:</span>
                <span className="text-sm font-medium text-green-900">
                  {formatCompensation(taskDetails?.compensation?.task || task.compensation?.task)}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-green-200">
            <h5 className="text-sm font-medium text-green-800 mb-2">Review Compensation</h5>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-green-600">Type:</span>
                <span className="text-sm font-medium text-green-900 capitalize">
                  {taskDetails?.compensation?.review?.compensation_type || task.compensation?.review?.compensation_type || 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-green-600">Amount:</span>
                <span className="text-sm font-medium text-green-900">
                  {formatCompensation(taskDetails?.compensation?.review || task.compensation?.review)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {task.skills && task.skills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {task.skills.map((skill, index) => {
              const minLevel = task.skill_review_requirements?.[skill.name] || 0.0;
              return (
                <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">{skill.name}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {typeof minLevel === 'number' ? minLevel.toFixed(1) : minLevel}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You need to meet or exceed these minimum skill levels to undertake this task.
          </p>
        </div>
      )}

      {/* Status Description */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-blue-700 mb-2">Status Information</h4>
        <p className="text-sm text-blue-600">{getStatusDescription(task.status)}</p>
      </div>

      {/* Duration Information - Only show for tasks assigned to current user */}
      
    </div>
  );

  const renderSubmissionsTab = () => {
    
    if (!taskDetails?.assignments || taskDetails.assignments.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {task.type === 'review' ? 'No review details found' : 'No submissions found'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {task.type === 'review' ? 'Review Details' : 'Submissions'} ({taskDetails.assignments.filter(a => a.status !== 'in_progress').length})
          </h4>
        </div>
        
        {taskDetails.assignments
          .filter(assignment => assignment.status !== 'in_progress')
          .map((assignment, index) => (
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

                {assignment.notes && (
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
                      This work was rejected by majority of peer reviewers. The task is now open for other contributors.
                    </p>
                    <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-xs text-red-700">
                        <strong>Note:</strong> The original contributor is blocked from this task for 30 days due to the rejection.
                      </p>
                    </div>
                  </div>
                )}
                
                {assignment.status === 'needs_review' && (
                  <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 text-pink-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Needs Additional Review</span>
                    </div>
                    <p className="text-xs text-pink-600 mt-1">
                      This work received mixed reviews and needs additional evaluation.
                    </p>
                  </div>
                )}
              </div>
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
          <p className="mt-2 text-sm text-gray-500">No reviews found</p>
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
                  <div className="flex items-center">
                    {review.is_approved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`ml-1 text-sm font-medium ${
                      review.is_approved ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {review.is_approved ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Reviewed On</p>
                    <p className="font-medium">{formatDate(review.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Decision</p>
                    <div className="flex items-center">
                      {review.is_approved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`ml-1 text-sm font-medium ${
                        review.is_approved ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Always show Feedback cell, even if blank */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Feedback</p>
                  <div className={`p-3 rounded ${
                    review.is_approved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      review.is_approved ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {review.feedback && review.feedback.trim() !== '' ? review.feedback : 'No feedback from reviewer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{taskDetails?.assignments_count || 0}</div>
          <div className="text-xs text-blue-600">Total Assignments</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{taskDetails?.active_assignments || 0}</div>
          <div className="text-xs text-green-600">Active Contributors</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{taskDetails?.reviews_count || 0}</div>
          <div className="text-xs text-yellow-600">Reviews Received</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{taskDetails?.approval_rate || 0}%</div>
          <div className="text-xs text-purple-600">Approval Rate</div>
        </div>
      </div>

      {/* Review Progress */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-orange-700 mb-3">Review Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.reviews_count || 0} / {taskDetails?.num_reviewers || task.num_reviewers || '?'}
              </div>
              <div className="text-xs text-orange-600">Reviews Completed</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.num_reviewers || task.num_reviewers || 'Not set'}
              </div>
              <div className="text-xs text-orange-600">Required Reviews</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.reviews_count >= (taskDetails?.num_reviewers || task.num_reviewers || 0) ? 'Complete' : 'Pending'}
              </div>
              <div className="text-xs text-orange-600">Review Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Configuration Summary */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-indigo-700 mb-3">Task Configuration Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Max Contributors:</span>
              <span className="text-sm font-medium text-indigo-900">
                {taskDetails?.max_parallel_contributors || task.max_parallel_contributors || 'Unlimited'}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Time Limit:</span>
              <span className="text-sm font-medium text-indigo-900">
                {taskDetails?.task_duration || task.task_duration || 'No limit'} hours
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Task Compensation:</span>
              <span className="text-sm font-medium text-indigo-900">
                {formatCompensation(taskDetails?.compensation?.task || task.compensation?.task)}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Review Compensation:</span>
              <span className="text-sm font-medium text-indigo-900">
                {formatCompensation(taskDetails?.compensation?.review || task.compensation?.review)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Task Timeline</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Task Created</p>
              <p className="text-xs text-gray-500">{formatDate(task.created_at)}</p>
            </div>
          </div>
          
          {taskDetails?.assignments?.map((assignment, index) => (
            <div key={assignment.id} className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {assignment.contributor_name} started working
                </p>
                <p className="text-xs text-gray-500">{formatDate(assignment.created_at)}</p>
              </div>
            </div>
          ))}
          
          {taskDetails?.assignments?.filter(a => a.submitted_at).map((assignment, index) => (
            <div key={`submitted-${assignment.id}`} className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {assignment.contributor_name} submitted work
                </p>
                <p className="text-xs text-gray-500">{formatDate(assignment.submitted_at)}</p>
              </div>
            </div>
          ))}
          
          {taskDetails?.reviews?.map((review, index) => (
            <div key={review.id} className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {review.reviewer_name} {review.is_approved ? 'approved' : 'rejected'} the work
                </p>
                <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
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
                Task Details: {task.title}
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
              {taskDetails?.assignments?.length > 0 || taskDetails?.reviews?.length > 0 || task.type === 'review' ? (
                // Show all tabs for tasks with data or review tasks
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
                // Contributor view: only show overview tab
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
            {/* Submit Work Button for Active Tasks assigned to current user */}
            {onSubmit && task.status === 'in_progress' && task.type === 'task' && task.has_assignment && (
              <button
                onClick={() => onSubmit(task)}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                Submit Work
              </button>
            )}
            
            {/* Submit Review Button for Active Review Tasks assigned to current user */}
            {onSubmit && task.status === 'in_progress' && task.type === 'review' && task.has_assignment && (
              <button
                onClick={() => onSubmit(task)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Submit Review
              </button>
            )}
            
            {/* Undertake Task Button */}
            {onUndertake && 
              canUndertake?.can_undertake && 
              ((task.status === 'open' || task.status === 'available' || !task.status) || 
              (task.type === 'review' && task.status === 'submitted'))
            && (
              <button
                onClick={() => onUndertake(task)}
                className={`px-4 py-2 text-white rounded-md text-sm font-medium hover:bg-opacity-90 ${
                  task.type === 'review' 
                    ? 'bg-yellow-600 hover:bg-yellow-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {task.type === 'review' ? 'Review Task' : 'Undertake Task'}
              </button>
            )}
            
            {/* Cannot Undertake Button */}
            {onUndertake && 
              canUndertake && 
              !canUndertake.can_undertake && 
              (task.status === 'open' || task.status === 'available' || !task.status)
            && (
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium cursor-not-allowed"
                title={canUndertake.reason}
              >
                Cannot Undertake
              </button>
            )}
            
            {/* Resubmit Button */}
            {onResubmit && task.status === 'rejected' && (
              <button
                onClick={() => onResubmit(task)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
              >
                Reset for Resubmission
              </button>
            )}
            
            {/* Close Button */}
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

export default TaskDetailModal;