import React from 'react';
import { Sidebar } from './Sidebar';
import '../styles/layout.css';

export const MainLayout = ({ children, pageTitle, showHeader = true }) => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {showHeader && (
          <header className="page-header">
            <div className="header-content">
              <h1 className="page-title">{pageTitle}</h1>
              <div className="header-right">
                <span className="date-time">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </header>
        )}
        <main className="page-body">
          {children}
        </main>
      </div>
    </div>
  );
};
