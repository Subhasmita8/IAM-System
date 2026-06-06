// src/pages/Dashboard.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_BADGE_CLASS = {
  admin:   'badge-red',
  manager: 'badge-blue',
  user:    'badge-green',
};

export default function Dashboard() {
  const { user, isAdmin, isManager, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="logo-text">IAM</span>
          <span className="logo-sub">System</span>
        </div>
        <div className="topbar-actions">
          {(isAdmin || isManager) && (
            <Link to="/admin" className="btn btn-secondary btn-sm">
              Admin Panel
            </Link>
          )}
          <button onClick={handleLogout} className="btn btn-ghost btn-sm">
            Sign Out
          </button>
        </div>
      </header>

      <main className="page-content">
        <div className="welcome-card">
          <div className="welcome-avatar">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="welcome-info">
            <h1>Welcome, {user?.username}</h1>
            <p>{user?.email}</p>
            <span className={`badge ${ROLE_BADGE_CLASS[user?.role_name] || 'badge-gray'}`}>
              {user?.role_name}
            </span>
          </div>
        </div>

        <div className="card-grid">
          <InfoCard
            title="Your Role"
            value={user?.role_name?.toUpperCase()}
            description="Your current system role"
            icon="🔑"
          />
          <InfoCard
            title="Account Status"
            value="Active"
            description="Your account is in good standing"
            icon="✅"
          />
          <InfoCard
            title="Last Login"
            value={user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'First visit'}
            description="Most recent session"
            icon="🕐"
          />
        </div>

        {/* Role-based feature sections */}
        <div className="section">
          <h2>Available Actions</h2>
          <div className="action-list">
            <div className="action-item">
              <span className="action-icon">👤</span>
              <div>
                <strong>View Profile</strong>
                <p>See and manage your personal information</p>
              </div>
              <span className="badge badge-green">All users</span>
            </div>

            {(isAdmin || isManager) && (
              <div className="action-item">
                <span className="action-icon">👥</span>
                <div>
                  <strong>User Management</strong>
                  <p>View and manage system users</p>
                </div>
                <span className="badge badge-blue">Manager+</span>
              </div>
            )}

            {isAdmin && (
              <>
                <div className="action-item">
                  <span className="action-icon">🛡️</span>
                  <div>
                    <strong>Role Management</strong>
                    <p>Create roles and assign permissions</p>
                  </div>
                  <span className="badge badge-red">Admin only</span>
                </div>
                <div className="action-item">
                  <span className="action-icon">🗑️</span>
                  <div>
                    <strong>Delete Users</strong>
                    <p>Permanently remove user accounts</p>
                  </div>
                  <span className="badge badge-red">Admin only</span>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ title, value, description, icon }) {
  return (
    <div className="info-card">
      <div className="info-card-icon">{icon}</div>
      <div>
        <h3 className="info-card-title">{title}</h3>
        <p className="info-card-value">{value}</p>
        <p className="info-card-desc">{description}</p>
      </div>
    </div>
  );
}
