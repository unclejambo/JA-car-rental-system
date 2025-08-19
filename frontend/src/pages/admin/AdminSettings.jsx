import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";
import { HiCog8Tooth } from "react-icons/hi2";

export default function AdminSettings() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Settings</title>
        <h1 className="font-pathway text-2xl header-req">
          <HiCog8Tooth style={{ verticalAlign: "-3px", marginRight: "5px" }} />
          SETTINGS
        </h1>
      </div>
    </>
  );
}
