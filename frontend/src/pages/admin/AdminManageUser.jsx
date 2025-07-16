import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminManageUser() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Manage Users</title>

        <h1 style={{ textAlign: "center" }}>Manage Users</h1>
      </div>
    </>
  );
}
