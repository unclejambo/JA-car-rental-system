import { Link } from "react-router-dom";

function Header() {
  const headerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "70px",
    backgroundColor: "black",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };
  return (
    <header style={headerStyle}>
      <div style={{ padding: "0" }}>
        <Link
          to="/"
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "30px",
            color: "#FF0000",
            paddingLeft: "35px",
            fontStyle: "italic",
            fontWeight: "bolder",
            textShadow: "2px 2px 0 rgba(255,255,255,.85)",
            textDecoration: "none",
          }}
        >
          J&amp;A
        </Link>
        <br />
        <Link
          to="/"
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "18px",
            color: "#FF0000",
            fontStyle: "italic",
            paddingLeft: "10px",
            marginTop: "-40px",
            fontWeight: "bolder",
            textShadow: "2px 2px 0 rgba(255,255,255,.85)",
            textDecoration: "none",
          }}
        >
          CAR RENTAL
        </Link>
      </div>
    </header>
  );
}

export default Header;
