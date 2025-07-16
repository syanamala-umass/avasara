import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchSkillDetails,
  fetchTopTaskContributors,
  fetchTopRatedContributors,
  fetchTopJobPosters,
  fetchOpenJobsForSkill,
} from '../api';
import { Briefcase, Star, Users, ClipboardList, Award, ArrowLeft } from 'lucide-react';

const SkillDetailPage = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [topTaskContributors, setTopTaskContributors] = useState([]);
  const [topRatedContributors, setTopRatedContributors] = useState([]);
  const [topJobPosters, setTopJobPosters] = useState([]);
  const [openJobs, setOpenJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const skillRes = await fetchSkillDetails(skillId);
        setSkill(skillRes.data);

        fetchTopTaskContributors(skillId)
          .then(res => setTopTaskContributors(res.data))
          .catch(() => setTopTaskContributors([]));
        fetchTopRatedContributors(skillId)
          .then(res => setTopRatedContributors(res.data))
          .catch(() => setTopRatedContributors([]));
        fetchTopJobPosters(skillId)
          .then(res => setTopJobPosters(res.data))
          .catch(() => setTopJobPosters([]));
        fetchOpenJobsForSkill(skillId)
          .then(res => setOpenJobs(res.data))
          .catch(() => setOpenJobs([]));
      } catch (err) {
        setSkill(null);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [skillId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading skill details...</p>
      </div>
    </div>
  );
  if (!skill) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Skill not found.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      {/* Top Navigation Bar */}
      <div className="max-w-3xl mx-auto flex items-center justify-between mb-8 px-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </button>
        <span className="text-xl font-bold tracking-wide text-indigo-700 select-none">Avasara</span>
      </div>
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mr-6">
            <Award className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{skill.name}</h1>
            <p className="text-gray-600">{skill.description}</p>
          </div>
        </div>

        <hr className="my-6" />

        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Contributors by Tasks */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <ClipboardList className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Top Contributors by Tasks</h2>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const user = topTaskContributors[i];
                return user ? (
                  <li key={user.id} className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{user.username}</span>
                    <span className="text-xs text-indigo-600">{user.task_count} tasks</span>
                  </li>
                ) : (
                  <li key={i} className="flex justify-between items-center opacity-0 select-none">
                    <span>empty</span><span>empty</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Top Contributors by Rating */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Star className="h-5 w-5 text-yellow-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Top Contributors by Rating</h2>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const user = topRatedContributors[i];
                return user ? (
                  <li key={user.id} className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{user.username}</span>
                    <span className="text-xs text-yellow-600">Avg. Rating: {user.avg_rating}</span>
                  </li>
                ) : (
                  <li key={i} className="flex justify-between items-center opacity-0 select-none">
                    <span>empty</span><span>empty</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Top Job Posters */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Top Job Posters</h2>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const user = topJobPosters[i];
                return user ? (
                  <li key={user.id} className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{user.username}</span>
                    <span className="text-xs text-green-600">{user.job_post_count} jobs</span>
                  </li>
                ) : (
                  <li key={i} className="flex justify-between items-center opacity-0 select-none">
                    <span>empty</span><span>empty</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Current Jobs Available */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center mb-4">
              <Briefcase className="h-5 w-5 text-indigo-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Current Jobs Available</h2>
            </div>
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const job = openJobs[i];
                return job ? (
                  <li key={job.id} className="flex justify-between items-center">
                    <span className="font-medium text-gray-800">{job.title}</span>
                    <span className="text-xs text-gray-500">Posted by {job.creator_name}</span>
                  </li>
                ) : (
                  <li key={i} className="flex justify-between items-center opacity-0 select-none">
                    <span>empty</span><span>empty</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillDetailPage; 