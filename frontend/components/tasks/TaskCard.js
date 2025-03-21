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
