import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Star, Sparkles, Users, Target } from 'lucide-react';
import axios from 'axios';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState('welcome');
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    loadSkills();
    checkOnboardingProgress();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await axios.get('/onboarding/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Error loading skills:', error);
    }
  };

  const checkOnboardingProgress = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      const response = await axios.get(`/onboarding/progress/${userData.id}`);
      if (response.data.current_step === 'complete') {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };

  const handleSkillToggle = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const completeSkillsSelection = async () => {
    if (selectedSkills.length === 0) {
      alert('Please select at least one skill');
      return;
    }

    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('userData'));
      await axios.post(`/onboarding/skills-selection/${userData.id}`, {
        skill_ids: selectedSkills
      });
      
      // Load recommendations
      const recResponse = await axios.get(`/onboarding/recommendations/${userData.id}`);
      setRecommendations(recResponse.data.tasks);
      setCurrentStep('recommendations');
    } catch (error) {
      console.error('Error completing skills selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    navigate('/dashboard');
  };

  const renderWelcomeStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to Avasara
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Let's get you started on your journey to connect with amazing opportunities
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Target className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Find Your Path</h3>
            <p className="text-gray-600">Select your skills and interests to discover relevant opportunities</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Connect & Collaborate</h3>
            <p className="text-gray-600">Work with startups and contribute to meaningful projects</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Grow & Earn</h3>
            <p className="text-gray-600">Build your reputation and earn compensation for your work</p>
          </div>
        </div>

        <button
          onClick={() => setCurrentStep('skills')}
          className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center mx-auto"
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </button>
      </div>
    </div>
  );

  const renderSkillsStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What are your skills?</h2>
          <p className="text-gray-600">Select the skills you have. All skills start with a neutral rating and improve based on your performance.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {skills.map(skill => (
            <div
              key={skill.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                selectedSkills.includes(skill.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-indigo-300'
              }`}
              onClick={() => handleSkillToggle(skill.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                {selectedSkills.includes(skill.id) && (
                  <CheckCircle className="h-5 w-5 text-indigo-500" />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
              <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                {skill.category}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={completeSkillsSelection}
            disabled={loading || selectedSkills.length === 0}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Continue with ${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecommendationsStep = () => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Amazing Opportunities for You</h2>
          <p className="text-gray-600">Based on your skills, here are some tasks you might be interested in</p>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4 mb-8">
            {recommendations.map(task => (
              <div key={task.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h3>
                    <p className="text-gray-600 mb-3">{task.description}</p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>{task.startup_name}</span>
                      <span>•</span>
                      <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="font-medium text-indigo-600">
                        ${task.compensation_amount} {task.compensation_type}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
                    View Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
            <p className="text-gray-600 mb-4">No tasks available right now, but we'll notify you when new opportunities match your skills!</p>
          </div>
        )}

        <div className="text-center">
          <button
            onClick={completeOnboarding}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
          >
            Complete Setup & Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  switch (currentStep) {
    case 'welcome':
      return renderWelcomeStep();
    case 'skills':
      return renderSkillsStep();
    case 'recommendations':
      return renderRecommendationsStep();
    default:
      return renderWelcomeStep();
  }
};

export default OnboardingFlow; 