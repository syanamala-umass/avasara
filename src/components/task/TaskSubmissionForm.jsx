import React, { useState } from 'react';

const TaskSubmissionForm = ({ taskId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    submission_notes: '',
    submission_url: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.submission_notes) {
      return alert('Please provide submission notes.');
    }
    
    try {
      setSubmitting(true);
      
      // Call parent's onSubmit with form data
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting task:', err);
      alert('Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="submission_notes" className="block text-sm font-medium text-gray-700 mb-1">
          Submission Notes
        </label>
        <textarea
          id="submission_notes"
          name="submission_notes"
          value={formData.submission_notes}
          onChange={handleChange}
          required
          rows="4"
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Describe what you've done and any other relevant information"
        ></textarea>
      </div>
      
      <div>
        <label htmlFor="submission_url" className="block text-sm font-medium text-gray-700 mb-1">
          Submission URL (optional)
        </label>
        <input
          type="url"
          id="submission_url"
          name="submission_url"
          value={formData.submission_url}
          onChange={handleChange}
          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Link to GitHub repo, Google Drive, etc."
        />
        <p className="mt-1 text-xs text-gray-500">
          If your work is available online, please provide a link.
        </p>
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
          {submitting ? 'Submitting...' : 'Submit Task'}
        </button>
      </div>
    </form>
  );
};

export default TaskSubmissionForm;