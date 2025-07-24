import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchSkillDetails,
  fetchTopTaskContributors,
  fetchTopRatedContributors,
  fetchTopJobPosters,
  fetchOpenJobsForSkill,
  fetchUserSkillRatingHistory,
} from '../api';
import { 
  ArrowLeft, Award, Edit3, Save, X, Plus, Star, 
  Briefcase, Globe, FileText, TrendingUp, 
  CheckCircle, Clock, DollarSign, Sparkles, Search, 
  Filter, Zap, Target, Users, Calendar, UserCircle,
  BarChart3, Activity, TrendingDown, TrendingUp as TrendingUpIcon, ClipboardList
} from 'lucide-react';

const SkillDetailPage = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [topTaskContributors, setTopTaskContributors] = useState([]);
  const [topRatedContributors, setTopRatedContributors] = useState([]);
  const [topJobPosters, setTopJobPosters] = useState([]);
  const [openJobs, setOpenJobs] = useState([]);
  const [userSkillHistory, setUserSkillHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [currentUserRating, setCurrentUserRating] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Get user data from localStorage
        const userDataFromStorage = JSON.parse(localStorage.getItem('userData'));
        if (userDataFromStorage) {
          setUserData(userDataFromStorage);
        }

        const skillRes = await fetchSkillDetails(skillId);
        setSkill(skillRes.data);

        // Fetch all data in parallel
        const [
          taskContributorsRes,
          ratedContributorsRes,
          jobPostersRes,
          openJobsRes,
          userHistoryRes
        ] = await Promise.allSettled([
          fetchTopTaskContributors(skillId),
          fetchTopRatedContributors(skillId),
          fetchTopJobPosters(skillId),
          fetchOpenJobsForSkill(skillId),
          userDataFromStorage ? fetchUserSkillRatingHistory(userDataFromStorage.id, skillId) : Promise.resolve({ data: [] })
        ]);

        setTopTaskContributors(taskContributorsRes.status === 'fulfilled' ? taskContributorsRes.value.data : []);
        setTopRatedContributors(ratedContributorsRes.status === 'fulfilled' ? ratedContributorsRes.value.data : []);
        setTopJobPosters(jobPostersRes.status === 'fulfilled' ? jobPostersRes.value.data : []);
        setOpenJobs(openJobsRes.status === 'fulfilled' ? openJobsRes.value.data : []);
        setUserSkillHistory(userHistoryRes.status === 'fulfilled' ? userHistoryRes.value.data : []);

        // Find current user's rating if they have one
        if (userDataFromStorage && userHistoryRes.status === 'fulfilled' && userHistoryRes.value.data.length > 0) {
          const latestRating = userHistoryRes.value.data[userHistoryRes.value.data.length - 1];
          setCurrentUserRating(latestRating.new_rating);
        }

      } catch (err) {
        console.error('Error loading skill details:', err);
        setSkill(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [skillId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (error) {
      return 'Recently';
    }
  };

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

  const getTrendIcon = (currentRating, previousRating) => {
    if (!previousRating) return <Activity className="h-4 w-4 text-gray-400" />;
    if (currentRating > previousRating) return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (currentRating < previousRating) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Activity className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading skill details...</p>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Skill not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">Back to Dashboard</span>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Avasara</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Skill Overview Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Skill Header */}
              <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {skill.name}
                </h1>
                <p className="text-gray-600 text-sm mb-3">
                  {skill.description || 'No description available'}
                </p>
                {currentUserRating && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(currentUserRating)}`}>
                    <Star className="h-4 w-4 mr-1" />
                    Your Rating: {currentUserRating.toFixed(1)}
                  </div>
                )}
              </div>

              {/* Skill Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">Active Users</p>
                  <p className="text-lg font-bold text-gray-900">
                    {topTaskContributors.length + topRatedContributors.length}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Briefcase className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs font-medium text-gray-500">Open Jobs</p>
                  <p className="text-lg font-bold text-gray-900">{openJobs.length}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/tasks')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Target className="h-4 w-4" />
                  <span>Browse {skill.name} Jobs</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  <Briefcase className="h-4 w-4" />
                  <span>View Dashboard</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Rating History */}
            {userData && userSkillHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Rating History</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <BarChart3 className="h-4 w-4" />
                    <span>Performance tracking</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {userSkillHistory.map((entry, index) => {
                    const previousRating = index > 0 ? userSkillHistory[index - 1].new_rating : null;
                    const trendIcon = getTrendIcon(entry.new_rating, previousRating);
                    return (
                      <div key={entry.id} className="flex flex-col md:flex-row md:items-center md:justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4 mb-2 md:mb-0">
                          <div className="flex items-center space-x-2">
                            {trendIcon}
                            <span className="font-medium text-gray-900">
                              {formatDate(entry.created_at)}
                            </span>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(entry.new_rating)}`}>
                            {entry.new_rating.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-sm text-gray-500">
                          <span>Old: {entry.old_rating?.toFixed ? entry.old_rating.toFixed(2) : entry.old_rating}</span>
                          <span>Change: {entry.change_amount > 0 ? '+' : ''}{entry.change_amount?.toFixed ? entry.change_amount.toFixed(2) : entry.change_amount}</span>
                          <span>Type: {entry.change_type}</span>
                          {entry.related_task_id && <span>Task: {entry.related_task_id}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Community Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Contributors by Tasks */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <ClipboardList className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Top Contributors by Tasks</h3>
                </div>
                <div className="space-y-3">
                  {topTaskContributors.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                      <span className="text-sm text-indigo-600 font-medium">{user.task_count} tasks</span>
                    </div>
                  ))}
                  {topTaskContributors.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No contributors yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Contributors by Rating */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Star className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Top Contributors by Rating</h3>
                </div>
                <div className="space-y-3">
                  {topRatedContributors.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-yellow-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="text-sm text-yellow-600 font-medium">{user.avg_rating}</span>
                      </div>
                    </div>
                  ))}
                  {topRatedContributors.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No rated contributors yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Job Posters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Top Job Posters</h3>
                </div>
                <div className="space-y-3">
                  {topJobPosters.slice(0, 5).map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">{index + 1}</span>
                        </div>
                        <span className="font-medium text-gray-800">{user.username}</span>
                      </div>
                      <span className="text-sm text-green-600 font-medium">{user.job_post_count} jobs</span>
                    </div>
                  ))}
                  {topJobPosters.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No job posters yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Current Jobs Available */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center mb-4">
                  <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Current Jobs Available</h3>
                </div>
                <div className="space-y-3">
                  {openJobs.slice(0, 5).map((job, index) => (
                    <div key={job.id} className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 text-sm">{job.title}</span>
                        <span className="text-xs text-gray-500">#{job.id}</span>
                      </div>
                      <p className="text-xs text-gray-600">Posted by {job.creator_name}</p>
                    </div>
                  ))}
                  {openJobs.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <Briefcase className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No open jobs available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SkillDetailPage; 