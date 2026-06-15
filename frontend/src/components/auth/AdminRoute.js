import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffHomePath } from '../../utils/staffConfig';

const AdminRoute = ({ children }) => {
  const { user, loading, isStaff, token, fetchUser } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Do not redirect to /dashboard when user is null — isAdmin() would be false and bounce real admins
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Couldn&apos;t load your account</h2>
          <p className="text-sm text-gray-600 mb-4">
            The server may be busy. Tap try again — this is not an internet error on your side.
          </p>
          <button
            type="button"
            onClick={() => fetchUser({ silent: true })}
            className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!isStaff()) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

