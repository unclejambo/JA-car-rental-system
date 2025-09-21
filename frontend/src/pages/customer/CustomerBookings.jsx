import React from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';

function CustomerBookings() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <br />
      <CustomerSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="page-container dashboard-container">
        <title>Bookings</title>
        {/* Add bookings content here (list, filters, details, etc.) */}
      </div>
    </>
  );
}

export default CustomerBookings;
