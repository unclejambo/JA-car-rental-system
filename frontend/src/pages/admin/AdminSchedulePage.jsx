import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";

export default function AdminSchedulePage() {
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
        <title>Schedule</title>

        <h1 style={{ textAlign: "center" }}>
          Hilu, Admin Goy! <br /> mao ni ang skedyul
        </h1>
      </div>
    </>
  );
}
