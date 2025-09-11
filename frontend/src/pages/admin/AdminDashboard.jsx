import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { Link } from 'react-router-dom';
import '../../styles/admincss/admindashboard.css';
import React from 'react';

function AdminDashboard() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <br />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="page-container dashboard-container">
        <title>Dashboard</title>
        <div className="div-1">
          <div className="topmost-1">
            <h1 className="font-pathway">MOST RENTED CAR</h1>
            <h3 className="font-pathway">MARCH</h3>
            <div className="dashboard-card-content">
              <img
                src="/nissan.png"
                alt="nissan"
                className="dashboard-card-image"
              />
              <div>
                <h4 className="font-pathway text-[30px] m-0">
                  Nissan
                  <br />
                  Terra
                </h4>
                <h5 className="font-pathway text-[16px] mt-1 mb-0">SUV</h5>
              </div>
            </div>
            <h3 className="font-pathway total">TOTAL BOOKINGS: 4</h3>
            <Link to="/report-analytics" className="more-details">
              More Details
            </Link>
          </div>
          <div className="topmost-2">
            <h1 className="font-pathway">
              TOP <br /> COSTUMER
            </h1>
            <h2 className="font-pathway text-[80px]">JASPEN GERME</h2>
            <h3 className="font-pathway total">TOTAL BOOKINGS: 4</h3>
            <Link to="/report-analytics" className="more-details">
              More Details
            </Link>
          </div>
        </div>
        <br />
        <div className="div-2">
          <div className="topmost-1">
            <h1 className="font-pathway">SCHEDULE</h1>
            <h3 className="font-pathway">TODAY</h3>
            <Link to="/schedule" className="more-details">
              More Details
            </Link>
          </div>
          <div className="topmost-2">
            <h1 className="font-pathway">AVAILABLE CARS</h1>
            <h3 className="font-pathway">TODAY</h3>
            <Link to="/manage-car" className="more-details">
              More Details
            </Link>
          </div>
        </div>
        <br />
        <div className="div-3">
          <div className="request-1">
            <h1 className="font-pathway">BOOKING REQUESTS</h1>
            <hr />
            <p className="font-pathway text-[24px] no-req">
              No booking requests.
            </p>
            <Link to="/manage-booking" className="more-details-req">
              More Details
            </Link>
          </div>
          <br />
          <div className="request-2">
            <h1 className="font-pathway">EXTENSION/CANCELLATION REQUESTS</h1>
            <hr />
            <p className="font-pathway text-[24px] no-req">
              No extension/cancellation requests.
            </p>
            <Link to="/manage-booking" className="more-details-req">
              More Details
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
