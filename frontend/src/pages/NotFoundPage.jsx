import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, userRole } = useAuth();

  // Auto-redirect to the appropriate dashboard based on user role
  useEffect(() => {
    if (isAuthenticated && userRole) {
      switch (userRole) {
        case 'admin':
        case 'staff':
          navigate('/admindashboard', { replace: true });
          break;
        case 'customer':
          navigate('/customer-dashboard', { replace: true });
          break;
        case 'driver':
          navigate('/driver-schedule', { replace: true });
          break;
        default:
          navigate('/home', { replace: true });
      }
    } else {
      // Not authenticated, go to landing page
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, userRole, navigate]);

  // Return null - no UI needed as we're immediately redirecting
  return null;
}
