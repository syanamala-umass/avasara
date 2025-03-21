import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import StartupDashboard from './pages/startup/Dashboard';
import ContributorDashboard from './pages/contributor/Dashboard';
import TaskDetail from './pages/tasks/TaskDetail';
import ProfilePage from './pages/profile/ProfilePage';
import AuthPage from './pages/auth/AuthPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth/:type" element={<AuthPage />} />
            <Route path="/startup/dashboard" element={<StartupDashboard />} />
            <Route path="/contributor/dashboard" element={<ContributorDashboard />} />
            <Route path="/task/:id" element={<TaskDetail />} />
            <Route path="/profile/:id" element={<ProfilePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;