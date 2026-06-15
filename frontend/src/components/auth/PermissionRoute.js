import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffHomePath } from '../../utils/staffConfig';

const PermissionRoute = ({ permission, children }) => {
  const { user, hasPermission } = useAuth();

  if (permission === 'staff') {
    const roleName = typeof user?.role === 'string' ? user.role : user?.role?.name;
    if (roleName !== 'admin' && roleName !== 'super_admin') {
      return <Navigate to={getStaffHomePath(user)} replace />;
    }
    return children;
  }

  if (!hasPermission(permission)) {
    return <Navigate to={getStaffHomePath(user)} replace />;
  }

  return children;
};

export default PermissionRoute;
