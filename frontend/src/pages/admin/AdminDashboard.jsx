import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admindashboard.css";

function AdminDashboard() {
  return (
    <>
      <Header />
      <br />
      <AdminSideBar />
      <div
        style={{
          marginTop: "55px",
          marginLeft: "15vw",
          height: "calc(100vh - 19vh)",
          width: "auto",
          overflowY: "auto",
          padding: "20px",
        }}
      >
        <title>Dashboard</title>
        <div className="div-1">
          <div className="topmost-1">
            <h1 className="font-pathway">MOST RENTED CAR</h1>
            <h3 className="font-pathway">MARCH</h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "30px",
                paddingInlineStart: "80px",
                marginTop: "-20px",
              }}
            >
              <img
                src="/nissan.png"
                alt="nissan"
                className="w-[200px] h-[120px]"
              />
              <h4 className="font-pathway text-[30px]">
                Nissan
                <br />
                Terra
                <h5 className="font-pathway text-[16px]" style={{ margin: 0 }}>
                  SUV
                </h5>
              </h4>
            </div>
            <h3 className="font-pathway total">TOTAL BOOKINGS: 4</h3>
            <a href="/#" className="more-details">
              More Details
            </a>
          </div>
          <div className="topmost-2">
            <h1 className="font-pathway">
              TOP <br /> COSTUMER
            </h1>
            <h2 className="font-pathway text-[80px]" style={{ margin: "0" }}>
              JASPEN GERME
            </h2>
            <h3 className="font-pathway total">TOTAL BOOKINGS: 4</h3>
            <a href="/#" className="more-details">
              More Details
            </a>
          </div>
        </div>
        <br />
        <div className="div-2">
          <div className="topmost-1">
            <h1 className="font-pathway">SCHEDULE</h1>
            <h3 className="font-pathway">TODAY</h3>
            <a href="/#" className="more-details">
              More Details
            </a>
          </div>
          <div className="topmost-2">
            <h1 className="font-pathway">AVAILABLE CARS</h1>
            <h3 className="font-pathway">TODAY</h3>
            <a href="/#" className="more-details">
              More Details
            </a>
          </div>
        </div>
        <br />
        <div className="div-3">
          <div className="request-1">
            <h1 className="font-pathway">BOOKING REQUESTS</h1>
            <hr />
            <p className="font-pathway text-[24px] no-req">
              No booking requests.
            </p>
            <a href="/#" className="more-details-req">
              More Details
            </a>
          </div>
          <br />
          <div className="request-2">
            <h1 className="font-pathway">EXTENSION/CANCELLATION REQUESTS</h1>
            <hr />
            <p className="font-pathway text-[24px] no-req">
              No extension/cancellation requests.
            </p>
            <a href="/#" className="more-details-req">
              More Details
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
