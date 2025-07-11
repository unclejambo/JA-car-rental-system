import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";

export default function AdminCarPage() {
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
        <title>Manage Cars</title>

        <h1 style={{ textAlign: "center" }}>Manage Cars</h1>
      </div>
    </>
  );
}
