import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/adminbooking.css";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { bookingColumns } from "../accessor/BookingColumns.jsx";
import { useBookingStore } from "../../store/bookings.js";

export default function AdminBookingPage() {
  const data = useBookingStore((state) => state.bookings);

  const columns = useMemo(() => bookingColumns, []);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      setSorting(updater);
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content-booking">
        <title>Manage Bookings</title>
        <h1 className="font-pathway header-req">BOOKING REQUESTS</h1>
        <table className="admin-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
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
                  <h3>No booking requests.</h3>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t font-pathway">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2"
                      style={{
                        borderBottom: "1px solid #000",
                        padding: "10px ",
                      }}
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
          >
            ← Prev
          </button>
          <span style={{ padding: "0 10px" }}>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next →
          </button>
        </div>
      </div>
      <br />
      <div className="req-div">
        <div className="page-content-req">
          <h1 className="font-pathway header-req">CANCELLATION REQUESTS</h1>
        </div>
        <div className="page-content-req">
          <h1 className="font-pathway header-req">EXTENSION REQUESTS</h1>
        </div>
      </div>
    </>
  );
}
