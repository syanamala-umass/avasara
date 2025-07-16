import React, { useState, useEffect } from 'react';
import { X, Star, CheckCircle, XCircle, User, FileText, MessageSquare, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { fetchReviewTaskDetails } from './api';

const ReviewDetailModal = ({ 
  isOpen, 
  task = {
    title: 'Untitled Task',
    description: 'No description provided',
    skills: [],
    review_compensation_type: 'cash',
    review_compensation_amount: 0,
    status: 'submitted',
    creator_name: 'Unknown Creator',
    category: 'review',
    id: null
  }, 
  onClose, 
  onReview 
}) => {
  const [taskDetails, setTaskDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionsToReview, setSubmissionsToReview] = useState([]);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadTaskDetails();
    }
  }, [isOpen, task?.id]);

  const loadTaskDetails = async () => {
    if (!task?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching review task details for task ID:', task.id);
      
      const response = await fetchReviewTaskDetails(task.id);
      const taskData = response.data || response;
      
      console.log('Full task data received:', taskData);
      console.log('Assignments in task data:', taskData.assignments);
      
      setTaskDetails(taskData);
      
      // Filter submissions to only show those that need review
      const submissionsNeedingReview = (taskData.assignments || []).filter(
        assignment => assignment.status === 'submitted'
      );
      setSubmissionsToReview(submissionsNeedingReview);
      
      console.log('Submissions needing review:', submissionsNeedingReview);
      console.log('Total assignments found:', taskData.assignments?.length || 0);
      console.log('Submissions filtered for review:', submissionsNeedingReview.length);
      
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  const formatCompensation = (type, amount) => {
    if (!type || !amount) return 'No compensation specified';
    if (type === 'cash') {
      return `$${amount}`;
    } else if (type === 'equity') {
      return `${amount}% equity`;
    }
    return `${amount} ${type}`;
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

  const handleReviewSubmission = (submission) => {
    // This will be handled by the parent component
    if (onReview) {
      onReview(task, submission);
    }
  };

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-yellow-900">
                  Review Task: {task.title}
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Review submitted work and provide feedback
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-yellow-400 hover:text-yellow-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading task details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={loadTaskDetails}
                  className="mt-2 text-sm text-yellow-600 hover:text-yellow-800"
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Task Description */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Task Description</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{task.description}</p>
                  </div>
                </div>

                {/* Task Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 mb-3">Task Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-blue-600">Created By</p>
                      <p className="text-sm font-medium text-blue-900">{task.creator_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Created Date</p>
                      <p className="text-sm font-medium text-blue-900">{formatDate(task.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Deadline</p>
                      <p className="text-sm font-medium text-blue-900">{formatDate(task.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-600">Review Compensation</p>
                      <p className="text-sm font-medium text-blue-900">
                        {formatCompensation(task.review_compensation_type, task.review_compensation_amount)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Skills Required */}
                {task.skills && task.skills.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-700 mb-3">Required Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {task.skills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Assignments Overview */}
                {taskDetails?.assignments && taskDetails.assignments.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-indigo-700 mb-3">
                      Task Assignment Overview ({taskDetails.assignments.length} total)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-3 rounded border border-indigo-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600">
                            {taskDetails.assignments.filter(a => a.status === 'in_progress').length}
                          </div>
                          <div className="text-xs text-indigo-600">In Progress</div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-indigo-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600">
                            {taskDetails.assignments.filter(a => a.status === 'submitted').length}
                          </div>
                          <div className="text-xs text-indigo-600">Submitted for Review</div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded border border-indigo-200">
                        <div className="text-center">
                          <div className="text-lg font-bold text-indigo-600">
                            {taskDetails.assignments.filter(a => a.status === 'completed' || a.status === 'rejected').length}
                          </div>
                          <div className="text-xs text-indigo-600">Completed/Rejected</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submissions to Review */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-700 mb-3">
                    Submissions to Review ({submissionsToReview.length})
                  </h4>
                  
                  {submissionsToReview.length === 0 ? (
                    <div className="text-center py-4">
                      <FileText className="mx-auto h-8 w-8 text-yellow-400" />
                      <p className="mt-2 text-sm text-yellow-600">No submissions found for review</p>
                      <p className="mt-1 text-xs text-yellow-500">
                        This might mean the work hasn't been submitted yet or the data is still loading.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissionsToReview.map((submission, index) => (
                        <div key={submission.id} className="bg-white border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <User className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  {submission.contributor_name || 'Unknown Contributor'}
                                </span>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Submitted for Review
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                                <div>
                                  <p className="text-gray-500">Started</p>
                                  <p className="font-medium">{formatDate(submission.created_at)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Submitted</p>
                                  <p className="font-medium">{formatDate(submission.submitted_at)}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Assignment Type</p>
                                  <p className="font-medium capitalize">{submission.assignment_type || 'task'}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Status</p>
                                  <p className="font-medium capitalize">{submission.status?.replace('_', ' ')}</p>
                                </div>
                              </div>

                              {submission.notes && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1">Contributor Notes</p>
                                  <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-700">{submission.notes}</p>
                                  </div>
                                </div>
                              )}

                              {submission.submission_files && submission.submission_files.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-xs text-gray-500 mb-1">Submitted Files ({submission.submission_files.length})</p>
                                  <div className="flex flex-wrap gap-2">
                                    {submission.submission_files.map((file, fileIndex) => (
                                      <span key={fileIndex} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                        <FileText className="h-3 w-3 mr-1" />
                                        {file}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Additional submission details */}
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Submission Summary</p>
                                <div className="text-sm text-gray-700">
                                  <p>• Contributor: <span className="font-medium">{submission.contributor_name || 'Unknown'}</span></p>
                                  <p>• Work submitted on: <span className="font-medium">{formatDate(submission.submitted_at)}</span></p>
                                  {submission.submission_files && submission.submission_files.length > 0 && (
                                    <p>• Files submitted: <span className="font-medium">{submission.submission_files.length} file(s)</span></p>
                                  )}
                                  {submission.notes && (
                                    <p>• Notes provided: <span className="font-medium">Yes</span></p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              <button
                                onClick={() => handleReviewSubmission(submission)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700 transition-colors"
                              >
                                Review This Submission
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
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