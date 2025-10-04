import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { HiBars3 } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import '../../styles/components/header.css';

function Header({ onMenuClick = null, isMenuOpen = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { isAuthenticated, user, userRole, logout } = useAuth();
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  const authenticatedFetch = useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );
  const API_BASE = getApiBase();

  const getUserDisplayName = () => {
    if (userRole === 'admin') {
      return 'ADMIN';
    }

    // Try multiple possible property names for the first name
    const firstName =
      user?.firstName ||
      user?.first_name ||
      user?.name?.split(' ')[0] ||
      user?.fullName?.split(' ')[0];

    return firstName;
  };

  // Fetch profile image when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !userRole) return;

    const fetchProfileImage = async () => {
      setIsLoadingImage(true);
      try {
        let endpoint = '';

        // Determine API endpoint based on user role
        if (userRole === 'admin' || userRole === 'staff') {
          endpoint = `${API_BASE}/api/admin-profile`;
        } else if (userRole === 'customer') {
          endpoint = `${API_BASE}/api/customer-profile`;
        } else if (userRole === 'driver') {
          endpoint = `${API_BASE}/api/driver-profile`;
        }

        if (!endpoint) return;

        const response = await authenticatedFetch(endpoint);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Handle different response structures
            const imageUrl =
              result.data.profile_img_url ||
              result.data.profileImageUrl ||
              result.data.profile_image_url ||
              null;

            if (imageUrl && imageUrl.trim() !== '') {
              setProfileImageUrl(imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile image:', error);
      } finally {
        setIsLoadingImage(false);
      }
    };

    fetchProfileImage();
  }, [isAuthenticated, userRole, authenticatedFetch, API_BASE]);

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
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="avatar-image"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <div
                className="avatar-placeholder"
                style={{ display: profileImageUrl ? 'none' : 'block' }}
              ></div>
              {isLoadingImage && (
                <div className="avatar-placeholder loading-avatar">
                  <div className="loading-spinner"></div>
                </div>
              )}
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
