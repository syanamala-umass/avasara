import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const StartupDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    activeTasks: 0,
    pendingApplications: 0,
    completedTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    // Simulate API calls with mock data
    setStats({
      activeTasks: 3,
      pendingApplications: 5,
      completedTasks: 8
    });

    setRecentTasks([
      {
        id: 1,
        title: 'Frontend Development',
        status: 'in_progress',
        applications: 4,
        created_at: '2023-07-15T10:30:00Z'
      },
      {
        id: 2,
        title: 'API Integration',
        status: 'open',
        applications: 2,
        created_at: '2023-07-10T14:20:00Z'
      },
      {
        id: 3,
        title: 'UX Research',
        status: 'completed',
        applications: 3,
        created_at: '2023-07-05T09:45:00Z'
      }
    ]);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Dashboard
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

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Tasks
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.activeTasks}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Pending Applications
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.pendingApplications}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Completed Tasks
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {stats.completedTasks}
            </dd>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Tasks</h3>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {recentTasks.map((task) => (
              <li key={task.id}>
                <Link to={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-blue-600 truncate">
                        {task.title}
                      </p>
                      <div className="ml-2 flex-shrink-0 flex">
                        <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${task.status === 'open' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'}`}>
                          {task.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          {task.applications} applications
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <p>
                          Posted on {new Date(task.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link
          to="/startup/tasks/manage"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View All Tasks
        </Link>
      </div>
    </div>
  );
};

export default StartupDashboard;