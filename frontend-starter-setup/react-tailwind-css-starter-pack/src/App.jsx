import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import UserDashboard from './UserDashboard';
import IdeaDetailPage from './IdeaDetailPage';

function App() {
  return (

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/ideas/:id" element={<IdeaDetailPage />} />
      </Routes>

  );
}

export default App;
