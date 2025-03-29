import React, { useState } from 'react';

const ReviewForm = ({ taskId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    status: 'accepted',
    rating: 4,
    review_comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rating' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.review_comment) {
      return alert('Please provide a review comment.');
    }
    
    try {
      setSubmitting(true);
      
      // Call parent's onSubmit with form data
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Review Decision
        </label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="status"
              value="accepted"
              checked={formData.status === 'accepted'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2">Accept Submission</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="status"
              value="rejected"
              checked={formData.status === 'rejected'}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-2">Reject Submission</span>
          </label>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rating
        </label>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label key={rating} className="inline-flex items-center">
              <input
                type="radio"
                name="rating"
                value={rating}
                checked={formData.rating === rating}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-1">{rating}</span>
            </label>
          ))}
        </div>
      </div>
      
      <div>
        <label htmlFor="review_comment" className="block text-sm font-medium text-gray-700 mb-1">
          Review Comments
        </label>
        <textarea
          id="review_comment"
          name="review_comment"
          value={formData.review_comment}
          onChange={handleChange}
          required
          rows="4"
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Provide feedback on the submitted work"
        ></textarea>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
};

export default ReviewForm;