import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";
import { HiChartBar } from "react-icons/hi2";
import React from "react";

export default function AdminReportAnalytics() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="page-container">
        <title>Report & Analytics</title>

        <h1 className="font-pathway text-2xl header-req">
          <HiChartBar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
          REPORT & ANALYTICS
        </h1>
      </div>
    </>
  );
}
