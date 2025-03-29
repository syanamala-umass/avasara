// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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
});

// Auth services
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);

// Task services
export const fetchTasks = (filters) => api.get('/tasks', { params: filters });
export const fetchTaskById = (id) => api.get(`/tasks/${id}`);
export const createTask = (taskData) => api.post('/tasks', taskData);
export const applyForTask = (id, data) => api.post(`/tasks/${id}/apply`, data);
export const submitTask = (id, data) => api.post(`/tasks/${id}/submit`, data);
export const reviewTask = (id, data) => api.post(`/tasks/${id}/review`, data);

// Startup services
export const createStartupProfile = (data) => api.post('/startups', data);
export const updateStartupProfile = (id, data) => api.put(`/startups/${id}`, data);
export const fetchStartupProfile = (id) => api.get(`/startups/${id}`);

// Contributor services
export const createContributorProfile = (data) => api.post('/contributors', data);
export const updateContributorProfile = (id, data) => api.put(`/contributors/${id}`, data);
export const fetchContributorProfile = (id) => api.get(`/contributors/${id}`);
export const fetchSkills = () => api.get('/skills');

export default api;