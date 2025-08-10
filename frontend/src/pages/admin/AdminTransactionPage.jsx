import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";
import { HiDocumentCurrencyDollar } from "react-icons/hi2";

export default function AdminTransactionPage() {
  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Transaction Logs</title>

        <h1 className="font-pathway text-2xl header-req">
          <HiDocumentCurrencyDollar
            style={{ verticalAlign: "-3px", marginRight: "5px" }}
          />
          TRANSACTIONS
        </h1>
      </div>
    </>
  );
}
