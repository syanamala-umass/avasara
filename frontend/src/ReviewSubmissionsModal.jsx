import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, User, FileText } from 'lucide-react';
import { fetchReviewSubmissions } from './api';

const ReviewSubmissionsModal = ({ isOpen, task, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadReviewSubmissions();
    }
  }, [isOpen, task]);

  const loadReviewSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchReviewSubmissions(task.id);
      setSubmissions(response.data?.submissions || []);
    } catch (err) {
      console.error('Error loading review submissions:', err);
      setError('Failed to load review submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
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
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  if (!isOpen || !task) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Submissions</h2>
            <p className="text-sm text-gray-500 mt-1">{task.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading review submissions...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No review submissions found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.assignment_id} className="bg-gray-50 rounded-lg p-6">
                  {/* Submission Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <User className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{submission.user_name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      Submitted: {formatDate(submission.submitted_at)}
                    </div>
                  </div>

                  {/* Submission Details */}
                  {submission.notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Notes:</h4>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                        {submission.notes}
                      </p>
                    </div>
                  )}

                  {/* Submission Files */}
                  {submission.submission_files && submission.submission_files.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted Files:</h4>
                      <div className="bg-white p-3 rounded border">
                        <ul className="text-sm text-gray-600">
                          {submission.submission_files.map((file, index) => (
                            <li key={index} className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Reviews */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Reviews ({submission.review_count})
                    </h4>
                    {submission.reviews.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No reviews yet</p>
                    ) : (
                      <div className="space-y-3">
                        {submission.reviews.map((review) => (
                          <div key={review.id} className="bg-white p-4 rounded border">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-900">{review.reviewer_name}</span>
                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                                  review.is_approved 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {review.is_approved ? 'Approved' : 'Rejected'}
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDate(review.created_at)}
                              </div>
                            </div>
                            {review.feedback && (
                              <div className="text-sm text-gray-600">
                                <strong>Feedback:</strong> {review.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewSubmissionsModal; 