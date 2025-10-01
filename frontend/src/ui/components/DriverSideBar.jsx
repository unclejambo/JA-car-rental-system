import React from 'react';
import { NavLink } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import '../../styles/admincss/adminsidebar.css';
import { HiCalendar } from 'react-icons/hi2';
import { HiChartBar } from 'react-icons/hi2';
import { HiBookOpen } from 'react-icons/hi2';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { HiCog8Tooth } from 'react-icons/hi2';
import { HiDocumentCurrencyDollar } from 'react-icons/hi2';
import { HiTruck } from 'react-icons/hi2';
import { HiMiniSquaresPlus } from 'react-icons/hi2';
import { HiArrowLeftStartOnRectangle } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';

export default function DriverSideBar({
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
    <div id="admin-sidebar" className="admin-sidebar" role="navigation">
      <NavLink to="/driver-schedule" onClick={onClose}>
        <HiCalendar style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        SCHEDULE
      </NavLink>
      <hr />
      <NavLink to="/driver-settings" onClick={onClose}>
        <HiCog8Tooth style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        SETTINGS
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
