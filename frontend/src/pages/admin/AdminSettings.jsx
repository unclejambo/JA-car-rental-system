import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import '../../styles/admincss/admin-body.css';
import { HiCog8Tooth } from 'react-icons/hi2';
import React from 'react';

export default function AdminSettings() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="page-container">
        <title>Settings</title>
        <h1 className="font-pathway text-2xl header-req">
          <HiCog8Tooth style={{ verticalAlign: '-3px', marginRight: '5px' }} />
          SETTINGS
        </h1>
      </div>
    </>
  );
}
