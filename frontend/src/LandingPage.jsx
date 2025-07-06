import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Award, 
  Building, 
  CheckCircle, 
  Users, 
  Globe, 
  Zap, 
  Heart, 
  Star,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Briefcase,
  Lightbulb,
  Code,
  Palette,
  Camera,
  PenTool,
  Mic,
  Video,
  BookOpen,
  Globe2,
  Users2,
  Handshake,
  Gift
} from 'lucide-react';
import LoginPopup from './LoginPopup';
import SignupPopup from './SignupPopup';
import { fetchLandingStats } from './api';

const LandingPage = () => {
  // Commented out stats fetching for now
  // const [stats, setStats] = useState({
  //   total_tasks: 0,
  //   total_startups: 0,
  //   total_contributors: 0,
  //   top_contributors: [],
  //   recent_tasks: []
  // });
  // const [loading, setLoading] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);

  const openLoginPopup = () => {
    setShowLoginPopup(true);
    setShowSignupPopup(false);
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  const openSignupPopup = () => {
    setShowSignupPopup(true);
    setShowLoginPopup(false);
  };

  const closeSignupPopup = () => {
    setShowSignupPopup(false);
  };

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await fetchLandingStats();
  //       console.log("API response:", response);
  //       
  //       if (response && response.data) {
  //         setStats({
  //           total_tasks: response.data.total_tasks || 0,
  //           total_startups: response.data.total_startups || 0,
  //           total_contributors: response.data.total_contributors || 0,
  //           top_contributors: response.data.top_contributors || [],
  //           recent_tasks: response.data.recent_tasks || []
  //         });
  //       }
  //     } catch (error) {
  //       console.error('Error fetching landing page stats:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   
  //   fetchStats();
  // }, []);

  const features = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Community",
      description: "Connect with talented individuals from around the world"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Get tasks completed quickly with our efficient peer-review system"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Community Driven",
      description: "Built for the people, by the people, of the people"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Assured",
      description: "Peer-reviewed work ensures top-notch results every time"
    }
  ];

  const taskCategories = [
    { icon: <Code className="h-6 w-6" />, name: "Development", color: "bg-blue-500" },
    { icon: <Palette className="h-6 w-6" />, name: "Design", color: "bg-purple-500" },
    { icon: <PenTool className="h-6 w-6" />, name: "Content", color: "bg-green-500" },
    { icon: <Camera className="h-6 w-6" />, name: "Media", color: "bg-pink-500" },
    { icon: <Mic className="h-6 w-6" />, name: "Audio", color: "bg-orange-500" },
    { icon: <Video className="h-6 w-6" />, name: "Video", color: "bg-red-500" },
    { icon: <BookOpen className="h-6 w-6" />, name: "Research", color: "bg-indigo-500" },
    { icon: <Globe2 className="h-6 w-6" />, name: "Translation", color: "bg-teal-500" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Avasara
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="px-4 py-2 rounded-lg text-indigo-600 font-medium hover:bg-indigo-50 transition-all duration-200"
                onClick={openLoginPopup}
              >
                Log In
              </button>
              <button 
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={openSignupPopup}
              >
                Join the Community
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Popup */}
      <LoginPopup isOpen={showLoginPopup} onClose={closeLoginPopup} />

      {/* Signup Popup */}
      <SignupPopup isOpen={showSignupPopup} onClose={closeSignupPopup} />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Of the People, By the People, For the People
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Every Task
              </span>
              <br />
              <span className="text-gray-800">For Everyone</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              Join the world's most inclusive task marketplace where anyone can contribute, 
              collaborate, and create. From coding to content, design to data - 
              <span className="font-semibold text-indigo-600"> every skill matters</span>.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <button 
                onClick={openSignupPopup}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Start Contributing <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button className="px-8 py-4 border-2 border-indigo-600 rounded-xl text-indigo-600 font-semibold hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center">
                <Rocket className="mr-2 h-5 w-5" />
                Explore Tasks
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center space-x-8 text-gray-500">
              <div className="flex items-center">
                <Users2 className="h-5 w-5 mr-2" />
                <span className="text-sm">10,000+ Contributors</span>
              </div>
              <div className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                <span className="text-sm">50,000+ Tasks Completed</span>
              </div>
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                <span className="text-sm">4.9/5 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Avasara?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building the future of work - one where everyone has a voice, 
              every skill is valued, and every contribution matters.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-2xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 group">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Categories */}
      <div className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Every Skill, Every Task
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From technical development to creative content, find tasks that match your expertise 
              or discover new skills to learn.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {taskCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${category.color} text-white mb-4`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Community Impact
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our global community is making a difference, one task at a time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 text-white mb-6">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {/* {loading ? '...' : stats.total_contributors} */}
              </h3>
              <p className="text-lg text-gray-600">Active Contributors</p>
              <p className="text-sm text-gray-500 mt-2">From 50+ countries</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-green-600 text-white mb-6">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {/* {loading ? '...' : stats.total_tasks} */}
              </h3>
              <p className="text-lg text-gray-600">Tasks Completed</p>
              <p className="text-sm text-gray-500 mt-2">With 98% satisfaction</p>
            </div>

            <div className="text-center p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-600 text-white mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">
                {/* {loading ? '...' : stats.total_startups} */}
              </h3>
              <p className="text-lg text-gray-600">Projects Launched</p>
              <p className="text-sm text-gray-500 mt-2">Across all industries</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, transparent, and community-driven - that's how we roll.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-600 text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Find Your Task</h3>
              <p className="text-gray-600">
                Browse through thousands of tasks across all categories. 
                Find something that matches your skills or interests.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-purple-600 text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Contribute & Collaborate</h3>
              <p className="text-gray-600">
                Work on your task, collaborate with others, and get feedback 
                from our community of experts.
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-600 text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Rewarded</h3>
              <p className="text-gray-600">
                Receive fair compensation, build your portfolio, and earn 
                recognition in our community.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Contributors Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Community Champions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the amazing individuals who are making a difference in our community
            </p>
          </div>

          {/* {loading ? (
            <div className="text-center text-gray-500">Loading community champions...</div>
          ) : stats.top_contributors.length === 0 ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Users className="h-8 w-8" />
              </div>
              <p className="text-gray-500">Be the first to join our community!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stats.top_contributors.map((contributor) => (
                <div key={contributor.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                      {contributor.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        {contributor.username}
                        {contributor.completed_tasks >= 10 && (
                          <Award className="ml-2 h-5 w-5 text-yellow-500" />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">{contributor.completed_tasks} tasks completed</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Community Member</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">Top Contributor</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </div>
      </div>

      {/* Recent Tasks Section */}
      <div className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Latest Opportunities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover fresh tasks and exciting projects from our community
            </p>
          </div>

          {/* {loading ? (
            <div className="text-center text-gray-500">Loading opportunities...</div>
          ) : stats.recent_tasks.length === 0 ? (
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Lightbulb className="h-8 w-8" />
              </div>
              <p className="text-gray-500">New opportunities coming soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {stats.recent_tasks.map((task) => (
                <div key={task.id} className="bg-white rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                      {task.category || 'General'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {task.compensation_type === 'cash' ? `$${task.compensation_amount}` : `${task.compensation_amount}% equity`}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{task.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{task.startup_name}</span>
                    <div className="flex items-center text-sm text-indigo-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Just posted
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )} */}
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
            <Handshake className="h-4 w-4 mr-2" />
            Join 10,000+ Contributors
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Make Your Mark?
          </h2>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto mb-8">
            Join our community today and start contributing to meaningful projects. 
            Every skill matters, every contribution counts.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button 
              onClick={openSignupPopup}
              className="px-8 py-4 bg-white rounded-xl text-indigo-600 font-semibold hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Gift className="mr-2 h-5 w-5" />
              Join for Free
            </button>
            <button className="px-8 py-4 border-2 border-white rounded-xl text-white font-semibold hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
              <Briefcase className="mr-2 h-5 w-5" />
              Browse Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Avasara</span>
              </div>
              <p className="text-gray-400 max-w-md mb-4">
                Every task for everyone. Building the future of work through community, 
                collaboration, and shared success.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Users className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Heart className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Community</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Our Mission</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Success Stories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Community Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Task Categories</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Skill Development</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Contact Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Code of Conduct</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-400">
              &copy; 2025 Avasara. Built with ❤️ of the people, by the people, for the people.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;