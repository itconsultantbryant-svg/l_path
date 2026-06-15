import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getStaffHomePath } from '../../utils/staffConfig';

const StaffHomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getStaffHomePath(user)} replace />;
};

export default StaffHomeRedirect;
