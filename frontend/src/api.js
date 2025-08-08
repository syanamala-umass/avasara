// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://avasara-backend.onrender.com/';

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
      
      // Only redirect if we're not on the login page and not making a login request
      const isLoginRequest = error.config?.url?.includes('/auth/token');
      const isOnLoginPage = window.location.pathname === '/' || window.location.pathname === '/login';
      
      if (!isLoginRequest && !isOnLoginPage) {
        // Redirect to login only for authenticated requests that fail
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

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

// OAuth services
export const getOAuthUrl = (provider) => api.get(`/oauth/${provider}/authorize`);
export const getOAuthToken = (provider, code) => api.post('/oauth/token', { provider, code });

// Landing page stats
export const fetchLandingStats = () => api.get('/landing/stats');
export const fetchLandingPublicTasks = () => api.get('/landing/public-tasks');
export const fetchRecentTasks = (limit = 8) => api.get('/tasks', { params: { limit, status: 'open' } });

// Task services
export const fetchTasks = (filters) => api.get('/tasks', { params: filters });
export const fetchTaskById = (id) => api.get(`/tasks/${id}`);
export const fetchTaskDetails = (id) => api.get(`/tasks/${id}/details`);
export const fetchRecommendedTasks = (limit = 5) => api.get(`/tasks/recommended?limit=${limit}`);
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
export const submitTask = async (taskId, formData) => {
  try {
    // First, get the user's assignment for this task
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData || !userData.id) {
      throw new Error('User data not found');
    }

    // Get the assignment ID for this task and user
    const assignmentsResponse = await api.get('/task-assignments', {
      params: {
        task_id: taskId,
        user_id: userData.id,
        status: 'in_progress'
      }
    });

    const assignments = assignmentsResponse.data || [];
    if (assignments.length === 0) {
      throw new Error('No active assignment found for this task');
    }

    const assignment = assignments[0];
    
    // Extract notes from formData
    const notes = formData.get('notes') || 'Task submitted for review';
    
    // Update the assignment status to 'submitted' which will trigger review task creation
    const response = await api.put(`/task-assignments/${assignment.id}`, {
      status: 'submitted',
      notes: notes
    });

    return response;
  } catch (error) {
    console.error('Error submitting task:', error);
    throw error;
  }
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
export const pickUpReview = (taskId, data) => api.post(`/review-tasks/${taskId}/assign`);
export const canUndertakeTask = (taskId, assignmentType = 'task') => api.get(`/task-assignments/can-undertake/${taskId}`, {
  params: { assignment_type: assignmentType }
});

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
export const addUserSkillsBulk = (userId, skillData) => api.post(`/users/${userId}/skills/bulk`, skillData);

export const parseResumeSkills = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/skills/parse-resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const fetchTopSkillsByTasks = (limit = 5) => api.get(`/skills/top-by-tasks?limit=${limit}`);
export const fetchSkillDetails = (skillId) => api.get(`/skills/${skillId}`);
export const fetchTopTaskContributors = (skillId) => api.get(`/skills/${skillId}/top-task-contributors`);
export const fetchTopRatedContributors = (skillId) => api.get(`/skills/${skillId}/top-rated-contributors`);
export const fetchTopJobPosters = (skillId) => api.get(`/skills/${skillId}/top-job-posters`);
export const fetchOpenJobsForSkill = (skillId) => api.get(`/tasks`, { params: { skill_id: skillId, status: 'open' } });
export const fetchUserSkillHistory = (userId, skillId) => api.get(`/users/${userId}/skills/${skillId}/history`);

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

// Review-related API functions
export const fetchMyReviews = () => api.get('/reviews/my-reviews');
export const fetchMyReceivedReviews = () => api.get('/reviews/my-received-reviews');
export const fetchReviewSubmissions = (taskId) => api.get(`/tasks/${taskId}/review-submissions`);
export const fetchReviewTasks = (filters) => api.get('/review-tasks', { params: filters });
export const fetchReviewTaskDetails = (reviewTaskId) => api.get(`/review-tasks/${reviewTaskId}/details`);
export const fetchReviewTask = (reviewTaskId) => api.get(`/review-tasks/${reviewTaskId}`);
export const assignReviewTask = (reviewTaskId) => api.post(`/review-tasks/${reviewTaskId}/assign`);
export const submitReviewAssignment = (assignmentId, reviewData) => api.put(`/review-tasks/assignments/${assignmentId}`, reviewData);
export const fetchMyReviewAssignments = (status = 'in_progress') => {
  console.log('DEBUG: fetchMyReviewAssignments called with status:', status);
  return api.get('/review-tasks/my-assignments', { params: { status } });
};

// Assign (undertake) a task as a contributor with skill validation
export const assignTask = async (taskId) => {
  // First check if user can undertake this task
  const capabilityCheck = await canUndertakeTask(taskId);
  
  if (!capabilityCheck.data.can_undertake) {
    throw new Error(capabilityCheck.data.reason || 'You cannot undertake this task');
  }
  
  // If they can undertake it, proceed with assignment
  return api.post('/task-assignments', {
    task_id: taskId,
    assignment_type: 'task',
    status: 'in_progress',
    notes: 'Task undertaken'
  });
};

export const resubmitTask = async (assignmentId, notes) => {
  try {
    const response = await api.post(`/task-assignments/${assignmentId}/resubmit`, {
      notes: notes || 'Work resubmitted for review'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error resubmitting task:', error);
    throw error;
  }
};

// Public Task services (no authentication required)
export const fetchPublicTasks = (filters) => api.get('/tasks/public', { params: filters });
export const fetchPublicTaskById = (id) => api.get(`/tasks/public/${id}`);
export const fetchPublicReviewTasks = (filters) => api.get('/review-tasks/public', { params: filters });
export const fetchPublicReviewTaskById = (id) => api.get(`/review-tasks/public/${id}`);

export default api;

// Task assignment duration functions
export const getAssignmentDurationInfo = async (assignmentId) => {
  return await api.get(`/task-assignments/${assignmentId}/duration-info`);
};

export const checkAndCancelOverdueAssignments = async () => {
  return await api.post('/task-assignments/check-and-cancel-overdue');
};

export const cancelOverdueAssignment = async (assignmentId) => {
  return await api.post(`/task-assignments/${assignmentId}/cancel-overdue`);
};

// Fetch user's rating history for a skill
export const fetchUserSkillRatingHistory = (userId, skillId) => api.get(`/ratings/user/${userId}/skill/${skillId}/history`);


// AI Template services
export const generateTaskDescriptionTemplate = (templateData) => api.post('/ai-templates/generate-task-description', templateData);

export const rewriteTaskDescription = (rewriteData) => api.post('/ai-templates/rewrite-task-description', rewriteData);

export const requestPasswordReset = (email) => api.post('/auth/request-password-reset', { email });

export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword });
