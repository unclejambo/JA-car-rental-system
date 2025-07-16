import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminBookingPage() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Manage Bookings</title>

        <h1 style={{ textAlign: "center" }}>Manage Bookings</h1>
      </div>
    </>
  );
}
