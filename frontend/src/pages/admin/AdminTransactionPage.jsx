import React, { useMemo, useState } from "react";
import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
//import "../../styles/admin-main.css";
import { HiDocumentCurrencyDollar } from "react-icons/hi2";
import { useTransactionStore } from "../../store/transactions";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { AiOutlinePlus } from "react-icons/ai";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export default function AdminTransactionPage() {
  const { transactions } = useTransactionStore();
  const [activeTab, setActiveTab] = useState("all");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const getButtonClass = (tabName) => {
    return `tab-btn ${activeTab === tabName ? "active" : ""}`;
  };

  const filteredTransactions = useMemo(() => {
    if (activeTab === "all") return transactions;
    if (activeTab === "payment") return transactions.filter(tx => tx.paymentStatus === 'Paid');
    if (activeTab === "refund") return transactions.filter(tx => tx.paymentStatus === 'Refunded');
    return transactions;
  }, [transactions, activeTab]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "transactionId",
        header: "ID",
        cell: (info) => `#${info.getValue()}`,
      },
      {
        accessorKey: "bookingDate",
        header: "Booking Date",
        cell: (info) => formatDate(info.getValue()),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
      },
      {
        accessorKey: "carModel",
        header: "Car Model",
      },
      {
        accessorKey: "completionDate",
        header: "Completion Date",
        cell: (info) => formatDate(info.getValue()),
      },
      {
        accessorKey: "cancellationDate",
        header: "Cancellation Date",
        cell: (info) => info.getValue() ? formatDate(info.getValue()) : 'N/A',
      },
      {
        accessorKey: "paymentStatus",
        header: "Status",
        cell: (info) => (
          <span
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              info.getValue() === 'Paid'
                ? 'bg-green-100 text-green-800'
                : info.getValue() === 'Refunded'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {info.getValue()}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredTransactions,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Header />
      <AdminSideBar />

      <div className="page-main-content-car">
        <div className="cars-container">
          <button
            className={getButtonClass("all")}
            onClick={() => setActiveTab("all")}
          >
            ALL TRANSACTIONS
          </button>
          <button
            className={getButtonClass("payment")}
            onClick={() => setActiveTab("payment")}
          >
            Payment Logs
          </button>
          <button
            className={getButtonClass("refund")}
            onClick={() => setActiveTab("refund")}
          >
            Refund Logs
          </button>
        </div>
        <div className="page-content-car">
          <title>Transaction Logs</title>

          <h1 className="font-pathway text-2xl header-req">
            <HiDocumentCurrencyDollar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
            TRANSACTIONS
          </h1>

          <table className="admin-table">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left cursor-pointer border font-pathway"
                      style={{
                        fontSize: "20px",
                        padding: "3px 3px 3px 10px",
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted()
                        ? header.column.getIsSorted() === "asc"
                          ? " ↑"
                          : " ↓"
                        : ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr style={{ border: "none" }}>
                  <td
                    colSpan={table.getAllColumns().length}
                    className="text-center py-4 font-pathway"
                    style={{ color: "#808080" }}
                  >
                    <h3>No transactions found</h3>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="border px-4 py-2 text-sm font-pathway"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div 
            className="mt-2 flex gap-2 pagination"
            style={{
              marginTop: "15px",
              alignItems: "center",
              placeContent: "center",
            }}
          >
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="pagination-button flex items-center gap-1"
            >
              <span className="pagination-arrow">
                <HiChevronLeft />
              </span>
              <span>Prev</span>
            </button>
            <span className="page-info">
              Page {table.getState().pagination.pageIndex + 1} of{' '}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="pagination-button flex items-center gap-1"
            >
              <span>Next</span>
              <span className="pagination-arrow">
                <HiChevronRight />
              </span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
