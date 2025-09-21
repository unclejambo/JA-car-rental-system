import { Link } from 'react-router-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { HiBars3 } from 'react-icons/hi2';
import '../../styles/components/header.css';

function Header({ onMenuClick = null, isMenuOpen = false }) {
  const isMobile = useMediaQuery('(max-width: 1024px)');

  return (
    <header className="app-header">
      <div className="header-content">
        {isMobile && (
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
        <Link to="/" className="logo-link" aria-label="J&A Car Rental - Home">
          <span className="logo-main-text">J&A</span>
          <span className="logo-sub-text">CAR RENTAL</span>
        </Link>
      </div>
    </header>
  );
}

export default Header;
