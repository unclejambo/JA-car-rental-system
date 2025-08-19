import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";
import { HiChartBar } from "react-icons/hi2";

export default function AdminReportAnalytics() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Report & Analytics</title>

        <h1 className="font-pathway text-2xl header-req">
          <HiChartBar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
          REPORT & ANALYTICS
        </h1>
      </div>
    </>
  );
}
