import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StartupDashboard from './pages/startup/Dashboard';
import StartupProfile from './pages/startup/Profile';
import TaskCreate from './pages/startup/TaskCreate';
import TaskManage from './pages/startup/TaskManage';
import ContributorDashboard from './pages/contributor/Dashboard';
import ContributorProfile from './pages/contributor/Profile';
import TaskBrowser from './pages/contributor/TaskBrowser';
import TaskDetail from './pages/TaskDetail';
import MyTasks from './pages/contributor/MyTasks';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Startup Routes */}
              <Route 
                path="/startup/dashboard" 
                element={
                  <PrivateRoute userType="startup_admin">
                    <StartupDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/startup/profile" 
                element={
                  <PrivateRoute userType="startup_admin">
                    <StartupProfile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/startup/tasks/create" 
                element={
                  <PrivateRoute userType="startup_admin">
                    <TaskCreate />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/startup/tasks/manage" 
                element={
                  <PrivateRoute userType="startup_admin">
                    <TaskManage />
                  </PrivateRoute>
                } 
              />
              
              {/* Contributor Routes */}
              <Route 
                path="/contributor/dashboard" 
                element={
                  <PrivateRoute userType="contributor">
                    <ContributorDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/contributor/profile" 
                element={
                  <PrivateRoute userType="contributor">
                    <ContributorProfile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/contributor/tasks" 
                element={
                  <PrivateRoute userType="contributor">
                    <TaskBrowser />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/contributor/my-tasks" 
                element={
                  <PrivateRoute userType="contributor">
                    <MyTasks />
                  </PrivateRoute>
                } 
              />

              <Route path="/register" element={<Register />} />
              
              {/* Common Routes */}
              <Route path="/tasks/:id" element={<TaskDetail />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
