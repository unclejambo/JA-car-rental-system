import React, { useState } from "react";
import Header from "../components/Header";
import carImage from "/carImage.png";
import {
  EyeIcon as EyeSolid,
  EyeSlashIcon as EyeSlashSolid,
} from "@heroicons/react/24/solid";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  return (
    <>
      <Header />
      <div
        className="m-0 p-0 h-screen overflow-hidden"
        style={{
          backgroundImage: `url(${carImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          width: "100vw",
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
            height: "390px",
            marginTop: "145px",
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
            className="font-pathway"
            style={{
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
          <div style={{ position: "relative", display: "inline-block" }}>
            <input
              type={showPwd ? "text" : "password"}
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {password && (
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{
                  position: "absolute",
                  right: "5px",
                  top: "23px",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  zIndex: 100,
                }}
              >
                {showPwd ? (
                  <EyeSlashSolid
                    style={{ width: 18, height: 18, color: "rgb(0 0 0 / .7)" }}
                  />
                ) : (
                  <EyeSolid
                    style={{ width: 18, height: 18, color: "rgb(0 0 0 / .7)" }}
                  />
                )}
              </button>
            )}
          </div>
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
              color: "rgb(0 0 0 / .7)",
            }}
          >
            Forgot your password?
          </a>
          <br />
          <p
            style={{
              fontFamily: '"Pathway Gothic One", sans-serif',
              color: "rgb(0 0 0 / .7)",
            }}
          >
            OR
          </p>
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
              marginBottom: "30px",
              boxShadow: "0 2px 2px rgba(0, 0, 0, .7)",
            }}
          >
            Create an Account
          </button>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
