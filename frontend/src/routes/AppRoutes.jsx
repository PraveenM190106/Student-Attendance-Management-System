import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import StudentAuth from '../pages/StudentAuth';
import DeptAuth from '../pages/DeptAuth';
import AdminAuth from '../pages/AdminAuth';
import AdminDashboard from '../pages/AdminDashboard';
import StudentDashboard from '../pages/StudentDashboard';
import DeptDashboard from '../pages/DeptDashboard';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/student-auth" element={<StudentAuth />} />
      <Route path="/dept-auth" element={<DeptAuth />} />
      <Route path="/admin-auth" element={<AdminAuth />} />

      <Route 
        path="/admin-dashboard" 
        element={
          <ProtectedRoute allowedRole="ROLE_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student-dashboard" 
        element={
          <ProtectedRoute allowedRole="ROLE_STUDENT">
            <StudentDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dept-dashboard" 
        element={
          <ProtectedRoute allowedRole="ROLE_DEPARTMENT">
            <DeptDashboard />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
