// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:8000/';

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      // Redirect to login
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const fetchLandingStats = () => api.get('/landing/stats');

// Auth services
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = async (credentials) => {
  // Convert credentials to URLSearchParams for OAuth2 password flow
  const formData = new URLSearchParams();
  formData.append('username', credentials.username);
  formData.append('password', credentials.password);
  
  const response = await api.post('/auth/token', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  // Store user data in localStorage
  if (response.data && response.data.user) {
    localStorage.setItem('userData', JSON.stringify(response.data.user));
  }

  return response;
};

// Task services
export const fetchTasks = (filters) => api.get('/tasks', { params: filters });
export const fetchTaskById = (id) => api.get(`/tasks/${id}`);
export const fetchTaskDetails = (id) => api.get(`/tasks/${id}/details`);
export const createTask = (taskData) => api.post('/tasks', taskData);
export const updateTask = (id, taskData) => api.put(`/tasks/${id}`, taskData);
export const deleteTask = async (taskId) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
export const applyForTask = (id, data) => api.post(`/tasks/${id}/apply`, data);
export const submitTask = (id, formData) => {
  return api.post(`/tasks/${id}/submit`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
export const reviewTask = (id, data) => api.post(`/tasks/${id}/review`, data);
export const getSubmittedTasks = () => api.get('/tasks/submitted');
export const getReviewedTasks = () => api.get('/tasks/reviewed');

// Task Assignment services
export const createTaskAssignment = (assignmentData) => api.post('/task-assignments', assignmentData);
export const updateTaskAssignment = (id, assignmentData) => api.put(`/task-assignments/${id}`, assignmentData);
export const fetchTaskAssignments = (filters) => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.id) {
    throw new Error('User data not found');
  }
  return api.get('/task-assignments', { 
    params: { 
      ...filters,
      user_id: userData.id 
    } 
  });
};
export const fetchTaskAssignmentById = (id) => api.get(`/task-assignments/${id}`);
export const completeTask = (id, data) => api.put(`/task-assignments/${id}`, { ...data, status: 'completed' });
export const pickUpReview = (taskId, data) => api.post('/task-assignments', { ...data, task_id: taskId, assignment_type: 'review' });

// Peer Evaluation services
export const createPeerEvaluation = (evaluationData) => api.post('/peer-evaluations', evaluationData);
export const fetchPeerEvaluations = (filters) => api.get('/peer-evaluations', { params: filters });
export const fetchPeerEvaluationById = (id) => api.get(`/peer-evaluations/${id}`);
export const updatePeerEvaluation = (id, evaluationData) => api.put(`/peer-evaluations/${id}`, evaluationData);

// Startup services
export const createStartupProfile = (data) => api.post('/startups', data);
export const updateStartupProfile = (id, data) => api.put(`/startups/${id}`, data);
export const fetchStartupProfile = (id) => api.get(`/startups/${id}`);
export const getStartupTasks = (id) => api.get(`/startups/${id}/tasks`);
export const getStartupApplications = (id) => api.get(`/startups/${id}/applications`);

// User Profile services
export const updateUserProfile = (id, data) => api.put(`/users/${id}/profile`, data);
export const fetchUserProfile = (id) => api.get(`/users/${id}/profile`);

// Skill services
export const fetchSkills = () => api.get('/skills');
export const createSkill = (skillData) => api.post('/skills', skillData);
export const fetchSkillById = (id) => api.get(`/skills/${id}`);
export const fetchUserSkills = (userId) => api.get(`/users/${userId}/skills`);
export const addUserSkills = (userId, skillData) => api.post(`/users/${userId}/skills`, skillData);
export const addNewUserSkill = (userId, skillData) => api.post(`/users/${userId}/skills/new`, skillData);

export const fetchMyAssignments = (status = 'in_progress') => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (!userData || !userData.id) {
    throw new Error('User data not found');
  }
  return api.get('/task-assignments', { 
    params: { 
      status,
      user_id: userData.id 
    } 
  });
};

// Idea services
export const fetchIdeas = () => api.get('/ideas');
export const fetchIdeaById = (id) => api.get(`/ideas/${id}`);
export const createIdea = (ideaData) => api.post('/ideas', ideaData);
export const updateIdea = (id, ideaData) => api.put(`/ideas/${id}`, ideaData);
export const deleteIdea = (id) => api.delete(`/ideas/${id}`);

// General
export const pingBackend = () => api.get('/health');

// Assign (undertake) a task as a contributor
export const assignTask = (taskId) =>
  api.post('/task-assignments', {
    task_id: taskId,
    assignment_type: 'task'
  });

// Review-related API functions
export const fetchMyReviews = () => api.get('/reviews/my-reviews');
export const fetchMyReceivedReviews = () => api.get('/reviews/my-received-reviews');
export const fetchReviewSubmissions = (taskId) => api.get(`/tasks/${taskId}/review-submissions`);

export default api;
