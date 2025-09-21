import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/index.css';
import App from './App.jsx';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookingPage from './pages/admin/AdminBookingPage';
import AdminCarPage from './pages/admin/AdminCarPage';
import AdminManageUser from './pages/admin/AdminManageUser';
import AdminSchedulePage from './pages/admin/AdminSchedulePage';
import AdminTransactionPage from './pages/admin/AdminTransactionPage';
import AdminReportAnalytics from './pages/admin/AdminReportAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import RegisterPage from './pages/RegisterPage.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './ui/components/modal/ProtectedRoute.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/home" element={<HomePage />} />

          {/* Protected Admin Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admindashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-booking"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminBookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-car"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminCarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-user"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminManageUser />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-logs"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminTransactionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report-analytics"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminReportAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-dashboard"
            element={
              <ProtectedRoute requiredRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
