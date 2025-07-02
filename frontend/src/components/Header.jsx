function Header() {
  return (
    <header
      style={{
        backgroundColor: "black",
        overflow: "hidden",
        marginTop: "-20px",
        marginBottom: "-5px",
      }}
    >
      <div style={{ padding: "0" }}>
        <p
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "28px",
            color: "#FF0000",
            paddingLeft: "40px",
            fontStyle: "italic",
            fontWeight: "bolder",
            textShadow: "0 2px 0 rgba(255,255,255,1)",
          }}
        >
          J&amp;A
        </p>
        <p
          style={{
            fontFamily: '"Merriweather", serif',
            fontSize: "14px",
            color: "#FF0000",
            fontStyle: "italic",
            paddingLeft: "20px",
            marginTop: "-25px",
            fontWeight: "bolder",
            textShadow: "0 2px 0 rgba(255,255,255,1)",
          }}
        >
          CAR RENTAL
        </p>
      </div>
    </header>
  );
}

export default Header;
