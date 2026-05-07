import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import { MdAccessTime, MdEmojiEvents, MdSchedule, MdBell, MdNotifications } from 'react-icons/md';
import { API_BASE } from '../utils/constants';
import '../styles/contests.css';

const Contests = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // State Management
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [nextContest, setNextContest] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Countdown timer state
  const [countdownTime, setCountdownTime] = useState(null);
  const countdownIntervalRef = useRef(null);

  // Reminders state
  const [userReminders, setUserReminders] = useState(new Set());

  // Fetch contests
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchContests(),
        fetchPlatforms(),
        fetchUserReminders(),
        fetchNextContest()
      ]);
      setError(null);
    } catch (err) {
      setError('Failed to load contest data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchContests = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contests`);

      if (!response.ok) throw new Error('Failed to fetch contests');
      const data = await response.json();
      setContests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching contests:', err);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contests/platforms`);

      if (!response.ok) throw new Error('Failed to fetch platforms');
      const data = await response.json();
      setPlatforms(Array.isArray(data) ? data : []);
      
      // Initially select all platforms
      setSelectedPlatforms(new Set(data));
    } catch (err) {
      console.error('Error fetching platforms:', err);
    }
  };

  const fetchNextContest = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/contests/next`);

      if (response.ok) {
        const data = await response.json();
        setNextContest(data);
      }
    } catch (err) {
      console.error('Error fetching next contest:', err);
    }
  };

  const fetchUserReminders = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_BASE}/api/contests/reminders/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch reminders');
      const data = await response.json();
      const reminderIds = new Set(data.map(r => r.id));
      setUserReminders(reminderIds);
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (nextContest && nextContest.startTime) {
      const calculateCountdown = () => {
        const now = new Date();
        const startTime = new Date(nextContest.startTime);
        const timeDiff = startTime - now;

        if (timeDiff <= 0) {
          setCountdownTime('Contest has started!');
          setNextContest(null);
          return;
        }

        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

        setCountdownTime(`${hours}h ${minutes}m ${seconds}s`);
      };

      calculateCountdown();
      countdownIntervalRef.current = setInterval(calculateCountdown, 1000);

      return () => {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      };
    }
  }, [nextContest]);

  // Filter contests based on selected platforms
  useEffect(() => {
    const filtered = contests.filter(contest => 
      selectedPlatforms.has(contest.platform)
    );
    setFilteredContests(filtered);
  }, [contests, selectedPlatforms]);

  // Handle platform checkbox change
  const handlePlatformToggle = (platform) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(platform)) {
      newSelected.delete(platform);
    } else {
      newSelected.add(platform);
    }
    setSelectedPlatforms(newSelected);
  };

  // Toggle reminder
  const handleToggleReminder = async (contestId) => {
    if (!user) {
      setError('Please log in to set reminders');
      return;
    }

    try {
      const isReminded = userReminders.has(contestId);

      if (isReminded) {
        // Remove reminder
        const response = await fetch(`${API_BASE}/api/contests/${contestId}/remind`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to remove reminder');

        const newReminders = new Set(userReminders);
        newReminders.delete(contestId);
        setUserReminders(newReminders);
        setSuccessMessage('Reminder removed!');
      } else {
        // Set reminder
        const response = await fetch(`${API_BASE}/api/contests/${contestId}/remind/${user.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) throw new Error('Failed to set reminder');

        const newReminders = new Set(userReminders);
        newReminders.add(contestId);
        setUserReminders(newReminders);
        setSuccessMessage('Reminder set for 1 hour before contest!');
      }

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update reminder');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  // Format date and time
  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get days until contest
  const getDaysUntilContest = (dateTimeString) => {
    const now = new Date();
    const contestDate = new Date(dateTimeString);
    const timeDiff = contestDate - now;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) return 'Past';
    if (daysRemaining === 0) return 'Today';
    if (daysRemaining === 1) return 'Tomorrow';
    return `${daysRemaining}d`;
  };

  // Get platform logo
  const getPlatformLogo = (platform) => {
    const logos = {
      'LeetCode': '🔤',
      'Codeforces': '⚽',
      'HackerRank': '🎯',
      'CodeChef': '👨‍🍳',
      'AtCoder': '🎌',
      'TopCoder': '🏆'
    };
    return logos[platform] || '📋';
  };

  if (loading) {
    return (
      <div className="contests-container">
        <nav className="navbar">
          <div className="nav-content">
            <h1 className="app-title">StudentWorkspace</h1>
            <div className="nav-links">
              <a href="/dashboard" className="nav-link">Dashboard</a>
              <a href="/projects" className="nav-link">Projects</a>
              <a href="/tasks" className="nav-link">Tasks</a>
              <a href="/notes" className="nav-link">Notes</a>
              <a href="/files" className="nav-link">Files</a>
              <a href="/contests" className="nav-link active">Contests</a>
            </div>
            <div className="nav-right">
              <span className="user-info">{user?.email}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          </div>
        </nav>
        <div className="loading">Loading contests...</div>
      </div>
    );
  }

  return (
    <div className="contests-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-content">
          <h1 className="app-title">StudentWorkspace</h1>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/projects" className="nav-link">Projects</a>
            <a href="/tasks" className="nav-link">Tasks</a>
            <a href="/notes" className="nav-link">Notes</a>
            <a href="/files" className="nav-link">Files</a>
            <a href="/contests" className="nav-link active">Contests</a>
          </div>
          <div className="nav-right">
            <span className="user-info">{user?.email}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="contests-content">
        {/* Messages */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError('')}>×</button>
          </div>
        )}
        {successMessage && (
          <div className="success-message">
            <span>{successMessage}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="contests-header">
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 6px 16px rgba(217, 119, 6, 0.3)'
              }}>
                <MdEmojiEvents size={40} style={{color: '#fef3c7'}} />
              </div>
              <h1>Contest Center</h1>
            </div>
            <p>The Pulse of the Competitive Programmer's Life</p>
          </div>
        </div>

        {/* Next Contest Countdown */}
        {nextContest && (
          <div className="countdown-card">
            <div className="countdown-header">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #b45309 0%, #92400e 100%)',
                marginRight: '0.75rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(180, 83, 9, 0.25)'
              }}>
                <MdAccessTime size={32} style={{color: '#fcd34d'}} />
              </div>
              <h3>Next Contest</h3>
            </div>
            <div className="countdown-content">
              <div className="contest-info">
                <div className="platform-badge">{getPlatformLogo(nextContest.platform)} {nextContest.platform}</div>
                <h4>{nextContest.contestName}</h4>
                <p className="contest-time">{formatDateTime(nextContest.startTime)}</p>
              </div>
              <div className="countdown-timer">
                <span className="timer-value">{countdownTime}</span>
                <p className="timer-label">Time Remaining</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="filters-section">
          <h3>Platform Filters</h3>
          <div className="filter-checkboxes">
            {platforms.map(platform => (
              <label key={platform} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectedPlatforms.has(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                <span className="checkbox-text">{getPlatformLogo(platform)} {platform}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="contests-timeline">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}>
              <MdSchedule size={28} style={{color: '#e9d5ff'}} />
            </div>
            <h3>Timeline</h3>
          </div>
          
          {filteredContests.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming contests found in the selected platforms.</p>
            </div>
          ) : (
            <div className="timeline-container">
              {filteredContests.map((contest, index) => (
                <div key={contest.id} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="contest-card">
                    <div className="card-header">
                      <div className="card-title-section">
                        <span className="platform-logo">{getPlatformLogo(contest.platform)}</span>
                        <h4 className="contest-title">{contest.contestName}</h4>
                      </div>
                      <span className="days-badge">{getDaysUntilContest(contest.startTime)}</span>
                    </div>

                    <div className="card-body">
                      <div className="info-row">
                        <span className="info-label">Platform:</span>
                        <span className="info-value">{contest.platform}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Starts:</span>
                        <span className="info-value">{formatDateTime(contest.startTime)}</span>
                      </div>
                      {contest.endTime && (
                        <div className="info-row">
                          <span className="info-label">Ends:</span>
                          <span className="info-value">{formatDateTime(contest.endTime)}</span>
                        </div>
                      )}
                    </div>

                    <div className="card-actions">
                      <a 
                        href={contest.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-register"
                      >
                        Register →
                      </a>
                      <button 
                        className={`btn-reminder ${userReminders.has(contest.id) ? 'reminded' : ''}`}
                        onClick={() => handleToggleReminder(contest.id)}
                        title={userReminders.has(contest.id) ? 'Remove reminder' : 'Remind me 1h before'}
                      >
                        {userReminders.has(contest.id) ? '🔔 Reminded' : '🔕 Remind Me'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contests;
