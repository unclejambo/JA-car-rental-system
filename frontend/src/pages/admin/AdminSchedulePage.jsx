import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/adminschedule.css";
import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { scheduleColumns } from "./ScheduleColumns.jsx";
import { useScheduleStore } from "../../store/useScheduleStore.js";

export default function AdminSchedulePage() {
  const data = useScheduleStore((state) => state.reservations);

  const columns = useMemo(() => scheduleColumns, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Header />
      <AdminSideBar />
      <div className="page-content">
        <title>Schedule</title>

        <h1>
          Hilu, Admin Goy! <br /> mao ni ang skedyul
        </h1>
        <div className="p-4">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left cursor-pointer border font-pathway"
                      style={{
                        fontSize: "20px",
                        padding: "3px",
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
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="p-2"
                      style={{
                        borderBottom: "1px solid #000",
                        padding: "10px",
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
          <div
            className="mt-2 flex gap-2"
            style={{
              marginTop: "20px",
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
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next →
            </button>

            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[2, 5, 8].map((sz) => (
                <option key={sz} value={sz}>
                  Show {sz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
