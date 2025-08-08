import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admincar.css";
import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { carColumns } from "../accessor/CarColumns.jsx";
import { useCarStore } from "../../store/cars.js";
import { carMaintenanceColumns } from "../accessor/CarMaintenanceColumns.jsx";
import { useMaintenanceStore } from "../../store/maintenance.js";

export default function AdminCarPage() {
  const data = useCarStore((state) => state.cars);
  const maintenanceData = useMaintenanceStore((state) => state.maintenances);

  const columns = useMemo(() => carColumns, []);
  const maintenanceColumns = useMemo(() => carMaintenanceColumns, []);
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

  const maintenanceTable = useReactTable({
    data: maintenanceData,
    columns: maintenanceColumns,
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
      <div className="page-content-car">
        <title>Manage Cars</title>

        <h1 className="font-pathway text-2xl header-req">CARS</h1>

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
                  <h3>No cars available.</h3>
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
      </div>
      <br />
      <div className="page-content-maintenance">
        <h1 className="font-pathway text-2xl header-req">MAINTENANCE</h1>
        <table className="admin-table">
          <thead>
            {maintenanceTable.getHeaderGroups().map((hg) => (
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
            {maintenanceTable.getRowModel().rows.length === 0 ? (
              <tr style={{ border: "none" }}>
                <td
                  colSpan={maintenanceTable.getAllColumns().length}
                  className="text-center py-4 font-pathway"
                  style={{ color: "#808080" }}
                >
                  <h3>No car under maintenance.</h3>
                </td>
              </tr>
            ) : (
              maintenanceTable.getRowModel().rows.map((row) => (
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
      </div>
    </>
  );
}
