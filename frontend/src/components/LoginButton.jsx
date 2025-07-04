import { Link } from "react-router-dom";

export default function LoginButton() {
  return (
    <Link to="/login">
      <button
        className="w-[100px] h-[30px] p-[5px] text-[18px]"
        style={{
          backgroundColor: "#F13F3F",
          borderRadius: "20px",
          color: "white",
          border: "none",
          cursor: "pointer",
          position: "absolute",
          top: "20px",
          right: "20px",
        }}
      >
        Login
      </button>
    </Link>
  );
}
