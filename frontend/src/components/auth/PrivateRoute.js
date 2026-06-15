import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading, token } = useAuth();

  // No session — go to login (don't show "offline" here; stale connection flags caused false offline UX)
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Verifying token: show spinner only until we have a user OR bootstrap finished without user (handled below)
  // If `user` is already set (e.g. just logged in), never block the app on background /auth/me refresh
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // JWT present but /auth/me failed (429, etc.) — still render page; Wallet/Profile show recovery UI
  return children;
};

export default PrivateRoute;

