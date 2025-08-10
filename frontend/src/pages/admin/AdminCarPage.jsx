import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admincar.css";
import React, { useCallback, useMemo, useState } from "react";
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
import AddCarModal from "../../components/modal/AddCarModal.jsx";
import EditCarModal from "../../components/modal/EditCarModal.jsx";
import { AiOutlinePlus } from "react-icons/ai";
import { HiMiniChevronRight } from "react-icons/hi2";
import { HiMiniChevronLeft } from "react-icons/hi2";
import { HiWrenchScrewdriver } from "react-icons/hi2";
import { HiTruck } from "react-icons/hi2";

export default function AdminCarPage() {
  const carsData = useCarStore((state) => state.cars);
  const maintenanceData = useMaintenanceStore((state) => state.maintenances);

  const [activeTab, setActiveTab] = useState("cars");

  const [showAddModal, setShowAddModal] = useState(false);
  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const [editCar, setEditCar] = useState(null);
  const openEditModal = useCallback((car) => setEditCar(car), []);
  const closeEditModal = () => setEditCar(null);

  // Memoize columns
  const columns = useMemo(() => carColumns(openEditModal), [openEditModal]);
  const maintenanceColumns = useMemo(() => carMaintenanceColumns, []);

  // Separate states for each table
  const [carSorting, setCarSorting] = useState([]);
  const [carPagination, setCarPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const [maintenanceSorting, setMaintenanceSorting] = useState([]);
  const [maintenancePagination, setMaintenancePagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  // Initialize tables with their own state
  const carsTable = useReactTable({
    data: carsData,
    columns,
    state: {
      sorting: carSorting,
      pagination: carPagination,
    },
    onSortingChange: setCarSorting,
    onPaginationChange: setCarPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const maintenanceTable = useReactTable({
    data: maintenanceData,
    columns: maintenanceColumns,
    state: {
      sorting: maintenanceSorting,
      pagination: maintenancePagination,
    },
    onSortingChange: setMaintenanceSorting,
    onPaginationChange: setMaintenancePagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getActiveTable = () => {
    switch (activeTab) {
      case "cars":
        return {
          table: carsTable,
          data: carsData,
          emptyMessage: "There are no cars available.",
          title: "CARS",
          showAddButton: true,
        };
      case "maintenance":
        return {
          table: maintenanceTable,
          data: maintenanceData,
          emptyMessage: "There are no maintenance requests yet.",
          title: "MAINTENANCE",
          showAddButton: false,
        };
      default:
        return {
          table: carsTable,
          data: carsData,
          emptyMessage: "There are no cars available.",
          title: "CARS",
          showAddButton: true,
        };
    }
  };
  const {
    table: activeTable,
    title,
    emptyMessage,
    showAddButton,
  } = getActiveTable();

  const getButtonClass = (tabName) => {
    return `tab-btn ${activeTab === tabName ? "active" : ""}`;
  };

  return (
    <>
      <Header />
      <AdminSideBar />

      <AddCarModal show={showAddModal} onClose={closeAddModal} />
      <EditCarModal show={!!editCar} onClose={closeEditModal} />

      <div className="page-main-content-car">
        <div className="cars-container">
          <button
            className={getButtonClass("cars")}
            onClick={() => setActiveTab("cars")}
          >
            CARS
          </button>
          <button
            className={getButtonClass("maintenance")}
            onClick={() => setActiveTab("maintenance")}
          >
            MAINTENANCE
          </button>
        </div>
        <div className="page-content-car">
          <title>Manage Cars</title>

          <h1 className="font-pathway text-2xl header-req">
            <HiTruck style={{ verticalAlign: "-3px", marginRight: "5px" }} />
            {title}
          </h1>

          {showAddButton && (
            <button className="add-car-btn" onClick={openAddModal}>
              <AiOutlinePlus className="add-icon" style={{ marginRight: 6 }} />
              ADD NEW CAR
            </button>
          )}

          <table className="admin-table">
            <thead>
              {activeTable.getHeaderGroups().map((hg) => (
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
              {activeTable.getRowModel().rows.length === 0 ? (
                <tr style={{ border: "none" }}>
                  <td
                    colSpan={activeTable.getAllColumns().length}
                    className="text-center py-4 font-pathway"
                    style={{ color: "#808080" }}
                  >
                    <h3>{emptyMessage}</h3>
                  </td>
                </tr>
              ) : (
                activeTable.getRowModel().rows.map((row) => (
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
              onClick={() => activeTable.previousPage()}
              disabled={!activeTable.getCanPreviousPage()}
              className="pagination-btn"
            >
              <HiMiniChevronLeft style={{ verticalAlign: "-3px" }} /> Prev
            </button>
            <span style={{ padding: "0 10px" }}>
              {activeTable.getState().pagination.pageIndex + 1} of{" "}
              {activeTable.getPageCount()}
            </span>
            <button
              onClick={() => activeTable.nextPage()}
              disabled={!activeTable.getCanNextPage()}
              className="pagination-btn"
            >
              Next <HiMiniChevronRight style={{ verticalAlign: "-3px" }} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
