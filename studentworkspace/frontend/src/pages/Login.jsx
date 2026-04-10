import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login, error } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email || !formData.password) {
      setFormError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.response?.data?.message || 'Login failed. Please try again.');
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
            <p className="auth-subtitle">Manage your projects, tasks, notes, and contests all in one place.</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">📊</span>
              <span>Track your academic progress with detailed analytics</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📁</span>
              <span>Organize projects and collaborate seamlessly</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">✅</span>
              <span>Manage tasks with priority and deadline tracking</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🏆</span>
              <span>Compete in coding contests and win prizes</span>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-card">
          <h1>Welcome Back</h1>
          <h2>Sign in to your account</h2>

          {(formError || error) && (
            <div className="error-message">{formError || error}</div>
          )}

          <form onSubmit={handleSubmit}>
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
                placeholder="Your password"
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
              {loading ? '✨ Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <a href="/register">Create one now</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
