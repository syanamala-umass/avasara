import React, { useState } from 'react';
import { X, Star, CheckCircle, XCircle } from 'lucide-react';

const TaskActionModal = ({ isOpen, task, onClose, onSubmit, mode }) => {
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mode === 'submit') {
        // Create FormData for notes only (files are not supported in the new API)
        const formData = new FormData();
        formData.append('notes', notes);
        
        await onSubmit(task.task_id, formData);
        onClose();
      } else if (mode === 'review') {
        // For review submissions
        await onSubmit(task.task_id, {
          rating,
          feedback
        });
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setLoading(true);
    setError('');

    try {
      await onSubmit(task.task_id, {
        rating: 5, // Default high rating for acceptance
        feedback: 'Task accepted and completed successfully.',
        status: 'accepted'
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!rejectFeedback.trim()) {
      setError('Please provide feedback for rejection.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(task.task_id, {
        rating: 1, // Low rating for rejection
        feedback: rejectFeedback,
        status: 'rejected'
      });
      setShowRejectModal(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject task. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  // Reject Feedback Modal
  if (showRejectModal) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setShowRejectModal(false)}
        ></div>
        
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Provide Rejection Feedback
            </h2>
            <button 
              onClick={() => setShowRejectModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
            <p className="text-sm">
              <strong>Your feedback will help the contributor improve their work.</strong>
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Detailed Feedback *
            </label>
            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="6"
              placeholder="Please provide specific feedback on what needs to be improved..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRejectSubmit}
              disabled={loading || !rejectFeedback.trim()}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || !rejectFeedback.trim() ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
            >
              {loading ? 'Submitting...' : 'Submit Rejection'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'submit' ? 'Submit Task' : 'Review Task'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {mode === 'submit' ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Submission Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Add any additional notes or comments about your submission..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {loading ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </form>
        ) : (
          // Review mode - show accept/reject buttons
          <div>
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Review Decision
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please review the submitted work and choose to accept or reject it.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center`}
              >
                <XCircle className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Reject'}
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={loading}
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {loading ? 'Processing...' : 'Accept'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskActionModal; 