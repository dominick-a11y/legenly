import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Admin from './pages/Admin.jsx';
import Community from './pages/Community.jsx';
import Waitlist from './pages/Waitlist.jsx';
import LeadForm from './pages/LeadForm.jsx';
import Bundle from './pages/Bundle.jsx';
import Webinar from './pages/Webinar.jsx';
import Pipeline from './pages/Pipeline.jsx';

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <Admin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Community />
          </ProtectedRoute>
        }
      />
      <Route path="/register" element={<Register />} />
      <Route path="/waitlist" element={<Waitlist />} />
      <Route path="/get-quote" element={<LeadForm />} />
      <Route path="/bundle" element={<Bundle />} />
      <Route path="/webinar" element={<Webinar />} />
      <Route
        path="/pipeline"
        element={
          <ProtectedRoute adminOnly>
            <Pipeline />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
