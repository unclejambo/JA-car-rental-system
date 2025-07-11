import { Link } from "react-router-dom";

export default function AdminSideBar() {
  const sidebarStyle = {
    position: "fixed",
    top: "70px", // start below the fixed header
    left: 0,
    height: "calc(100vh - 70px)",
    width: "20vw",
    backgroundColor: "#D9D9D9",
    overflow: "hidden",
    alignContent: "center",
    placeContent: "center",

  };
  return (
    <div
      style={{
        ...sidebarStyle,
      }}
    >
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        DASHBOARD
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        MANAGE BOOKINGS
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        MANAGE CARS
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        MANAGE USERS
      </Link>
      <br />
      <hr />
      <Link
        to="/schedule"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        SCHEDULE
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        TRANSACTION LOGS
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        REPORT & ANALYTICS
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        SETTINGS
      </Link>
      <br />
      <hr />
      <Link
        to="/#"
        className="font-pathway"
        style={{
          textDecoration: "none",
          fontSize: "24px",
          paddingLeft: "10px",
          color: "black",
        }}
      >
        LOGOUT
      </Link>
    </div>
  );
}
