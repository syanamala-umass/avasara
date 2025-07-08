import "./App.css";
import { Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import ProfessionalDashboard from './ProfessionalDashboard';
import IdeaDetailPage from './IdeaDetailPage';
import ContributorProfile from './ContributorProfile';
import TaskBrowser from './pages/contributor/TaskBrowser';
import OAuthCallback from './components/OAuthCallback';
import VerifyEmail from './VerifyEmail';
import OnboardingFlow from './OnboardingFlow';

function CheckEmail() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-4">Check Your Email</h2>
        <p className="text-gray-700 mb-4">
          We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
        </p>
        <p className="text-gray-500 mb-4">
          Didn't receive the email? Check your spam folder or <a href="/" className="text-indigo-600 hover:underline">try signing up again</a>.
        </p>
        <a href="/" className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">Go to Home</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProfessionalDashboard />} />
      <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      <Route path="/profile" element={<ContributorProfile />} />
      <Route path="/contributor/tasks" element={<TaskBrowser />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/check-email" element={<CheckEmail />} />
      <Route path="/onboarding" element={<OnboardingFlow />} />
    </Routes>
  );
}

export default App;
