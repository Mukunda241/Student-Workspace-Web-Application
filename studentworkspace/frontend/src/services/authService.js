import api from './api';

export const userService = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getProfile: () => api.get('/api/users/profile'),
};

export const projectService = {
  createProject: (userId, data) => api.post(`/api/projects/create/${userId}`, data),
  getUserProjects: (userId) => api.get(`/api/projects/user/${userId}`),
  getUserProjectsWithTasks: (userId) => api.get(`/api/projects/user/${userId}/with-tasks`),
  // FIX: backend uses /update/{projectId}
  updateProject: (projectId, data) => api.put(`/api/projects/update/${projectId}`, data),
  deleteProject: (projectId) => api.delete(`/api/projects/delete/${projectId}`),
};

export const taskService = {
  createTask: (userId, data) => api.post(`/api/tasks/create/${userId}`, data),
  getUserTasks: (userId) => api.get(`/api/tasks/user/${userId}`),
  getTasksByProject: (projectId) => api.get(`/api/tasks/project/${projectId}`),
  // FIX: backend PUT is /{taskId} not /update/{taskId}
  updateTask: (taskId, data) => api.put(`/api/tasks/${taskId}`, data),
  deleteTask: (taskId) => api.delete(`/api/tasks/delete/${taskId}`),
  updateTaskStatus: (taskId, status) => api.patch(`/api/tasks/${taskId}/status`, { status }),
  getUrgentTasks: (userId) => api.get(`/api/tasks/urgent/${userId}`),
};

// FIX: /create/{userId}/{projectId} — userId first
export const noteService = {
  createNote: (userId, projectId, data) => api.post(`/api/notes/create/${userId}/${projectId}`, data),
  getUserNotes: (userId) => api.get(`/api/notes/user/${userId}`),
  getProjectNotes: (projectId) => api.get(`/api/notes/project/${projectId}`),
  updateNote: (noteId, data) => api.put(`/api/notes/update/${noteId}`, data),
  deleteNote: (noteId) => api.delete(`/api/notes/delete/${noteId}`),
};

// FIX: /upload/{userId}/{projectId} — userId first
export const fileService = {
  uploadFile: (userId, projectId, formData) =>
    api.post(`/api/files/upload/${userId}/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUserFiles: (userId) => api.get(`/api/files/user/${userId}`),
  getProjectFiles: (projectId) => api.get(`/api/files/project/${projectId}`),
  deleteFile: (fileId) => api.delete(`/api/files/delete/${fileId}`),
};

export const dashboardService = {
  getSummary: (userId) => api.get(`/api/dashboard/summary/${userId}`),
};
