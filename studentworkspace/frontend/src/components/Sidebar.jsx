import React, { useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  IcoDashboard, IcoFolder, IcoCheckSquare, IcoFileText,
  IcoDatabase, IcoTrophy, IcoLogOut, IcoGraduation,
  IcoChevronLeft, IcoChevronRight
} from '../utils/icons';
import '../styles/sidebar.css';

export const Sidebar = ({ onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapse?.(next);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const nav = [
    { path: '/dashboard', label: 'Dashboard', Icon: IcoDashboard },
    { path: '/projects',  label: 'Projects',  Icon: IcoFolder },
    { path: '/tasks',     label: 'Tasks',     Icon: IcoCheckSquare },
    { path: '/notes',     label: 'Notes',     Icon: IcoFileText },
    { path: '/files',     label: 'Files',     Icon: IcoDatabase },
    { path: '/contests',  label: 'Contests',  Icon: IcoTrophy },
  ];

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={toggle}>
          {collapsed ? <IcoChevronRight size={15} /> : <IcoChevronLeft size={15} />}
        </button>
        <div className="sidebar-brand">
          <div className="brand-icon"><IcoGraduation size={16} /></div>
          <span className="sidebar-title">Workspace</span>
        </div>
      </div>

      <div className="user-profile">
        <div className="user-avatar">{user?.name?.charAt(0).toUpperCase() || 'U'}</div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'Student'}</div>
          <div className="user-email">{user?.email || ''}</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        {nav.map(({ path, label, Icon }) => (
          <button
            key={path}
            className={`menu-item${location.pathname === path ? ' active' : ''}`}
            onClick={() => navigate(path)}
            title={collapsed ? label : undefined}
          >
            <span className="menu-icon"><Icon size={18} /></span>
            <span className="menu-label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <IcoLogOut size={17} />
          <span className="logout-label">Logout</span>
        </button>
      </div>
    </div>
  );
};
