import React from 'react';

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
  category: 'task'
}, onClose, onUndertake, isReviewTask }) => {
  if (!isOpen || !task) {
    return null;
  }

  const formatCompensation = (type, amount) => {
    if (!type) return 'No compensation specified';
    if (type === 'cash') {
      return `$${amount}`;
    } else if (type === 'equity') {
      return `${amount}% equity`;
    }
    return 'No compensation specified';
  };

  const getCompensationDisplay = () => {
    if (task.status === 'submitted_for_review') {
      return {
        label: 'Review Compensation',
        type: task.review_compensation_type || 'cash',
        amount: task.review_compensation_amount || 0
      };
    } else {
      return {
        label: 'Task Compensation',
        type: task.compensation_type || 'cash',
        amount: task.compensation_amount || 0
      };
    }
  };

  const compensation = getCompensationDisplay();

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {isReviewTask ? 'Review Task Details' : 'Task Details'}
                </h3>
                <div className="mt-4">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Title</h4>
                    <p className="mt-1 text-sm text-gray-900">{task.title || 'Untitled Task'}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900">{task.description || 'No description provided'}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Skills Required</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {task.skills?.length > 0 ? (
                        task.skills.map(skill => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {skill.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No skills required</span>
                      )}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Compensation</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {compensation.label}: {formatCompensation(compensation.type, compensation.amount)}
                    </p>
                  </div>
                  {isReviewTask && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-500">Submitted By</h4>
                      <p className="mt-1 text-sm text-gray-900">{task.creator_name || 'Unknown Creator'}</p>
                    </div>
                  )}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500">Status</h4>
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      task.status === 'open' ? 'bg-green-100 text-green-800' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'submitted_for_review' ? 'bg-yellow-100 text-yellow-800' :
                      task.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {task.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {task.status !== 'completed' && !task.has_assignment && (
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onUndertake}
              >
                {task.status === 'submitted_for_review' ? 'Review Task' : 
                 task.category === 'review' ? 'Start Review' : 'Undertake Task'}
              </button>
            )}
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
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