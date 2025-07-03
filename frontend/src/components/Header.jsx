function Header() {
  return (
    <header
      style={{
        backgroundColor: "black",
        overflow: "hidden",
        marginTop: "-40px",
        marginBottom: "-10px",
      }}
    >
      <div style={{ padding: "0" }}>
        <p
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "36px",
            color: "#FF0000",
            paddingLeft: "35px",
            fontStyle: "italic",
            fontWeight: "bolder",
            textShadow: "2px 2px 0 rgba(255,255,255,1)",
          }}
        >
          J&amp;A
        </p>
        <p
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "18px",
            color: "#FF0000",
            fontStyle: "italic",
            paddingLeft: "10px",
            marginTop: "-40px",
            fontWeight: "bolder",
            textShadow: "2px 2px 0 rgba(255,255,255,1)",
          }}
        >
          CAR RENTAL
        </p>
      </div>
    </header>
  );
}

export default Header;
