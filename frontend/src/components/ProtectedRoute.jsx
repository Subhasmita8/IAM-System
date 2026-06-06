// src/components/ProtectedRoute.jsx
// Wraps routes that require authentication or a specific role

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 * @param {string[]} roles - Optional array of allowed roles. If empty, just requires auth.
 */
export default function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.some(hasRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
