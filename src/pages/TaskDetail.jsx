import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { fetchTaskById, applyForTask, submitTask, reviewTask } from '../services/api';
import SkillBadge from '../components/common/SkillBadge';
import ReviewForm from '../components/task/ReviewForm';
import TaskSubmissionForm from '../components/task/TaskSubmissionForm';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [applicationNote, setApplicationNote] = useState('');
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    const loadTask = async () => {
      try {
        const taskData = await fetchTaskById(id);
        setTask(taskData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load task details. Please try again later.');
        setLoading(false);
      }
    };
    
    loadTask();
  }, [id]);

  const handleApply = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/tasks/${id}` } });
      return;
    }
    
    if (currentUser.user_type !== 'contributor') {
      setError('Only contributors can apply for tasks.');
      return;
    }
    
    setApplying(true);
    
    try {
      await applyForTask(id, { cover_note: applicationNote });
      setTask({
        ...task,
        my_application: {
          status: 'pending',
          cover_note: applicationNote
        }
      });
      setApplying(false);
    } catch (err) {
      setError('Failed to submit application. Please try again.');
      setApplying(false);
    }
  };

  const handleSubmitTask = async (submissionData) => {
    try {
      await submitTask(id, submissionData);
      const updatedTask = await fetchTaskById(id);
      setTask(updatedTask);
      setShowSubmissionForm(false);
    } catch (err) {
      setError('Failed to submit task. Please try again.');
    }
  };

  const handleReviewSubmission = async (reviewData) => {
    try {
      await reviewTask(id, reviewData);
      const updatedTask = await fetchTaskById(id);
      setTask(updatedTask);
      setShowReviewForm(false);
    } catch (err) {
      setError('Failed to submit review. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="bg-red-100 text-red-700 p-4 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Task not found</h2>
          <p className="mt-2">The requested task does not exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isStartupAdmin = currentUser?.user_type === 'startup_admin';
  const isContributor = currentUser?.user_type === 'contributor';
  const isMyTask = isContributor && task.assignment?.contributor_id === currentUser.id;
  const canApply = isContributor && task.status === 'open' && !task.my_application;
  const canSubmit = isMyTask && task.assignment.status === 'in_progress';
  const canReview = isStartupAdmin && task.assignment?.status === 'submitted';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <span className={`px-3 py-1 text-sm rounded-full ${
            task.status === 'open' ? 'bg-green-100 text-green-800' :
            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            task.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
            task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="mt-2 flex items-center">
          <img 
            src={task.startup.logoUrl || '/default-logo.png'} 
            alt={task.startup.name}
            className="w-8 h-8 rounded-full mr-2"
          />
          <span className="font-medium">{task.startup.name}</span>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Description</h2>
        <div className="prose max-w-none">
          {task.description}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Required Skills</h2>
          <div className="flex flex-wrap gap-2">
            {task.skills.map(skill => (
              <SkillBadge key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Compensation</h2>
          <div>
            {task.compensation_type === 'cash' ? (
              <p className="text-xl font-bold">${task.cash_amount}</p>
            ) : task.compensation_type === 'equity' ? (
              <p className="text-xl font-bold">{task.equity_percentage}% equity</p>
            ) : (
              <>
                <p className="text-xl font-bold">${task.cash_amount}</p>
                <p className="text-xl font-bold">+</p>
                <p className="text-xl font-bold">{task.equity_percentage}% equity</p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Resources Required</h2>
          <ul className="list-disc pl-5">
            {task.resources_required.computingPower && (
              <li>Computing Power</li>
            )}
            {task.resources_required.storage && (
              <li>Storage</li>
            )}
            {task.resources_required.licenses && (
              <li>Software Licenses</li>
            )}
            {task.resources_required.other && (
              <li>{task.resources_required.other}</li>
            )}
            {!task.resources_required.computingPower && 
             !task.resources_required.storage && 
             !task.resources_required.licenses && 
             !task.resources_required.other && (
              <li>None specified</li>
            )}
          </ul>
        </div>
      </div>
      
      {/* Application/Submission/Review Section */}
      <div className="bg-white shadow rounded-lg p-6">
        {canApply && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Apply for this Task</h2>
            <textarea
              value={applicationNote}
              onChange={(e) => setApplicationNote(e.target.value)}
              placeholder="Explain why you're a good fit for this task..."
              className="w-full px-3 py-2 border rounded-md mb-4"
              rows="4"
            ></textarea>
            <button
              onClick={handleApply}
              disabled={applying}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {applying ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        )}
        
        {task.my_application && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Application</h2>
            <div className={`p-4 rounded-md ${
              task.my_application.status === 'pending' ? 'bg-yellow-50' :
              task.my_application.status === 'accepted' ? 'bg-green-50' :
              'bg-red-50'
            }`}>
              <p className="font-medium">
                Status: {task.my_application.status.charAt(0).toUpperCase() + task.my_application.status.slice(1)}
              </p>
              <p className="mt-2">{task.my_application.cover_note}</p>
            </div>
          </div>
        )}
        
        {canSubmit && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Submit Your Work</h2>
            {showSubmissionForm ? (
              <TaskSubmissionForm 
                taskId={task.id} 
                onSubmit={handleSubmitTask}
                onCancel={() => setShowSubmissionForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowSubmissionForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Completed Task
              </button>
            )}
          </div>
        )}
        
        {canReview && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Review Submission</h2>
            {showReviewForm ? (
              <ReviewForm 
                taskId={task.id} 
                onSubmit={handleReviewSubmission}
                onCancel={() => setShowReviewForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Review Submission
              </button>
            )}
          </div>
        )}
        
        {task.assignment && task.assignment.status === 'accepted' && (
          <div className="p-4 bg-green-50 rounded-md">
            <h2 className="text-lg font-semibold text-green-800 mb-2">Task Completed Successfully</h2>
            <p>This task has been reviewed and accepted by the startup.</p>
            {task.assignment.contributor_id === currentUser?.id && (
              <p className="mt-2 font-medium">
                Payment: {task.compensation_type.includes('cash') && `$${task.cash_amount}`} 
                {task.compensation_type.includes('cash') && task.compensation_type.includes('equity') && ' + '}
                {task.compensation_type.includes('equity') && `${task.equity_percentage}% equity`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetail;