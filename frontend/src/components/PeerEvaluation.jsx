import React, { useState } from 'react';
import { createPeerEvaluation, updatePeerEvaluation } from '../api';

const PeerEvaluation = ({ task, onEvaluationComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState({
    quality_score: 5,
    communication_score: 5,
    timeliness_score: 5,
    feedback: ''
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const evaluationData = {
        task_id: task.id,
        ...evaluation
      };

      if (task.evaluation_id) {
        await updatePeerEvaluation(task.evaluation_id, evaluationData);
      } else {
        await createPeerEvaluation(evaluationData);
      }
      
      onEvaluationComplete();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (field, value) => {
    setEvaluation(prev => ({
      ...prev,
      [field]: Math.min(Math.max(1, value), 10)
    }));
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Peer Evaluation</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quality Score (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={evaluation.quality_score}
            onChange={(e) => handleScoreChange('quality_score', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Communication Score (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={evaluation.communication_score}
            onChange={(e) => handleScoreChange('communication_score', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Timeliness Score (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={evaluation.timeliness_score}
            onChange={(e) => handleScoreChange('timeliness_score', parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            rows={4}
            value={evaluation.feedback}
            onChange={(e) => setEvaluation(prev => ({ ...prev, feedback: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Provide detailed feedback about the task completion..."
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Submitting...' : 'Submit Evaluation'}
        </button>
      </div>
    </div>
  );
};

export default PeerEvaluation; 