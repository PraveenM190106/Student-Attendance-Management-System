import React from 'react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children, allowedRole }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    if (!user || !user.token) {
      return <Navigate to="/" replace />;
    }

    if (allowedRole && String(user.role).toUpperCase() !== allowedRole.toUpperCase()) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/" replace />;
  }
};
