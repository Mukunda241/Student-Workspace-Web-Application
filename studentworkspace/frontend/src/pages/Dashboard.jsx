import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MainLayout } from '../components/MainLayout';
import PomodoroTimer from '../components/PomodoroTimer';
import api from '../services/api';
import {
  IcoCheckSquare, IcoClock, IcoFolder, IcoTrophy,
  IcoBarChart, IcoPlus, IcoAlert
} from '../utils/icons';
import '../styles/dashboard.css';

/**
 * Backend now emits ISO-8601 with explicit +05:30 offset.
 * e.g. "2026-05-10T08:00:00+05:30" — new Date() parses this correctly.
 */
const fmtIST = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }) + ' IST';
  } catch { return String(d); }
};

const countdownIST = (d) => {
  if (!d) return { label: 'TBD', cls: '' };
  try {
    const diff = new Date(d) - Date.now();
    if (diff <= 0) return { label: '🔴 Live!', cls: 'live' };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h < 24) return { label: `${h}h ${m}m`, cls: h < 2 ? 'warn' : '' };
    return { label: `${Math.floor(h/24)}d ${h%24}h`, cls: '' };
  } catch { return { label: 'TBD', cls: '' }; }
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/dashboard/summary/${user.id}`)
      .then(r => { setData(r.data); setError(''); })
      .catch(e => {
        console.error('Dashboard error:', e);
        setError('Could not load dashboard data');
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  // ─── FIX: The API returns data.userStats.totalTasks etc (nested)
  // Previous code read data.totalTasks which is always undefined → shows 0
  const stats_raw   = data?.userStats || {};
  const urgentTasks = data?.urgentTasks || [];
  // Use API contests; fallback to localStorage cache from Contests page
  const apiContests = data?.upcomingContests || [];
  const cachedContests = React.useMemo(() => {
    try {
      const raw = localStorage.getItem('contestData');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, []);
  const contests = apiContests.length > 0 ? apiContests : cachedContests.slice(0, 5);

  const totalTasks      = stats_raw.totalTasks      ?? 0;
  const completedTasks  = stats_raw.completedTasks  ?? 0;
  const totalTimeSpent  = stats_raw.totalTimeSpent  ?? 0; // in minutes
  const ongoingProjects = stats_raw.ongoingProjects ?? 0;
  const completionRate  = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const isOverdue = (d) => d && new Date(d) < new Date();

  const statCards = [
    {
      Icon: IcoCheckSquare, cls: 'indigo',
      lbl: 'Total Tasks',
      val: totalTasks,
      sub: totalTasks === 0 ? 'No tasks yet' : `${totalTasks} created`,
    },
    {
      Icon: IcoBarChart, cls: 'green',
      lbl: 'Completed',
      val: completedTasks,
      sub: totalTasks === 0 ? 'Start by creating tasks' : `${completionRate}% completion rate`,
    },
    {
      Icon: IcoClock, cls: 'amber',
      lbl: 'Study Hours',
      val: `${(totalTimeSpent / 60).toFixed(1)}h`,
      sub: totalTimeSpent === 0 ? 'No time logged yet' : 'total time invested',
    },
    {
      Icon: IcoFolder, cls: 'blue',
      lbl: 'Active Projects',
      val: ongoingProjects,
      sub: ongoingProjects === 0 ? 'No active projects' : 'ongoing projects',
    },
  ];

  const quickActions = [
    { label: '+ New Project',   path: '/projects', Icon: IcoFolder },
    { label: '+ New Task',      path: '/tasks',    Icon: IcoCheckSquare },
    { label: '+ New Note',      path: '/notes',    Icon: IcoBarChart },
    { label: 'Browse Contests', path: '/contests', Icon: IcoTrophy },
  ];

  return (
    <MainLayout pageTitle="Dashboard">
      <div className="dashboard-wrap">

        {/* Welcome banner */}
        <div className="welcome-banner">
          <h2>Welcome back, {user?.name?.split(' ')[0] || 'Student'} 👋</h2>
          <p>Here's your academic overview for today</p>
        </div>

        {loading ? (
          <div className="loading-wrap"><div className="spinner" /> Loading dashboard…</div>
        ) : (
          <>
            {error && (
              <div className="error-msg" style={{ marginBottom:'1rem' }}>
                {error} — some stats may be unavailable.
              </div>
            )}

            {/* ── Stats row ── */}
            <div className="stats-row">
              {statCards.map(({ Icon, cls, lbl, val, sub }) => (
                <div key={lbl} className="stat-card card-hover">
                  <div className={`stat-icon-wrap ${cls}`}><Icon size={22} /></div>
                  <div>
                    <div className="stat-lbl">{lbl}</div>
                    <div className="stat-val">{val}</div>
                    <div className="stat-sub">{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Main grid ── */}
            <div className="dash-grid">

              {/* Urgent Tasks */}
              <div className="dash-card">
                <div className="card-hdr">
                  <h3><IcoAlert size={16} />Urgent Tasks</h3>
                  <button className="btn-view" onClick={() => navigate('/tasks')}>View All</button>
                </div>
                <div className="urgent-list">
                  {urgentTasks.length === 0 ? (
                    <div className="empty-card">
                      <span style={{ fontSize:'1.5rem' }}>🎉</span>
                      <span>No urgent tasks — you're all caught up!</span>
                    </div>
                  ) : urgentTasks.slice(0, 5).map(t => (
                    <div
                      key={t.id}
                      className={`urgent-item${isOverdue(t.deadline) ? ' overdue' : ''}`}
                      onClick={() => navigate('/tasks')}
                    >
                      <span className={`urgent-pri ${(t.priority || 'medium').toLowerCase()}`}>
                        {t.priority || 'MED'}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div className="urgent-title">{t.title}</div>
                        <div className="urgent-due">
                          {t.deadline
                            ? (isOverdue(t.deadline) ? '⚠ Overdue' : `Due ${t.deadline}`)
                            : 'No deadline'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Contests — FIX: times displayed in IST */}
              <div className="dash-card">
                <div className="card-hdr">
                  <h3><IcoTrophy size={16} />Upcoming Contests</h3>
                  <button className="btn-view" onClick={() => navigate('/contests')}>View All</button>
                </div>
                <div className="contests-list">
                  {contests.length === 0 ? (
                    <div className="empty-card">
                      <IcoTrophy size={28} style={{ color:'var(--sl-300)' }} />
                      <span>No upcoming contests found</span>
                    </div>
                  ) : contests.slice(0, 4).map(c => {
                    const displayName = c.contestName || c.name || 'Contest';
                    const { label, cls } = countdownIST(c.startTime);
                    return (
                      <div key={c.id} className="contest-item">
                        <div className="contest-hdr">
                          <div className="contest-name">{displayName}</div>
                          <span className="platform-chip">{c.platform}</span>
                        </div>
                        {cls === 'live'
                          ? <div className="contest-time-txt live-badge">{label}</div>
                          : <div className="contest-time-txt">Starts in: <strong>{label}</strong></div>
                        }
                        {c.startTime && (
                          <div style={{ fontSize:'.69rem', color:'var(--txt-3)' }}>
                            {fmtIST(c.startTime)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions + Pomodoro */}
              <div className="dash-card">
                <div className="card-hdr"><h3><IcoPlus size={16} />Quick Actions</h3></div>
                <div className="quick-list">
                  {quickActions.map(({ label, path, Icon }) => (
                    <button key={path} className="quick-btn" onClick={() => navigate(path)}>
                      <Icon size={15} />{label}
                    </button>
                  ))}
                </div>
                <div style={{ padding:'0 .75rem .875rem' }}>
                  <PomodoroTimer />
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
