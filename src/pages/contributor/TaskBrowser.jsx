import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const TaskBrowser = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: 'open',
    compensationType: '',
    minCompensation: '',
    skillId: '',
    search: ''
  });
  const [availableSkills, setAvailableSkills] = useState([]);

  // In a real app, you would fetch tasks from your API
  useEffect(() => {
    // Simulate API call for skills
    setAvailableSkills([
      { id: 1, name: 'React', category: 'development' },
      { id: 2, name: 'Node.js', category: 'development' },
      { id: 3, name: 'MongoDB', category: 'development' },
      { id: 4, name: 'Angular', category: 'development' },
      { id: 5, name: 'Vue.js', category: 'development' },
      { id: 6, name: 'UI/UX Design', category: 'design' },
      { id: 7, name: 'Graphic Design', category: 'design' },
      { id: 8, name: 'Content Writing', category: 'marketing' },
      { id: 9, name: 'SEO', category: 'marketing' },
      { id: 10, name: 'Legal Documentation', category: 'legal' }
    ]);

    // Simulate API call with mock data
    setTimeout(() => {
      const mockTasks = [
        {
          id: 1,
          title: 'Frontend Development',
          description: 'Build a responsive dashboard using React and Tailwind CSS.',
          status: 'open',
          deadline: '2023-08-30T00:00:00Z',
          compensation_type: 'cash',
          cash_amount: 2000,
          created_at: '2023-07-15T10:30:00Z',
          startup: {
            id: 101,
            name: 'TechStart',
            logoUrl: null
          },
          skills: [
            { id: 1, name: 'React', category: 'development' },
            { id: 5, name: 'Vue.js', category: 'development' }
          ]
        },
        {
          id: 2,
          title: 'API Integration',
          description: 'Integrate our application with third-party payment APIs.',
          status: 'open',
          deadline: '2023-09-15T00:00:00Z',
          compensation_type: 'mixed',
          cash_amount: 1000,
          equity_percentage: 0.5,
          created_at: '2023-07-10T14:20:00Z',
          startup: {
            id: 102,
            name: 'PayFlow',
            logoUrl: null
          },
          skills: [
            { id: 2, name: 'Node.js', category: 'development' }
          ]
        },
        {
          id: 3,
          title: 'UX Research',
          description: 'Conduct user interviews and create user personas.',
          status: 'open',
          deadline: '2023-07-30T00:00:00Z',
          compensation_type: 'equity',
          equity_percentage: 1,
          created_at: '2023-07-05T09:45:00Z',
          startup: {
            id: 103,
            name: 'DesignLabs',
            logoUrl: null
          },
          skills: [
            { id: 6, name: 'UI/UX Design', category: 'design' }
          ]
        },
        {
          id: 4,
          title: 'Database Optimization',
          description: 'Optimize database queries and improve performance.',
          status: 'open',
          deadline: '2023-08-20T00:00:00Z',
          compensation_type: 'cash',
          cash_amount: 1500,
          created_at: '2023-07-08T11:15:00Z',
          startup: {
            id: 104,
            name: 'DataSys',
            logoUrl: null
          },
          skills: [
            { id: 3, name: 'MongoDB', category: 'development' }
          ]
        }
      ];
      
      setTasks(mockTasks);
      setLoading(false);
    }, 1000);
  }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Filter tasks based on criteria
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status && task.status !== filters.status) {
      return false;
    }
    
    // Compensation type filter
    if (filters.compensationType && task.compensation_type !== filters.compensationType) {
      return false;
    }
    
    // Minimum compensation filter
    if (filters.minCompensation) {
      const minValue = parseFloat(filters.minCompensation);
      if (task.compensation_type === 'cash' || task.compensation_type === 'mixed') {
        if (task.cash_amount < minValue) {
          return false;
        }
      }
    }
    
    // Skill filter
    if (filters.skillId) {
      const skillId = parseInt(filters.skillId);
      if (!task.skills.some(skill => skill.id === skillId)) {
        return false;
      }
    }
    
    // Search by title or description
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    return true;
  });

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
            Find Tasks
          </h2>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-1">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="open">Open</option>
              <option value="">All Statuses</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="compensationType" className="block text-sm font-medium text-gray-700">
              Payment Type
            </label>
            <select
              id="compensationType"
              name="compensationType"
              value={filters.compensationType}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Types</option>
              <option value="cash">Cash Only</option>
              <option value="equity">Equity Only</option>
              <option value="mixed">Cash & Equity</option>
            </select>
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="minCompensation" className="block text-sm font-medium text-gray-700">
              Min Amount ($)
            </label>
            <input
              type="number"
              id="minCompensation"
              name="minCompensation"
              value={filters.minCompensation}
              onChange={handleFilterChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          
          <div className="sm:col-span-1">
            <label htmlFor="skillId" className="block text-sm font-medium text-gray-700">
              Skill
            </label>
            <select
              id="skillId"
              name="skillId"
              value={filters.skillId}
              onChange={handleFilterChange}
              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Skills</option>
              {availableSkills.map(skill => (
                <option key={skill.id} value={skill.id}>
                  {skill.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="sm:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        {error && (
          <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 bg-white shadow sm:rounded-lg">
            <p className="text-gray-500">No tasks found matching your criteria.</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <li key={task.id}>
                  <Link to={`/tasks/${task.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {task.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {task.status}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            {task.startup.name}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <p>
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
                      <div className="mt-2 flex flex-wrap gap-1">
                        {task.skills.map(skill => (
                          <span key={skill.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskBrowser;