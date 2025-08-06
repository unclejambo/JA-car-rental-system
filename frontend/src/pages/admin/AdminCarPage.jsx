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

        <h1 className="font-pathway text-2xl header-req">CARS</h1>
      </div>
    </>
  );
}
