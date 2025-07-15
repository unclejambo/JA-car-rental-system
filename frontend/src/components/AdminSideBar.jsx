import { NavLink } from "react-router-dom";
import "../styles/adminsidebar.css";

export default function AdminSideBar() {
  return (
    <div id="admin-sidebar" className="admin-sidebar">
      <NavLink to="/admin/dashboard">DASHBOARD</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/manage-booking">MANAGE BOOKINGS</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/manage-car">MANAGE CARS</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/manage-user">MANAGE USERS</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/schedule">SCHEDULE</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/transaction-logs">TRANSACTION LOGS</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/report-analytics">REPORT & ANALYTICS</NavLink>
      <br />
      <hr />
      <NavLink to="/admin/settings">SETTINGS</NavLink>
      <br />
      <hr />
      <NavLink to="/login">LOGOUT</NavLink>
    </div>
  );
}
