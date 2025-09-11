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

export default function AdminSideBar({
  mobileOpen = false,
  onClose = () => {},
}) {
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const SidebarContent = (
    <div id="admin-sidebar" className="admin-sidebar" role="navigation">
      <NavLink to="/#" onClick={onClose}>
        <HiMiniSquaresPlus
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        DASHBOARD
      </NavLink>
      <hr />
      <NavLink to="/manage-booking" onClick={onClose}>
        <HiBookOpen style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        MANAGE BOOKINGS
      </NavLink>
      <hr />
      <NavLink to="/manage-car" onClick={onClose}>
        <HiTruck style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        MANAGE CARS
      </NavLink>
      <hr />
      <NavLink to="/manage-user" onClick={onClose}>
        <HiOutlineUserGroup
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        MANAGE USERS
      </NavLink>
      <hr />
      <NavLink to="/schedule" onClick={onClose}>
        <HiCalendar style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        SCHEDULE
      </NavLink>
      <hr />
      <NavLink to="/transaction-logs" onClick={onClose}>
        <HiDocumentCurrencyDollar
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        TRANSACTION LOGS
      </NavLink>
      <hr />
      <NavLink to="/report-analytics" onClick={onClose}>
        <HiChartBar style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        REPORT & ANALYTICS
      </NavLink>
      <hr />
      <NavLink to="/settings" onClick={onClose}>
        <HiCog8Tooth style={{ verticalAlign: '-3px', marginRight: '5px' }} />
        SETTINGS
      </NavLink>
      <hr />
      <NavLink to="/login" onClick={onClose}>
        <HiArrowLeftStartOnRectangle
          style={{ verticalAlign: '-3px', marginRight: '5px' }}
        />
        LOGOUT
      </NavLink>
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
