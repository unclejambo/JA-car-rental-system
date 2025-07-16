import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminCarPage() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Manage Cars</title>

        <h1 style={{ textAlign: "center" }}>Manage Cars</h1>
      </div>
    </>
  );
}
