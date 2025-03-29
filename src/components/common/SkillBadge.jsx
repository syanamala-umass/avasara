import React from 'react';

const SkillBadge = ({ skill }) => {
  // Enhanced color mapping for different skill categories
  const categoryColors = {
    development: 'bg-blue-100 text-blue-800 border-blue-200',
    design: 'bg-purple-100 text-purple-800 border-purple-200',
    marketing: 'bg-green-100 text-green-800 border-green-200',
    legal: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    finance: 'bg-red-100 text-red-800 border-red-200',
    operations: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };

  // Get color based on category or use a default
  const colorClass = categoryColors[skill.category] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass} shadow-sm`}
    >
      {skill.name}
    </span>
  );
};

export default SkillBadge;