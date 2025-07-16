import { NavLink } from "react-router-dom";
import "../styles/admincss/adminsidebar.css";

export default function AdminSideBar() {
  return (
    <div id="admin-sidebar" className="admin-sidebar">
      <NavLink to="/#">DASHBOARD</NavLink>
      <br />
      <hr />
      <NavLink to="/manage-booking">MANAGE BOOKINGS</NavLink>
      <br />
      <hr />
      <NavLink to="/manage-car">MANAGE CARS</NavLink>
      <br />
      <hr />
      <NavLink to="/manage-user">MANAGE USERS</NavLink>
      <br />
      <hr />
      <NavLink to="/schedule">SCHEDULE</NavLink>
      <br />
      <hr />
      <NavLink to="/transaction-logs">TRANSACTION LOGS</NavLink>
      <br />
      <hr />
      <NavLink to="/report-analytics">REPORT & ANALYTICS</NavLink>
      <br />
      <hr />
      <NavLink to="/settings">SETTINGS</NavLink>
      <br />
      <hr />
      <NavLink to="/home">LOGOUT</NavLink>
    </div>
  );
}
