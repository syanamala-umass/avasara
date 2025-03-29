import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import SkillBadge from './SkillBadge';

const TaskCard = ({ task }) => {
  // Generate a color from startup name (for consistent avatar colors)
  const getInitialColor = (name) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
      'bg-red-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getStatusStyles = (status) => {
    switch(status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCompensationIcon = (type) => {
    if (type === 'cash') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type === 'equity') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden bg-white">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-bold mb-2 text-gray-900">
            <Link to={`/tasks/${task.id}`} className="hover:text-blue-600 transition-colors">
              {task.title}
            </Link>
          </h3>
          <div className="flex items-center">
            <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusStyles(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
        </div>
        
        <p className="mt-2 text-sm text-gray-600 line-clamp-2 h-10 mb-3">
          {task.description}
        </p>
        
        <div className="flex flex-wrap gap-1.5 mb-4">
          {task.skills.map(skill => (
            <SkillBadge key={skill.id} skill={skill} />
          ))}
        </div>
        
        <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
          <div className="flex items-center">
            {task.startup.logoUrl ? (
              <img 
                src={task.startup.logoUrl} 
                alt={task.startup.name}
                className="w-7 h-7 rounded-full mr-2 object-cover border border-gray-200"
              />
            ) : (
              <div className={`w-7 h-7 rounded-full mr-2 flex items-center justify-center text-white ${getInitialColor(task.startup.name)}`}>
                {task.startup.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-medium text-gray-700 hover:text-blue-600 transition-colors">
              {task.startup.name}
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-gray-700">
              {getCompensationIcon(task.compensation_type)}
              <span>
                {task.compensation_type === 'cash' ? (
                  <span className="font-medium">${task.cash_amount}</span>
                ) : task.compensation_type === 'equity' ? (
                  <span className="font-medium">{task.equity_percentage}%</span>
                ) : (
                  <span className="font-medium">${task.cash_amount} + {task.equity_percentage}%</span>
                )}
              </span>
            </div>
            
            <div className="flex items-center text-gray-500 text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;