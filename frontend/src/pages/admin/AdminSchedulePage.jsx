import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/adminschedule.css";

export default function AdminSchedulePage() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Schedule</title>

        <h1>
          Hilu, Admin Goy! <br /> mao ni ang skedyul
        </h1>
      </div>
    </>
  );
}
