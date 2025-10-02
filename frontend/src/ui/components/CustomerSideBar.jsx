import React from 'react';
import { NavLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import '../../styles/admincss/adminsidebar.css';
import {
  HiCalendar,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUserCircle,
} from 'react-icons/hi2';
import { HiBookOpen } from 'react-icons/hi2';
import { HiCog8Tooth } from 'react-icons/hi2';
import { HiTruck } from 'react-icons/hi2';
import { HiMiniSquaresPlus } from 'react-icons/hi2';
import { HiArrowLeftStartOnRectangle } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';

export default function CustomerSideBar({
  mobileOpen = false,
  onClose = () => {},
}) {
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const { logout } = useAuth();

  const handleLogout = () => {
    onClose();
    logout();
  };

  const SidebarContent = (
    <div id="customer-sidebar" className="admin-sidebar" role="navigation">
      <NavLink to="/customer-dashboard" onClick={onClose}>
        <HiMiniSquaresPlus
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        DASHBOARD
      </NavLink>
      <hr />
      <NavLink to="/customer-cars" onClick={onClose}>
        <HiTruck style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        CARS
      </NavLink>
      <hr />
      <NavLink to="/customer-bookings" onClick={onClose}>
        <HiBookOpen style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        MY BOOKINGS
      </NavLink>
      <hr />
      <NavLink to="/customer-history" onClick={onClose}>
        <HiOutlineClipboardDocumentCheck
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        BOOKING HISTORY
      </NavLink>
      <hr />
      <NavLink to="/customer-schedule" onClick={onClose}>
        <HiCalendar style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        SCHEDULE
      </NavLink>
      <hr />
      <NavLink to="/customer-account" onClick={onClose}>
        <HiCog8Tooth style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        ACCOUNT SETTINGS
      </NavLink>
      <hr />
      <div className="logout-item" onClick={handleLogout}>
        <HiArrowLeftStartOnRectangle
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        LOGOUT
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        aria-labelledby="admin-sidebar-title"
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        anchor="left"
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          sx: {
            width: { xs: '65vw', sm: 280 },
            maxWidth: 300,
            top: '70px',
            height: 'calc(100% - 70px)',
          },
        }}
      >
        {SidebarContent}
      </Drawer>
    );
  }

  // Desktop: show the fixed sidebar as before
  return SidebarContent;
}
