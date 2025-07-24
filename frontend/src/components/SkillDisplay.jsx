import React from 'react';
import { Star, CheckCircle } from 'lucide-react';

const SkillDisplay = ({ skills = [], showRatings = true, showTaskCount = true, compact = false }) => {
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600 bg-green-100 border-green-200';
    if (rating >= 4.0) return 'text-blue-600 bg-blue-100 border-blue-200';
    if (rating >= 3.5) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    if (rating >= 3.0) return 'text-orange-600 bg-orange-100 border-orange-200';
    return 'text-red-600 bg-red-100 border-red-200';
  };

  const getRatingLabel = (rating) => {
    if (rating >= 4.5) return 'Expert';
    if (rating >= 4.0) return 'Advanced';
    if (rating >= 3.5) return 'Intermediate';
    if (rating >= 3.0) return 'Beginner';
    return 'Novice';
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <div
            key={skill.id}
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(skill.rating)}`}
          >
            <span className="flex items-center space-x-1">
              <span>{skill.name}</span>
              {showRatings && (
                <>
                  <Star className="h-3 w-3 fill-current" />
                  <span className="text-xs">{skill.rating.toFixed(1)}</span>
                </>
              )}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {skills.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No skills listed</p>
        </div>
      ) : (
        skills.map(skill => (
          <div
            key={skill.id}
            className={`flex items-center justify-between p-3 rounded-lg border ${getRatingColor(skill.rating)}`}
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900">{skill.name}</span>
                {/* Removed skill rating label */}
              </div>
              {showRatings && (
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{skill.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {showTaskCount && (
              <div className="text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>{skill.num_tasks || 0} tasks</span>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default SkillDisplay; 