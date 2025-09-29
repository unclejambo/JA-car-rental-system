import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth.js';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const location = useLocation();
  
  console.log('ProtectedRoute check:', { 
    isAuthenticated, 
    userRole, 
    isLoading, 
    requiredRole, 
    location: location.pathname 
  });

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated, redirect to login with the current location
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and user doesn't have it
  if (requiredRole && userRole !== requiredRole) {
    // Special case: staff should have same access as admin
    if (requiredRole === 'admin' && userRole === 'staff') {
      // Staff can access admin routes, so continue
      return children;
    }
    
    // Redirect based on user's actual role
    const roleRedirects = {
      admin: '/admindashboard',
      staff: '/admindashboard', // Staff uses same dashboard as admin
      customer: '/dashboard',
      driver: '/driverdashboard'
    };
    
    const redirectPath = roleRedirects[userRole] || '/login';
    return <Navigate to={redirectPath} replace />;
  }

  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;