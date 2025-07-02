import Header from "../components/Header";
import carImage from "/carImage.png";

function LoginPage() {
  return (
    <div>
      <Header />
      <div
        className="m-0 p-0 h-screen overflow-hidden"
        style={{
          backgroundImage: `url(${carImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          placeContent: "center",
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#f2f2f2",
            borderRadius: "5px",
            padding: "20px",
            width: "360px",
            height: "410px",
            marginTop: "60px",
            placeContent: "center",
            justifyItems: "center",
            boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
          }}
        >
          <img
            src="https://www.gravatar.com/avatar/?d=mp"
            alt="Default Avatar"
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              marginTop: "-100px",
            }}
          />
          <h2
            style={{
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: "36px",
              marginTop: "0",
            }}
          >
            LOGIN
          </h2>
          <input
            type="text"
            id="username"
            placeholder="Username"
            style={{
              backgroundColor: "#D9D9D9",
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: "18px",
              textAlign: "center",
              border: "none",
              borderRadius: "5px",
              padding: "10px",
              width: "300px",
              marginBottom: "10px",
              boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
            }}
          />
          <br />
          <input
            type="password"
            id="password"
            placeholder="Password"
            style={{
              backgroundColor: "#D9D9D9",
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: "18px",
              textAlign: "center",
              border: "none",
              borderRadius: "5px",
              padding: "10px",
              width: "300px",
              marginBottom: "10px",
              boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
            }}
          />
          <br />
          <button
            id="login"
            style={{
              backgroundColor: "#3F86F1",
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: "18px",
              border: "none",
              borderRadius: "5px",
              padding: "10px",
              width: "320px",
              marginBottom: "10px",
              boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
            }}
          >
            Login
          </button>
          <br />
          <a
            href="#"
            style={{
              fontFamily: '"Pathway Gothic One", sans-serif',
              textDecoration: "none",
              color: "black",
            }}
          >
            Forgot your password?
          </a>
          <br />
          <p style={{ fontFamily: '"Pathway Gothic One", sans-serif' }}>OR</p>
          <br />
          <button
            id="createAccount"
            style={{
              backgroundColor: "#F13F3F",
              fontFamily: '"Pathway Gothic One", sans-serif',
              fontSize: "18px",
              border: "none",
              borderRadius: "5px",
              padding: "10px",
              width: "320px",
              marginBottom: "10px",
              boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
            }}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
