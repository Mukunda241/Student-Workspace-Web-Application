import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

export const Register = () => {
  const navigate = useNavigate();
  const { register, error } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setFormError('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await register({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        {/* Left Side - Branding */}
        <div className="auth-left">
          <div className="auth-branding">
            <div className="auth-logo">🎓</div>
            <h1 className="auth-title">Student Workspace</h1>
            <p className="auth-subtitle">Your complete academic management platform.</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">✨</span>
              <span>Easy and secure account setup</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🔒</span>
              <span>Your data is protected with encryption</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">⚡</span>
              <span>Get started in just a few seconds</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🎯</span>
              <span>Join a community of motivated students</span>
            </div>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="auth-card">
          <h1>Get Started</h1>
          <h2>Create your free account</h2>

          {(formError || error) && (
            <div className="error-message">{formError || error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                disabled={loading}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? '✨ Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <a href="/login">Sign in here</a>
          </p>
        </div>
      </div>
    </div>
  );
};
