import api from './api';

// User Authentication APIs
export const userService = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getProfile: () => api.get('/api/users/profile'),
};

// Project APIs
export const projectService = {
  createProject: (userId, projectData) => 
    api.post(`/api/projects/create/${userId}`, projectData),
  getAllProjects: () => api.get('/api/projects/all'),
  getUserProjects: (userId) => api.get(`/api/projects/user/${userId}`),
  updateProject: (projectId, projectData) => 
    api.put(`/api/projects/update/${projectId}`, projectData),
  deleteProject: (projectId) => api.delete(`/api/projects/delete/${projectId}`),
  // OPTIMIZED: Fetch projects with top 3 tasks (prevents N+1 problem)
  getUserProjectsWithTasks: (userId) => api.get(`/api/projects/user/${userId}/with-tasks`),
};

// Task APIs
export const taskService = {
  createTask: (userId, taskData) => 
    api.post(`/api/tasks/create/${userId}`, taskData),
  getAllTasks: () => api.get('/api/tasks/all'),
  getUserTasks: (userId) => api.get(`/api/tasks/user/${userId}`),
  updateTask: (taskId, taskData) => 
    api.put(`/api/tasks/update/${taskId}`, taskData),
  deleteTask: (taskId) => api.delete(`/api/tasks/delete/${taskId}`),
  getTasksByProject: (projectId) => api.get(`/api/tasks/project/${projectId}`),
  // Get urgent tasks for user (sorted by priority and deadline)
  getUrgentTasks: (userId) => api.get(`/api/tasks/urgent/${userId}`),
};

// Note APIs
export const noteService = {
  createNote: (projectId, userId, noteData) => 
    api.post(`/api/notes/create/${projectId}/${userId}`, noteData),
  getAllNotes: () => api.get('/api/notes/all'),
  getProjectNotes: (projectId) => api.get(`/api/notes/project/${projectId}`),
  getUserNotes: (userId) => api.get(`/api/notes/user/${userId}`),
  updateNote: (noteId, noteData) => 
    api.put(`/api/notes/update/${noteId}`, noteData),
  deleteNote: (noteId) => api.delete(`/api/notes/delete/${noteId}`),
};

// File APIs
export const fileService = {
  uploadFile: (projectId, userId, formData) => 
    api.post(`/api/files/upload/${projectId}/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAllFiles: () => api.get('/api/files/all'),
  getProjectFiles: (projectId) => api.get(`/api/files/project/${projectId}`),
  getUserFiles: (userId) => api.get(`/api/files/user/${userId}`),
  deleteFile: (fileId) => api.delete(`/api/files/delete/${fileId}`),
};
