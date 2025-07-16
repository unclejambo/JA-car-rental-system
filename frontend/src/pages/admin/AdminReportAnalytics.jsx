import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";

export default function AdminReportAnalytics() {
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
        <title>Report & Analytics</title>

        <h1 style={{ textAlign: "center" }}>Report & Analytics</h1>
      </div>
    </>
  );
}
