import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admin-body.css";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { scheduleColumns } from "../accessor/ScheduleColumns.jsx";
import { useScheduleStore } from "../../store/schedule.js";
import { HiCalendar, HiMagnifyingGlass } from "react-icons/hi2";
import ReleaseModal from "../../components/modal/ReleaseModal";

export default function AdminSchedulePage() {
  const allData = useScheduleStore((state) => state.reservations);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return allData;
    const term = searchTerm.toLowerCase();
    return allData.filter(item => 
      (item.customerName && item.customerName.toLowerCase().includes(term)) ||
      (item.driverName && item.driverName.toLowerCase().includes(term))
    );
  }, [allData, searchTerm]);

  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  const handleReleaseClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReleaseModal(true);
  };

  const columns = useMemo(() => scheduleColumns(handleReleaseClick), []);

  const table = useReactTable({
    data: filteredData,
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

      {showReleaseModal && (
        <ReleaseModal 
          show={showReleaseModal} 
          onClose={() => setShowReleaseModal(false)} 
          reservation={selectedReservation}
        />
      )}
      <div className="page-content">
        <title>Schedule</title>

        <div className="flex justify-between items-center mb-4">
          <h1 className="font-pathway text-2xl header-req">
            <HiCalendar style={{ verticalAlign: "-3px", marginRight: "5px" }} />
            SCHEDULE
          </h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <HiMagnifyingGlass className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        <div className="p-4">
          <table className="min-w-full admin-schedule-table">
            <thead className="bg-gray-100">
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
              {table.getRowModel().rows.map((row) => (
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
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex gap-2 pagination">
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
      </div>
    </>
  );
}
