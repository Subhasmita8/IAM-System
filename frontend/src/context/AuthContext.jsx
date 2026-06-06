// src/context/AuthContext.jsx
// Global authentication state — wraps the entire app

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { clearAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // True during initial session check

  // ─── On mount: try to restore session via refresh token cookie ───
  useEffect(() => {
    async function restoreSession() {
      try {
        // This will trigger the refresh-token interceptor if needed
        const me = await authService.getMe();
        setUser(me);
      } catch {
        // No valid session — user must log in
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // ─── Listen for forced logout events (from axios interceptor) ──
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      clearAccessToken();
    };
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    const userData = await authService.login(credentials);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (credentials) => {
    const userData = await authService.register(credentials);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  // ─── Role helpers ────────────────────────────────────────────
  const isAdmin   = user?.role_name === 'admin';
  const isManager = user?.role_name === 'manager';
  const hasRole   = (role) => user?.role_name === role;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin,
    isManager,
    hasRole,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook for consuming auth context
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
