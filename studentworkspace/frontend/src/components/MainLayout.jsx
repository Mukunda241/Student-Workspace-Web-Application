import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import '../styles/layout.css';

export const MainLayout = ({ children, pageTitle }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar onCollapse={setCollapsed} />
      <div className={`main-content${collapsed ? ' collapsed' : ''}`}>
        {pageTitle && (
          <header className="page-header">
            <div className="header-content">
              <h1 className="page-title">{pageTitle}</h1>
              <div className="header-right">
                <span className="header-date">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </header>
        )}
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};
