import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminReportAnalytics() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Report & Analytics</title>

        <h1 className="font-pathway text-2xl header-req">REPORT & ANALYTICS</h1>
      </div>
    </>
  );
}
