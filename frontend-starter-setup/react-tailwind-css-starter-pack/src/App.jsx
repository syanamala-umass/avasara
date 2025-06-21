import "./App.css";
import { Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import UserDashboard from './UserDashboard';
import IdeaDetailPage from './IdeaDetailPage';
import ContributorProfile from './ContributorProfile';
import TaskBrowser from './pages/contributor/TaskBrowser';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      <Route path="/profile" element={<ContributorProfile />} />
      <Route path="/contributor/tasks" element={<TaskBrowser />} />
    </Routes>
  );
}

export default App;
