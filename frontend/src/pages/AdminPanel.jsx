// src/pages/AdminPanel.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function AdminPanel() {
  const { user, logout } = useAuth();

  const [tab, setTab]         = useState('users');
  const [users, setUsers]     = useState([]);
  const [roles, setRoles]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Modal state for create user
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', roleName: 'user' });

  // Modal state for create role
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });

  // Assign role state
  const [assignModal, setAssignModal] = useState(null); // { userId, currentRole }
  const [assignRoleId, setAssignRoleId] = useState('');

  // ─── Data fetching ───────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data.users);
    } catch (err) {
      setError('Failed to load users');
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const { data } = await api.get('/roles');
      setRoles(data.data.roles);
    } catch (err) {
      setError('Failed to load roles');
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([fetchUsers(), fetchRoles()]);
      setLoading(false);
    }
    init();
  }, [fetchUsers, fetchRoles]);

  function flash(msg, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(''), 4000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); }
  }

  // ─── Actions ─────────────────────────────────────────────────
  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${userId}`);
      flash(`User "${username}" deleted`);
      fetchUsers();
    } catch (err) {
      flash(err.response?.data?.message || 'Delete failed', true);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      await api.post('/users', newUser);
      flash('User created successfully');
      setShowCreateUser(false);
      setNewUser({ username: '', email: '', password: '', roleName: 'user' });
      fetchUsers();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create user', true);
    }
  }

  async function handleCreateRole(e) {
    e.preventDefault();
    try {
      await api.post('/roles', newRole);
      flash('Role created successfully');
      setShowCreateRole(false);
      setNewRole({ name: '', description: '' });
      fetchRoles();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create role', true);
    }
  }

  async function handleAssignRole(e) {
    e.preventDefault();
    try {
      await api.post('/roles/assign', { userId: assignModal.userId, roleId: parseInt(assignRoleId) });
      flash('Role assigned successfully');
      setAssignModal(null);
      fetchUsers();
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to assign role', true);
    }
  }

  // ─── Render ──────────────────────────────────────────────────
  if (loading) return <div className="loading-screen"><div className="spinner" /><p>Loading...</p></div>;

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="logo-text">IAM</span>
          <span className="logo-sub">Admin Panel</span>
        </div>
        <div className="topbar-actions">
          <Link to="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <button onClick={logout} className="btn btn-ghost btn-sm">Sign Out</button>
        </div>
      </header>

      <main className="page-content">
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Tab Navigation */}
        <div className="tab-bar">
          <button className={`tab ${tab === 'users' ? 'tab-active' : ''}`} onClick={() => setTab('users')}>
            Users <span className="tab-count">{users.length}</span>
          </button>
          <button className={`tab ${tab === 'roles' ? 'tab-active' : ''}`} onClick={() => setTab('roles')}>
            Roles <span className="tab-count">{roles.length}</span>
          </button>
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <section>
            <div className="section-header">
              <h2>User Management</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateUser(true)}>
                + New User
              </button>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th><th>Username</th><th>Email</th><th>Role</th>
                    <th>Status</th><th>Created</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={u.id === user.id ? 'row-self' : ''}>
                      <td>{u.id}</td>
                      <td><strong>{u.username}</strong>{u.id === user.id && <span className="badge badge-gray ml-1">you</span>}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role_name === 'admin' ? 'badge-red' : u.role_name === 'manager' ? 'badge-blue' : 'badge-green'}`}>
                          {u.role_name}
                        </span>
                      </td>
                      <td><span className={`badge ${u.is_active ? 'badge-green' : 'badge-gray'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="action-cell">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => { setAssignModal({ userId: u.id, username: u.username }); setAssignRoleId(''); }}
                        >
                          Assign Role
                        </button>
                        {u.id !== user.id && (
                          <button
                            className="btn btn-danger btn-xs"
                            onClick={() => handleDeleteUser(u.id, u.username)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Roles Tab */}
        {tab === 'roles' && (
          <section>
            <div className="section-header">
              <h2>Role Management</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateRole(true)}>
                + New Role
              </button>
            </div>
            <div className="card-grid">
              {roles.map((r) => (
                <div key={r.id} className="role-card">
                  <div className="role-card-header">
                    <strong>{r.name}</strong>
                    <span className="badge badge-gray">{r.permission_count} permissions</span>
                  </div>
                  <p className="role-desc">{r.description || 'No description'}</p>
                  <p className="role-meta">Created {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Create User Modal */}
      {showCreateUser && (
        <Modal title="Create New User" onClose={() => setShowCreateUser(false)}>
          <form onSubmit={handleCreateUser}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={newUser.username} onChange={e => setNewUser(p => ({...p, username: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={newUser.email} onChange={e => setNewUser(p => ({...p, email: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={newUser.password} onChange={e => setNewUser(p => ({...p, password: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={newUser.roleName} onChange={e => setNewUser(p => ({...p, roleName: e.target.value}))}>
                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateUser(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Role Modal */}
      {showCreateRole && (
        <Modal title="Create New Role" onClose={() => setShowCreateRole(false)}>
          <form onSubmit={handleCreateRole}>
            <div className="form-group">
              <label>Role Name (lowercase, underscores only)</label>
              <input type="text" value={newRole.name} onChange={e => setNewRole(p => ({...p, name: e.target.value}))} placeholder="e.g. auditor" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={newRole.description} onChange={e => setNewRole(p => ({...p, description: e.target.value}))} placeholder="Optional" />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateRole(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign Role Modal */}
      {assignModal && (
        <Modal title={`Assign Role — ${assignModal.username}`} onClose={() => setAssignModal(null)}>
          <form onSubmit={handleAssignRole}>
            <div className="form-group">
              <label>Select Role</label>
              <select value={assignRoleId} onChange={e => setAssignRoleId(e.target.value)} required>
                <option value="">— choose —</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Assign</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
