import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminTransactionPage() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Transaction Logs</title>

        <h1 style={{ textAlign: "center" }}>Transaction Logs</h1>
      </div>
    </>
  );
}
