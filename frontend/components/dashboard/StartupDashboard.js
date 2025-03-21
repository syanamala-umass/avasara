import React, { useState } from 'react';
import TaskList from '../tasks/TaskList';
import ApplicationsList from '../applications/ApplicationsList';
import StatsCard from '../common/StatsCard';
import Tabs from '../common/Tabs';
import { Link } from 'react-router-dom';

const StartupDashboard = ({ startupData }) => {
  const [activeTab, setActiveTab] = useState('activeTasks');
  
  const tabs = [
    { id: 'activeTasks', label: 'Active Tasks' },
    { id: 'applications', label: 'Applications' },
    { id: 'completedTasks', label: 'Completed Tasks' },
    { id: 'contributors', label: 'Contributors' },
  ];
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard: {startupData.name}</h1>
        <Link 
          to="/task/create" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create New Task
        </Link>
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Active Tasks" 
          value={startupData.stats.activeTasks} 
          icon="clipboard-list"
          color="blue"
        />
        <StatsCard 
          title="Open Applications" 
          value={startupData.stats.openApplications} 
          icon="users"
          color="yellow"
        />
        <StatsCard 
          title="Tasks Completed" 
          value={startupData.stats.tasksCompleted} 
          icon="check-circle"
          color="green"
        />
        <StatsCard 
          title="Total Contributors" 
          value={startupData.stats.totalContributors} 
          icon="user-group"
          color="purple"
        />
      </div>
      
      {/* Main content tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'activeTasks' && (
          <TaskList 
            tasks={startupData.activeTasks}
            showEditOption
            showApplicantsCount
            emptyMessage="You don't have any active tasks. Create a new task to get started!"
          />
        )}
        
        {activeTab === 'applications' && (
          <ApplicationsList 
            applications={startupData.applications}
            showAcceptReject
            emptyMessage="You don't have any pending applications."
          />
        )}
        
        {activeTab === 'completedTasks' && (
          <TaskList 
            tasks={startupData.completedTasks}
            showContributor
            emptyMessage="You don't have any completed tasks yet."
          />
        )}
        
        {activeTab === 'contributors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startupData.contributors.map(contributor => (
              <div key={contributor.id} className="border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <img 
                    src={contributor.avatar || "/default-avatar.png"} 
                    alt={contributor.name} 
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-medium">{contributor.name}</h3>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{contributor.tasksCompleted} tasks completed</span>
                      <span className="mx-2">•</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg 
                            key={star}
                            className={`w-4 h-4 ${star <= contributor.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {contributor.skills.slice(0, 3).map(skill => (
                    <span 
                      key={skill} 
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                  {contributor.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{contributor.skills.length - 3} more
                    </span>
                  )}
                </div>
                
                <Link 
                  to={`/profile/${contributor.id}`}
                  className="mt-3 block w-full text-center py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StartupDashboard;