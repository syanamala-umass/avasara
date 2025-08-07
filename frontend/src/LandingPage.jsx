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
  Gift,
  ChevronDown,
  Play,
  Infinity
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoginPopup from './LoginPopup';
import SignupPopup from './SignupPopup';
import Logo from './components/Logo';
import { fetchLandingStats } from './api';

const LandingPage = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      // User is already logged in, redirect to dashboard or return URL
      const returnUrl = location.state?.returnUrl;
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate, location.state]);

  // Listen for storage changes to handle automatic sign-in across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token' && e.newValue) {
        // Token was added in another tab, redirect to dashboard or return URL
        const returnUrl = location.state?.returnUrl;
        if (returnUrl) {
          navigate(returnUrl);
        } else {
          navigate('/dashboard');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate, location.state]);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const features = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Global Community",
      description: "Connect with talented individuals from around the world",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Lightning Fast",
      description: "Get tasks completed quickly with our open marketplace where anyone can contribute",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Community Driven",
      description: "Built for the people, by the people, of the people",
      gradient: "from-pink-500 to-rose-500"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Quality Assured",
      description: "Peer-reviewed work ensures top-notch results every time",
      gradient: "from-green-500 to-emerald-500"
    }
  ];

  const skills = [
    { name: "Development", icon: <Code className="h-6 w-6" />, color: "from-blue-400 to-purple-600" },
    { name: "Design", icon: <Palette className="h-6 w-6" />, color: "from-purple-400 to-pink-600" },
    { name: "Content", icon: <PenTool className="h-6 w-6" />, color: "from-green-400 to-blue-600" },
    { name: "Media", icon: <Camera className="h-6 w-6" />, color: "from-pink-400 to-purple-600" },
    { name: "Audio", icon: <Mic className="h-6 w-6" />, color: "from-yellow-400 to-red-600" },
    { name: "Research", icon: <BookOpen className="h-6 w-6" />, color: "from-cyan-400 to-blue-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main floating orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-spin-slow"></div>
        
        {/* Additional floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-lg opacity-15 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-violet-400 rounded-full mix-blend-multiply filter blur-lg opacity-15 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-blue-400 rounded-full mix-blend-multiply filter blur-md opacity-20 animate-float"></div>
        <div className="absolute bottom-1/3 left-1/4 w-28 h-28 bg-teal-400 rounded-full mix-blend-multiply filter blur-md opacity-20 animate-float animation-delay-2000"></div>
        
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-indigo-900/10 to-transparent animate-shimmer"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-slate-900/80 backdrop-blur-md border-b border-purple-500/20' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                Avasara
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={openLoginPopup}
                className="text-gray-300 hover:text-white transition-colors duration-200 font-medium"
              >
                Log In
              </button>
              <button
                onClick={openSignupPopup}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
              >
                Join the Future
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Logo className="h-24 w-auto mx-auto mb-6" textClassName="text-6xl font-bold" />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
              Every Task
            </span>
            <br />
            <span className="text-white">For Everyone</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            Join the world's most inclusive task marketplace where anyone can contribute, 
            collaborate, and create. From coding to content, design to data - 
            <span className="font-semibold text-purple-400"> every skill matters</span>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <button
              onClick={openLoginPopup}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl flex items-center space-x-3"
            >
              <span>Start Contributing</span>
              <ArrowRight className="h-6 w-6" />
            </button>
            
            <button 
              onClick={openSignupPopup}
              className="text-white border-2 border-purple-400 px-8 py-4 rounded-2xl font-bold text-lg flex items-center space-x-3">
              <Users className="h-6 w-6" />
              <span>Join Community</span>
            </button>
          </div>

          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ChevronDown className="h-8 w-8 text-purple-400 mx-auto" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Why Choose
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Avasara?</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're building the future of work - one where everyone has a voice, 
              every skill is valued, and every contribution matters.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="relative p-8 rounded-3xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20"
              >
                <div className="flex items-start space-x-6">
                  <div className={`flex-shrink-0 p-4 rounded-2xl bg-gradient-to-r ${feature.gradient}`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Every Skill,
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent"> Every Task</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From technical development to creative content, find tasks that match your expertise 
              or discover new skills to learn.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm border border-gray-700/30"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${skill.color}`}>
                    <div className="text-white">
                      {skill.icon}
                    </div>
                  </div>
                  <span className="text-white font-semibold text-lg">{skill.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Ready to Make
            <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"> Your Mark?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Join our community today and start contributing to meaningful projects. 
            Every skill matters, every contribution counts.
          </p>
          
          <button
            onClick={openSignupPopup}
            className="bg-gradient-to-r from-pink-600 to-purple-600 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl flex items-center space-x-4 mx-auto"
          >
            <span>Join for Free</span>
            <Gift className="h-8 w-8" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <Logo className="h-10 w-auto" textClassName="text-2xl font-bold" />
              <p className="text-gray-400 mt-2">Every task for everyone</p>
            </div>
            
            <div className="flex space-x-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Support</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-400">
            <p>&copy; 2024 Avasara. Every task for everyone.</p>
          </div>
        </div>
      </footer>

      {/* Popups */}
      <LoginPopup 
        isOpen={showLoginPopup} 
        onClose={closeLoginPopup} 
        onShowSignup={openSignupPopup} 
      />
      
      <SignupPopup 
        isOpen={showSignupPopup} 
        onClose={closeSignupPopup} 
        onShowLogin={openLoginPopup} 
      />
    </div>
  );
};

export default LandingPage;