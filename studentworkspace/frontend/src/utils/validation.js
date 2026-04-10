// Email validation
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// Required field validation
export const isFieldEmpty = (value) => {
  return !value || value.trim() === '';
};

// Form data validation
export const validateLoginForm = (formData) => {
  const errors = {};

  if (isFieldEmpty(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (isFieldEmpty(formData.password)) {
    errors.password = 'Password is required';
  }

  return errors;
};

export const validateRegisterForm = (formData) => {
  const errors = {};

  if (isFieldEmpty(formData.firstName)) {
    errors.firstName = 'First name is required';
  }

  if (isFieldEmpty(formData.lastName)) {
    errors.lastName = 'Last name is required';
  }

  if (isFieldEmpty(formData.email)) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (isFieldEmpty(formData.password)) {
    errors.password = 'Password is required';
  } else if (!isValidPassword(formData.password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
};

// Project validation
export const validateProjectForm = (formData) => {
  const errors = {};

  if (isFieldEmpty(formData.title)) {
    errors.title = 'Project title is required';
  }

  return errors;
};

// Task validation
export const validateTaskForm = (formData) => {
  const errors = {};

  if (isFieldEmpty(formData.title)) {
    errors.title = 'Task title is required';
  }

  return errors;
};
