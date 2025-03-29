import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TaskManage = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  // In a real app, you would fetch tasks from your API
  useEffect(() => {
    // Simulate API call with mock data
    setTimeout(() => {
      const mockTasks = [
        {
          id: 1,
          title: 'Frontend Development',
          description: 'Build a responsive dashboard using React and Tailwind CSS.',
          status: 'in_progress',
          applications: 4,
          deadline: '2023-08-30T00:00:00Z',
          compensation_type: 'cash',
          cash_amount: 2000,
          created_at: '2023-07-15T10:30:00Z',
          contributor: {
            id: 101,
            name: 'John Developer'
          }
        },
        {
          id: 2,
          title: 'API Integration',
          description: 'Integrate our application with third-party payment APIs.',
          status: 'open',
          applications: 2,
          deadline: '2023-09-15T00:00:00Z',
          compensation_type: 'mixed',
          cash_amount: 1000,
          equity_percentage: 0.5,
          created_at: '2023-07-10T14:20:00Z'
        },
        {
          id: 3,
          title: 'UX Research',
          description: 'Conduct user interviews and create user personas.',
          status: 'completed',
          applications: 3,
          deadline: '2023-07-30T00:00:00Z',
          compensation_type: 'equity',
          equity_percentage: 1,
          created_at: '2023-07-05T09:45:00Z',
          contributor: {
            id: 102,
            name: 'Sarah Designer'
          }
        },
        {
          id: 4,
          title: 'Database Optimization',
          description: 'Optimize database queries and improve performance.',
          status: 'under_review',
          applications: 2,
          deadline: '2023-08-20T00:00:00Z',
          compensation_type: 'cash',
          cash_amount: 1500,
          created_at: '2023-07-08T11:15:00Z',
          contributor: {
            id: 103,
            name: 'Mike Engineer'
          }
        }
      ];
      
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);
  
  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['open', 'in_progress', 'under_review'].includes(task.status);
    if (filter === 'completed') return task.status === 'completed';
    return task.status === filter;
  });

  // Get status display text and color
  const getStatusDisplay = (status) => {
    const statusMap = {
      open: { text: 'Open', className: 'bg-green-100 text-green-800' },
      in_progress: { text: 'In Progress', className: 'bg-blue-100 text-blue-800' },
      under_review: { text: 'Under Review', className: 'bg-yellow-100 text-yellow-800' },
      completed: { text: 'Completed', className: 'bg-purple-100 text-purple-800' },
      cancelled: { text: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };
    
    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Manage Tasks
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            to="/startup/tasks/create"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Post New Task
          </Link>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'all' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'active' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'open' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Open
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'in_progress' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === 'completed' 
                ? 'bg-gray-800 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Completed
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tasks found matching the selected filter.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => {
                const statusDisplay = getStatusDisplay(task.status);
                return (
                  <li key={task.id}>
                    <Link to={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600 truncate">
                            {task.title}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusDisplay.className}`}>
                              {statusDisplay.text}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              {task.status === 'open' ? (
                                <>{task.applications} applications</>
                              ) : task.contributor ? (
                                <>Assigned to: {task.contributor.name}</>
                              ) : (
                                <>Not assigned</>
                              )}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Deadline: {new Date(task.deadline).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 truncate">
                            {task.compensation_type === 'cash' ? (
                              <>${task.cash_amount}</>
                            ) : task.compensation_type === 'equity' ? (
                              <>{task.equity_percentage}% equity</>
                            ) : (
                              <>${task.cash_amount} + {task.equity_percentage}% equity</>
                            )}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskManage;