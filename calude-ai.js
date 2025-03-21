// App.js - Main component structure
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import StartupDashboard from './pages/startup/Dashboard';
import ContributorDashboard from './pages/contributor/Dashboard';
import TaskDetail from './pages/tasks/TaskDetail';
import ProfilePage from './pages/profile/ProfilePage';
import AuthPage from './pages/auth/AuthPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/:type" element={<AuthPage />} />
            <Route path="/startup/dashboard" element={<StartupDashboard />} />
            <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

// components/tasks/TaskCard.js - Individual task display
import React from 'react';
import { Link } from 'react-router-dom';
import SkillTag from '../common/SkillTag';

const TaskCard = ({ task }) => {
  const { id, title, description, skills, compensation, deadline, startup } = task;
  
  return (
    <div className="border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className={`px-2 py-1 text-xs rounded ${
          compensation.type === 'cash' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
        }`}>
          {compensation.type === 'cash' 
            ? `$${compensation.amount}` 
            : `${compensation.amount}% equity`}
        </span>
      </div>
      
      <p className="text-gray-600 mb-3 line-clamp-2">{description}</p>
      
      <div className="flex flex-wrap gap-1 mb-3">
        {skills.map(skill => (
          <SkillTag key={skill} name={skill} />
        ))}
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <img 
            src={startup.logo || "/default-logo.png"} 
            alt={startup.name} 
            className="w-6 h-6 rounded-full mr-2"
          />
          <span className="text-sm font-medium">{startup.name}</span>
        </div>
        <div className="text-sm text-gray-500">
          Due: {new Date(deadline).toLocaleDateString()}
        </div>
      </div>
      
      <Link 
        to={`/task/${id}`}
        className="mt-3 block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        View Details
      </Link>
    </div>
  );
};

export default TaskCard;

// components/tasks/TaskCreationForm.js - For startups to create tasks
import React, { useState } from 'react';
import SkillSelector from '../common/SkillSelector';
import ResourceSelector from '../common/ResourceSelector';

const TaskCreationForm = ({ onSubmit }) => {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    skills: [],
    compensationType: 'cash',
    compensationAmount: '',
    resources: [],
    deadline: '',
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTaskData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSkillsChange = (selectedSkills) => {
    setTaskData(prev => ({ ...prev, skills: selectedSkills }));
  };
  
  const handleResourcesChange = (selectedResources) => {
    setTaskData(prev => ({ ...prev, resources: selectedResources }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(taskData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Task Title</label>
        <input
          type="text"
          name="title"
          value={taskData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          value={taskData.description}
          onChange={handleChange}
          rows={4}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Required Skills</label>
        <SkillSelector
          selectedSkills={taskData.skills}
          onChange={handleSkillsChange}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Compensation Type</label>
          <select
            name="compensationType"
            value={taskData.compensationType}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="equity">Equity</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">
            {taskData.compensationType === 'cash' ? 'Amount ($)' : 'Equity (%)'}
          </label>
          <input
            type="number"
            name="compensationAmount"
            value={taskData.compensationAmount}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Required Resources</label>
        <ResourceSelector
          selectedResources={taskData.resources}
          onChange={handleResourcesChange}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Deadline</label>
        <input
          type="date"
          name="deadline"
          value={taskData.deadline}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Create Task
      </button>
    </form>
  );
};

export default TaskCreationForm;

// components/profile/ContributorProfile.js - Profile display for contributors
import React from 'react';
import SkillTag from '../common/SkillTag';
import CompletedTasksList from '../tasks/CompletedTasksList';

const ContributorProfile = ({ profile, isOwnProfile }) => {
  const { 
    name, 
    avatar, 
    bio, 
    skills, 
    completedTasks, 
    averageRating, 
    reviews 
  } = profile;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header section with cover photo */}
        <div className="h-40 bg-gradient-to-r from-blue-500 to-purple-600"></div>
        
        {/* Profile info section */}
        <div className="px-6 py-4 relative">
          <div className="flex flex-col md:flex-row">
            {/* Avatar */}
            <div className="absolute -top-16 left-6 md:relative md:top-0 md:left-0">
              <img 
                src={avatar || "/default-avatar.png"} 
                alt={name} 
                className="w-32 h-32 rounded-full border-4 border-white shadow-md"
              />
            </div>
            
            {/* Info */}
            <div className="mt-16 md:mt-0 md:ml-6 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{name}</h1>
                  <div className="flex items-center mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg 
                          key={star}
                          className={`w-5 h-5 ${star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-sm text-gray-600">({reviews.length} reviews)</span>
                    </div>
                  </div>
                </div>
                
                {isOwnProfile && (
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                    Edit Profile
                  </button>
                )}
              </div>
              
              <p className="mt-4 text-gray-600">{bio}</p>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Skills</h3>
                <div className="flex flex-wrap gap-1">
                  {skills.map(skill => (
                    <SkillTag key={skill} name={skill} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Completed tasks section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Completed Tasks</h2>
        <CompletedTasksList tasks={completedTasks} />
      </div>
      
      {/* Reviews section */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center">
                  <img 
                    src={review.startup.logo || "/default-logo.png"} 
                    alt={review.startup.name} 
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <div className="font-medium">{review.startup.name}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg 
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 text-xs text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet.</p>
        )}
      </div>
    </div>
  );
};

export default ContributorProfile;

// components/dashboard/ContributorDashboard.js - Main dashboard for contributors
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

// components/dashboard/StartupDashboard.js - Main dashboard for startups
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
