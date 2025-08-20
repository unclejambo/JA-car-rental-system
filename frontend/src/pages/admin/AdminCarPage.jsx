import axios from "axios";
import AdminSideBar from "../../components/AdminSideBar";
import Header from "../../components/Header";
//import "../../styles/admincss/admincar.css";
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

  const columns = useMemo(() => carColumns(openEditModal), [openEditModal]);
  const maintenanceColumns = useMemo(() => carMaintenanceColumns, []);

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
    <div style={styles.page}>
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

      <div style={styles.formGroup}>
        <input
          type="text"
          placeholder="Search cars..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />
      </div>

      {showForm && (
        <div style={styles.form}>
          <h3>{currentCar ? 'Edit Car' : 'Add New Car'}</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label>Make</label>
              <input
                name="make"
                value={formData.make}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Model</label>
              <input
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>License Plate</label>
              <input
                name="license_plate"
                value={formData.license_plate}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Number of Seats</label>
              <input
                type="number"
                name="no_of_seat"
                value={formData.no_of_seat}
                onChange={handleInputChange}
                required
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Rent Price (per day)</label>
              <input
                type="number"
                name="rent_price"
                value={formData.rent_price}
                onChange={handleInputChange}
                required
                step="0.01"
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                style={styles.input}
              >
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label>Image URL</label>
              <input
                type="text"
                name="image_url"
                value={formData.image_url}
                onChange={handleInputChange}
                placeholder="https://example.com/car-image.jpg"
                style={styles.input}
              />
              {formData.image_url && (
                <div style={{ marginTop: '10px', textAlign: 'center' }}>
                  <p>Image Preview:</p>
                  <img 
                    src={formData.image_url} 
                    alt="Car preview" 
                    style={{
                      maxWidth: '100%',
                      maxHeight: '150px',
                      marginTop: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const errorMsg = e.target.nextSibling;
                      if (errorMsg) {
                        errorMsg.style.display = 'block';
                      }
                    }}
                  />
                  <p style={{
                    display: 'none',
                    color: '#dc3545',
                    fontSize: '12px',
                    marginTop: '5px'
                  }}>
                    Could not load image. Please check the URL.
                  </p>
                </div>
              )}
            </div>
            <button 
              type="submit" 
              style={styles.button}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button 
              type="button" 
              style={{ ...styles.button, marginLeft: '10px', background: '#6c757d' }}
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Car</th>
            <th style={styles.th}>Make</th>
            <th style={styles.th}>Model</th>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>License</th>
            <th style={styles.th}>Seats</th>
            <th style={styles.th}>Price/Day</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCars.map(car => (
            <tr key={car.car_id}>
              <td style={styles.td}>
                {car.image_url ? (
                  <img 
                    src={car.image_url} 
                    alt={`${car.make} ${car.model}`} 
                    style={styles.imagePreview}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'inline';
                    }}
                  />
                ) : null}
                {!car.image_url && (
                  <div style={{
                    width: "80px",
                    height: "50px",
                    background: "#f0f0f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    fontSize: "10px",
                    color: "#666"
                  }}>
                    No Image
                  </div>
                )}
              </td>
              <td style={styles.td}>{car.make}</td>
              <td style={styles.td}>{car.model}</td>
              <td style={styles.td}>{car.year}</td>
              <td style={styles.td}>{car.license_plate}</td>
              <td style={styles.td}>{car.no_of_seat}</td>
              <td style={styles.td}>${car.rent_price?.toFixed(2)}</td>
              <td style={styles.td}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: car.status === 'available' ? '#4caf50' : 
                             car.status === 'unavailable' ? '#f44336' : '#ff9800',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {car.status}
                </span>
              </td>
              <td style={styles.td}>
                <button 
                  onClick={() => {
                    setCurrentCar(car);
                    setFormData({
                      make: car.make,
                      model: car.model,
                      year: car.year,
                      license_plate: car.license_plate,
                      no_of_seat: car.no_of_seat,
                      rent_price: car.rent_price,
                      status: car.status,
                      image_url: car.image_url || ''
                    });
                    setShowForm(true);
                  }}
                  style={{ ...styles.button, padding: '4px 8px', marginRight: '5px' }}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(car.car_id)}
                  style={{ ...styles.button, padding: '4px 8px', background: '#dc3545' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
