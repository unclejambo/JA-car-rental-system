import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";

export default function AdminBookingPage() {
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
        <title>Manage Bookings</title>

        <h1 style={{ textAlign: "center" }}>Manage Bookings</h1>
      </div>
    </>
  );
}
