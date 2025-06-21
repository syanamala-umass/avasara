import React, { useState } from 'react';
import { createTaskAssignment, updateTaskAssignment, completeTask, pickUpReview } from '../api';

const TaskAssignment = ({ task, onAssignmentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');

  const handleAssignTask = async () => {
    try {
      setLoading(true);
      setError(null);
      await createTaskAssignment({
        task_id: task.id,
        notes: notes
      });
      onAssignmentComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    try {
      setLoading(true);
      setError(null);
      await completeTask(task.id, { notes });
      onAssignmentComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const handlePickUpReview = async () => {
    try {
      setLoading(true);
      setError(null);
      await pickUpReview(task.id, { notes });
      onAssignmentComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to pick up review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{task.title}</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex space-x-4">
        {task.status === 'open' && (
          <button
            onClick={handleAssignTask}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {loading ? 'Assigning...' : 'Assign Task'}
          </button>
        )}

        {task.status === 'in_progress' && (
          <button
            onClick={handleCompleteTask}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? 'Completing...' : 'Complete Task'}
          </button>
        )}

        {task.status === 'completed' && !task.reviewer_id && (
          <button
            onClick={handlePickUpReview}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            {loading ? 'Picking up...' : 'Pick Up Review'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskAssignment; 