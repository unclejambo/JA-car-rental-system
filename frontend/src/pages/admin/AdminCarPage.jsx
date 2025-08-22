import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
import "../../styles/admincss/admincar.css";
import React, { useMemo, useState, useEffect } from "react";
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
import { HiMiniChevronRight, HiMiniChevronLeft } from "react-icons/hi2";
import { HiTruck, HiWrenchScrewdriver } from "react-icons/hi2";

export default function AdminCarPage() {
  const { cars, init } = useCarStore();
  
  useEffect(() => {
    const loadCars = async () => {
      try {
        await init();
      } catch (error) {
        console.error('Failed to load cars:', error);
      }
    };
    
    loadCars();
  }, [init]);
  const carsData = useCarStore((state) => state.cars);
  const maintenanceData = useMaintenanceStore((state) => state.maintenances);

  const [activeTab, setActiveTab] = useState("cars");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCar, setEditCar] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);
  const closeEditModal = () => setEditCar(null);
  const { deleteCar } = useCarStore();

  const handleDelete = async (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        await deleteCar(carId);
      } catch (error) {
        console.error('Failed to delete car:', error);
      }
    }
  };

  const {
    data,
    columns,
    title,
    icon: TabIcon,
    emptyMessage,
  } = useMemo(() => {
    switch (activeTab) {
      case "cars":
        return {
          data: carsData,
          columns: carColumns(setEditCar, handleDelete),
          title: "CARS",
          icon: HiTruck,
          emptyMessage: "There are no cars available.",
        };
      case "maintenance":
        return {
          data: maintenanceData,
          columns: carMaintenanceColumns,
          title: "MAINTENANCE",
          icon: HiWrenchScrewdriver,
          emptyMessage: "There are no maintenance requests yet.",
        };
      default:
        return {
          data: carsData,
          columns: carColumns(setEditCar, handleDelete),
          title: "CARS",
          icon: HiTruck,
          emptyMessage: "There are no cars available.",
        };
    }
  }, [activeTab, carsData, maintenanceData]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const getButtonClass = (tabName) =>
    `user-type-btn ${activeTab === tabName ? "active" : ""}`;

  return (
    <>
      <Header />
      <AdminSideBar />

      <AddCarModal show={showAddModal} onClose={closeAddModal} />
      <EditCarModal show={!!editCar} onClose={closeEditModal} car={editCar} />

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
            <TabIcon style={{ verticalAlign: "-3px", marginRight: "5px" }} />
            {title}
          </h1>

          {activeTab === "cars" && (
            <button className="add-car-btn" onClick={openAddModal}>
              <AiOutlinePlus className="add-icon" style={{ marginRight: 6 }} />
              ADD NEW CAR
            </button>
          )}

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
                    <h3>{emptyMessage}</h3>
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
              className="pagination-btn"
            >
              <HiMiniChevronLeft style={{ verticalAlign: "-3px" }} /> Prev
            </button>
            <span style={{ padding: "0 10px" }}>
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
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
