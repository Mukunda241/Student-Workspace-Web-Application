// API endpoints constants
export const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  REGISTER: '/api/users/register',
  LOGIN: '/api/users/login',
  PROFILE: '/api/users/profile',
};

// Project endpoints
export const PROJECT_ENDPOINTS = {
  CREATE: (userId) => `/api/projects/create/${userId}`,
  GET_ALL: '/api/projects/all',
  GET_USER: (userId) => `/api/projects/user/${userId}`,
  UPDATE: (projectId) => `/api/projects/update/${projectId}`,
  DELETE: (projectId) => `/api/projects/delete/${projectId}`,
};

// Task endpoints
export const TASK_ENDPOINTS = {
  CREATE: (userId) => `/api/tasks/create/${userId}`,
  GET_ALL: '/api/tasks/all',
  GET_USER: (userId) => `/api/tasks/user/${userId}`,
  UPDATE: (taskId) => `/api/tasks/update/${taskId}`,
  DELETE: (taskId) => `/api/tasks/delete/${taskId}`,
};

// Note endpoints
export const NOTE_ENDPOINTS = {
  CREATE: (projectId, userId) => `/api/notes/create/${projectId}/${userId}`,
  GET_ALL: '/api/notes/all',
  GET_PROJECT: (projectId) => `/api/notes/project/${projectId}`,
  UPDATE: (noteId) => `/api/notes/update/${noteId}`,
  DELETE: (noteId) => `/api/notes/delete/${noteId}`,
};

// File endpoints
export const FILE_ENDPOINTS = {
  UPLOAD: (projectId, userId) => `/api/files/upload/${projectId}/${userId}`,
  GET_ALL: '/api/files/all',
  GET_PROJECT: (projectId) => `/api/files/project/${projectId}`,
  DELETE: (fileId) => `/api/files/delete/${fileId}`,
};

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already registered.',
  REQUIRED_FIELDS: 'Please fill in all required fields.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  WEAK_PASSWORD: 'Password must be at least 6 characters.',
};
