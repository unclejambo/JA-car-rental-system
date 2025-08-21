import { NavLink } from "react-router-dom";
import "../styles/admincss/adminsidebar.css";
import { HiCalendar } from "react-icons/hi2";
import { HiChartBar } from "react-icons/hi2";
import { HiBookOpen } from "react-icons/hi2";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { HiCog8Tooth } from "react-icons/hi2";
import { HiDocumentCurrencyDollar } from "react-icons/hi2";
import { HiTruck } from "react-icons/hi2";
import { HiMiniSquaresPlus } from "react-icons/hi2";
import { HiArrowLeftStartOnRectangle } from "react-icons/hi2";

export default function AdminSideBar() {
  return (
    <div id="admin-sidebar" className="admin-sidebar">
      <NavLink to="/#">
        <HiMiniSquaresPlus style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        DASHBOARD
      </NavLink>
      <br />
      <hr />
      <NavLink to="/manage-booking">
        <HiBookOpen style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        MANAGE BOOKINGS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/manage-car">
        <HiTruck style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        MANAGE CARS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/manage-user">
        <HiOutlineUserGroup
          style={{ verticalAlign: "-3px", marginRight: "5px" }}
        />
        MANAGE USERS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/schedule">
        <HiCalendar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        SCHEDULE
      </NavLink>
      <br />
      <hr />
      <NavLink to="/transaction-logs">
        <HiDocumentCurrencyDollar
          style={{ verticalAlign: "-3px", marginRight: "5px" }}
        />
        TRANSACTION LOGS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/report-analytics">
        <HiChartBar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        REPORT & ANALYTICS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/settings">
        <HiCog8Tooth style={{ verticalAlign: "-3px", marginRight: "5px" }} />
        SETTINGS
      </NavLink>
      <br />
      <hr />
      <NavLink to="/login">
        <HiArrowLeftStartOnRectangle
          style={{ verticalAlign: "-3px", marginRight: "5px" }}
        />
        LOGOUT
      </NavLink>
    </div>
  );
}
