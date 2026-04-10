import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import api from '../services/api';
import '../styles/dashboard.css';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (!user || !user.id) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        const response = await api.get(`/api/dashboard/summary/${user.id}`);
        setDashboardData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id) {
      fetchDashboardData();
    }
  }, [user]);

  // Calculate progress percentage
  const calculateProgress = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  // Format time in hours
  const formatHours = (minutes) => {
    return (minutes / 60).toFixed(1);
  };

  // Get urgency color for tasks
  const getUrgencyColor = (deadline) => {
    if (!deadline) return 'normal';
    const due = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 1) return 'urgent';
    if (daysUntil < 3) return 'warning';
    return 'normal';
  };

  // Format deadline display
  const formatDeadline = (deadline) => {
    if (!deadline) return 'No deadline';
    const due = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'Overdue';
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    return `Due in ${daysUntil} days`;
  };

  return (
    <MainLayout>
      <div className="dashboard-container page-container">
        {/* Welcome Banner */}
        <section className="welcome-banner">
          <h2>Welcome back, {user?.name}! 👋</h2>
          <p>Here's your academic dashboard at a glance</p>
        </section>

        {loading && (
          <div className="loading">
            <span>Loading your dashboard</span>
          </div>
        )}
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        {!loading && dashboardData && (
          <>
            {/* Stats Row */}
            <section className="stats-row">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Total Tasks</h3>
                  <p className="stat-value">{dashboardData.userStats?.totalTasks || 0}</p>
                  <span className="stat-label">Tasks created</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>Tasks Completed</h3>
                  <p className="stat-value">{dashboardData.userStats?.completedTasks || 0}</p>
                  <span className="stat-label">Completion rate: {dashboardData.userStats?.totalTasks > 0 ? calculateProgress(dashboardData.userStats?.completedTasks, dashboardData.userStats?.totalTasks) : 0}%</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <h3>Study Hours</h3>
                  <p className="stat-value">{formatHours(dashboardData.userStats?.totalTimeSpent || 0)}h</p>
                  <span className="stat-label">Total time invested</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📁</div>
                <div className="stat-content">
                  <h3>Ongoing Projects</h3>
                  <p className="stat-value">{dashboardData.userStats?.ongoingProjects || 0}</p>
                  <span className="stat-label">Active projects</span>
                </div>
              </div>
            </section>

            {/* Main Content Grid */}
            <section className="dashboard-grid">
              {/* Urgent Tasks Card */}
              <div className="dashboard-card large">
                <div className="card-header">
                  <h3>📅 Urgent Tasks</h3>
                  <button onClick={() => navigate('/tasks')} className="btn-view">View All</button>
                </div>
                <div className="tasks-list">
                  {dashboardData.urgentTasks && dashboardData.urgentTasks.length > 0 ? (
                    dashboardData.urgentTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-item urgency-${getUrgencyColor(task.deadline)}`}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                      >
                        <div className="task-priority">
                          <span className={`priority-badge ${task.priority?.toLowerCase() || 'normal'}`}>
                            {task.priority || 'Normal'}
                          </span>
                        </div>
                        <div className="task-details">
                          <h4>{task.title}</h4>
                          <span className="due-date">{formatDeadline(task.deadline)}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="empty-message">No urgent tasks - Great job! 🎉</p>
                  )}
                </div>
              </div>

              {/* Upcoming Contests Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🏆 Upcoming Contests</h3>
                  <button onClick={() => navigate('/contests')} className="btn-view">View All</button>
                </div>
                <div className="contests-list">
                  {dashboardData.upcomingContests && dashboardData.upcomingContests.length > 0 ? (
                    dashboardData.upcomingContests.map((contest) => {
                      const startTime = new Date(contest.startTime);
                      const now = new Date();
                      const timeUntil = Math.ceil((startTime - now) / (1000 * 60));
                      const hours = Math.floor(timeUntil / 60);
                      const minutes = timeUntil % 60;

                      return (
                        <div
                          key={contest.id}
                          className="contest-item"
                        >
                          <div className="contest-header">
                            <h4>{contest.contestName}</h4>
                            <span className={`platform-badge ${contest.platform?.toLowerCase().replace('.', '-')}`}>
                              {contest.platform}
                            </span>
                          </div>
                          <div className="contest-countdown">
                            {timeUntil > 0 ? (
                              <p>Starts in: <strong>{hours}h {minutes}m</strong></p>
                            ) : (
                              <p className="live">🔴 LIVE NOW</p>
                            )}
                          </div>
                          <span className="contest-time">{new Date(contest.startTime).toLocaleDateString()} {new Date(contest.startTime).toLocaleTimeString()}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="empty-message">No contests this week</p>
                  )}
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>⚡ Quick Actions</h3>
                </div>
                <div className="quick-actions">
                  <button
                    onClick={() => navigate('/projects')}
                    className="quick-action-btn"
                  >
                    ➕ New Project
                  </button>
                  <button
                    onClick={() => navigate('/tasks')}
                    className="quick-action-btn"
                  >
                    ➕ New Task
                  </button>
                  <button
                    onClick={() => navigate('/notes')}
                    className="quick-action-btn"
                  >
                    ➕ New Note
                  </button>
                  <button
                    onClick={() => navigate('/contests')}
                    className="quick-action-btn"
                  >
                    🏆 Browse Contests
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {!loading && !dashboardData && !error && (
          <div className="empty-state">
            <h3>Welcome to Student Workspace!</h3>
            <p>Start by creating a project to organize your academic work.</p>
            <button onClick={() => navigate('/projects')} className="btn-primary">
              Create Your First Project
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
