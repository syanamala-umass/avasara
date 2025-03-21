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
