import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import AttackSimulation from './pages/AttackSimulation';
import SecurityDashboard from './pages/SecurityDashboard';
import AuditLogs from './pages/AuditLogs';
import Alerts from './pages/Alerts';
import AIDetection from './pages/AIDetection';
import UserManagement from './pages/UserManagement';

// Guard component checking login state and role permissions
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Main Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/patients" element={
        <ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
          <Layout><Patients /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/simulation" element={
        <ProtectedRoute allowedRoles={['Admin', 'Doctor', 'Receptionist']}>
          <Layout><AttackSimulation /></Layout>
        </ProtectedRoute>
      } />

      {/* Admin Protected Routes */}
      <Route path="/security" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><SecurityDashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/audit" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><AuditLogs /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/alerts" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><Alerts /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/ai-detection" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><AIDetection /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute allowedRoles={['Admin']}>
          <Layout><UserManagement /></Layout>
        </ProtectedRoute>
      } />

      {/* Fallback Catch-All Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
