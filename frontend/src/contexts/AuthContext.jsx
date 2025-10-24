import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext.js';
import { getApiBase } from '../utils/api.js';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE = getApiBase();

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userInfo');

    setIsAuthenticated(false);
    setUserRole(null);
    setUser(null);

    navigate('/login');
  }, [navigate]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const storedRole = localStorage.getItem('userRole');
      const storedUser = localStorage.getItem('userInfo');

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Validate token with backend
      const response = await fetch(`${API_BASE}/api/auth/validate`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setUserRole(storedRole);
        setUser(storedUser ? JSON.parse(storedUser) : null);
      } else {
        // Token is invalid or expired
        logout();
      }
    } catch (error) {
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE, logout]);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up periodic token validation (every 5 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const validateInterval = setInterval(
      () => {
        checkAuthStatus();
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(validateInterval);
  }, [isAuthenticated, checkAuthStatus]);

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'authToken' && !e.newValue && isAuthenticated) {
        // Token was removed in another tab
        setIsAuthenticated(false);
        setUserRole(null);
        setUser(null);
        navigate('/login');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isAuthenticated, navigate]);

  const login = (token, role, userInfo) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userRole', role);
    localStorage.setItem('userInfo', JSON.stringify(userInfo));

    setIsAuthenticated(true);
    setUserRole(role);
    setUser(userInfo);
  };

  const value = {
    isAuthenticated,
    user,
    userRole,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
