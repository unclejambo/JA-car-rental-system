import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";

export default function AdminSettings() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div
        style={{
          marginTop: "70px",
          marginLeft: "20vw",
          height: "calc(100vh - 70px)",
          overflowY: "auto",
          padding: "20px",
        }}
      >
        <title>Settings</title>

        <h1 style={{ textAlign: "center" }}>Settings</h1>
      </div>
    </>
  );
}
