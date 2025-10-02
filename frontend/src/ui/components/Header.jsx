import { Link } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { HiBars3 } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import '../../styles/components/header.css';

function Header({ onMenuClick = null, isMenuOpen = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { isAuthenticated, user, userRole } = useAuth();

  const getUserDisplayName = () => {
    // Only show 'ADMIN' for users with role === 'admin'
    // Staff members and other users should show their first name
    if (userRole === 'admin') {
      return 'ADMIN';
    }

    // For staff, customers, drivers - show their first name
    // Try multiple possible property names for the first name
    const firstName =
      user?.firstName ||
      user?.first_name ||
      user?.name?.split(' ')[0] ||
      user?.fullName?.split(' ')[0];

    return firstName || 'User';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {isMobile && isAuthenticated && (
          <button
            className="menu-button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            onClick={onMenuClick}
            disabled={!onMenuClick}
          >
            <HiBars3 size={28} />
          </button>
        )}
        <Link
          to={isAuthenticated ? '/' : '/home'}
          className="logo-link"
          aria-label="J&A Car Rental - Home"
        >
          <span className="logo-main-text">J&A</span>
          <span className="logo-sub-text">CAR RENTAL</span>
        </Link>

        {isAuthenticated && (
          <div className="user-profile-panel">
            <div className="profile-avatar">
              <div className="avatar-placeholder"></div>
            </div>
            <span
              className="profile-name"
              style={{
                fontFamily: 'Pathway Gothic One, sans-serif',
                fontSize: '1rem',
              }}
            >
              {getUserDisplayName()}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
