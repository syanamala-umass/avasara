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
import TaskDetailModal from '../TaskDetailModal';

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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading skill details...</p>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Skill not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-spin-slow"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 shadow-lg border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="font-medium">Back to Dashboard</span>
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  Avasara
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Skill Overview Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8">
                {/* Skill Header */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Award className="h-12 w-12 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-3">
                    {skill.name}
                  </h1>
                  <p className="text-gray-300 text-sm mb-4">
                    {skill.description || 'No description available'}
                  </p>
                  {currentUserRating && (
                    <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium">
                      <Star className="h-4 w-4 mr-2" />
                      Your Rating: {currentUserRating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Skill Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 text-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">Active Users</p>
                    <p className="text-lg font-bold text-white">
                      {topTaskContributors.length + topRatedContributors.length}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 text-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Briefcase className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-xs font-medium text-gray-400">Open Jobs</p>
                    <p className="text-lg font-bold text-white">{openJobs.length}</p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/tasks')}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                  >
                    <Briefcase className="h-5 w-5" />
                    <span>Browse All Tasks</span>
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2"
                  >
                    <Target className="h-5 w-5" />
                    <span>Update My Skills</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Jobs Available */}
              <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Current Jobs</span> Available
                </h2>
                {openJobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Briefcase className="h-6 w-6 text-white" />
                    </div>
                    <p className="text-gray-400 text-sm">No jobs available for this skill</p>
                    <p className="text-gray-500 text-xs mt-1">Check back later for new opportunities</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {openJobs.slice(0, 3).map(job => (
                      <div
                        key={job.id}
                        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 cursor-pointer hover:border-purple-400/40 transition-all duration-300"
                        onClick={() => {
                          setSelectedTask(job);
                          setIsTaskModalOpen(true);
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-base font-semibold text-white">{job.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium">
                              Open
                            </span>
                            <span className="text-green-400 text-xs font-medium">
                              ${job.compensation}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-300 text-xs mb-2 line-clamp-1">{job.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Posted {formatDate(job.created_at)}</span>
                          </span>
                          <button className="text-purple-400 hover:text-purple-300 text-xs font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* View More Jobs Button */}
                    {openJobs.length > 3 && (
                      <div className="text-center pt-2">
                        <button
                          onClick={() => navigate('/tasks')}
                          className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center justify-center space-x-2 mx-auto"
                        >
                          <span>View More Jobs</span>
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Top Contributors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Task Contributors */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Top Task Contributors</h3>
                  {topTaskContributors.length === 0 ? (
                    <p className="text-gray-400 text-sm">No contributors yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topTaskContributors.slice(0, 3).map((contributor, index) => (
                        <div key={contributor.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <UserCircle className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-300 text-sm">{contributor.username}</span>
                          </div>
                          <span className="text-purple-400 text-xs font-medium">{contributor.task_count} tasks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Rated Contributors */}
                <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-white mb-4">Top Rated Contributors</h3>
                  {topRatedContributors.length === 0 ? (
                    <p className="text-gray-400 text-sm">No rated contributors yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topRatedContributors.slice(0, 3).map((contributor, index) => (
                        <div key={contributor.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                              <Star className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-300 text-sm">{contributor.username}</span>
                          </div>
                          <span className="text-yellow-400 text-xs font-medium">{contributor.rating.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <TaskDetailModal
        isOpen={isTaskModalOpen}
        task={selectedTask}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
};

export default SkillDetailPage; 