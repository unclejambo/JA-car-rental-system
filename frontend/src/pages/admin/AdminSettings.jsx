import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";

export default function AdminSettings() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Settings</title>
        <h1 className="font-pathway text-2xl header-req">SETTINGS</h1>
      </div>
    </>
  );
}
