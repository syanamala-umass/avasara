import React, { useState } from 'react';
import TaskList from '../tasks/TaskList';
import ApplicationsList from '../applications/ApplicationsList';
import StatsCard from '../common/StatsCard';
import Tabs from '../common/Tabs';

const ContributorDashboard = ({ userData }) => {
  const [activeTab, setActiveTab] = useState('availableTasks');
  
  const tabs = [
    { id: 'availableTasks', label: 'Available Tasks' },
    { id: 'myApplications', label: 'My Applications' },
    { id: 'activeTasks', label: 'Active Tasks' },
    { id: 'completedTasks', label: 'Completed Tasks' },
  ];
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {userData.name}</h1>
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatsCard 
          title="Tasks Completed" 
          value={userData.stats.tasksCompleted} 
          icon="check-circle"
          color="green"
        />
        <StatsCard 
          title="Active Tasks" 
          value={userData.stats.activeTasks} 
          icon="clock"
          color="blue"
        />
        <StatsCard 
          title="Pending Applications" 
          value={userData.stats.pendingApplications} 
          icon="file-text"
          color="yellow"
        />
        <StatsCard 
          title="Earnings" 
          value={`$${userData.stats.earnings.toFixed(2)}`} 
          icon="dollar-sign"
          color="purple"
        />
      </div>
      
      {/* Main content tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      
      <div className="mt-6">
        {activeTab === 'availableTasks' && (
          <TaskList 
            tasks={userData.availableTasks} 
            emptyMessage="No available tasks match your skills at the moment."
          />
        )}
        
        {activeTab === 'myApplications' && (
          <ApplicationsList 
            applications={userData.applications}
            emptyMessage="You haven't applied to any tasks yet."
          />
        )}
        
        {activeTab === 'activeTasks' && (
          <TaskList 
            tasks={userData.activeTasks}
            showProgress
            emptyMessage="You don't have any active tasks at the moment."
          />
        )}
        
        {activeTab === 'completedTasks' && (
          <TaskList 
            tasks={userData.completedTasks}
            showRatings
            emptyMessage="You haven't completed any tasks yet."
          />
        )}
      </div>
    </div>
  );
};

export default ContributorDashboard;
