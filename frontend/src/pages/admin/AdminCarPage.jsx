import { useState, useEffect } from "react";
import axios from "axios";
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
import AddCarModal from "../../components/modal/AddCarModal.jsx";
import EditCarModal from "../../components/modal/EditCarModal.jsx";
import { AiOutlinePlus } from "react-icons/ai";
import { HiMiniChevronRight, HiMiniChevronLeft } from "react-icons/hi2";
import { HiTruck, HiWrenchScrewdriver } from "react-icons/hi2";

<<<<<<< HEAD
// Use a direct URL for development
const API_URL = "http://localhost:3001"; // Update this with your actual backend URL

const styles = {
  page: { margin: "70px 0 0 250px", padding: "20px" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#f0f0f0", padding: "10px", textAlign: "left" },
  td: { padding: "10px", borderBottom: "1px solid #ddd" },
  button: { 
    padding: "8px 16px", 
    background: "#007bff", 
    color: "white", 
    border: "none", 
    borderRadius: "4px",
    cursor: "pointer"
  },
  input: { 
    padding: "8px", 
    margin: "5px 0", 
    width: "100%",
    boxSizing: "border-box"
  },
  imagePreview: {
    width: "80px",
    height: "50px",
    objectFit: "cover",
    borderRadius: "4px"
  },
  form: {
    maxWidth: "500px",
    margin: "0 auto",
    padding: "20px",
    background: "white",
    borderRadius: "8px"
  },
  imageUpload: {
    margin: "10px 0",
    padding: "10px",
    border: "1px dashed #ccc",
    borderRadius: "4px",
    textAlign: "center"
  },
  formGroup: { marginBottom: "15px" },
  label: { display: "block", marginBottom: "5px" }
};

export default function SimpleCarPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    license_plate: "",
    no_of_seat: 4,
    rent_price: 0,
    status: "available",
    image_url: ""
  });
  const [currentCar, setCurrentCar] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch cars on component mount
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cars`);
      setCars(response.data);
    } catch (error) {
      console.error("Error fetching cars:", error);
      alert("Failed to load cars");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (currentCar) {
        await axios.put(`${API_URL}/api/cars/${currentCar.car_id}`, formData);
        alert("Car updated successfully");
      } else {
        await axios.post(`${API_URL}/api/cars`, formData);
        alert("Car added successfully");
      }
      fetchCars();
      setShowForm(false);
      setCurrentCar(null);
    } catch (error) {
      console.error("Error saving car:", error);
      alert(`Failed to ${currentCar ? 'update' : 'add'} car`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (carId) => {
    if (window.confirm("Are you sure you want to delete this car?")) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/api/cars/${carId}`);
        alert("Car deleted successfully");
        fetchCars();
      } catch (error) {
        console.error("Error deleting car:", error);
        alert("Failed to delete car");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredCars = cars.filter(car => 
    car.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    car.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;

=======
export default function AdminCarPage() {
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

  // Get the appropriate data and columns based on active tab
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
          columns: carColumns(setEditCar),
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
          columns: carColumns(setEditCar),
          title: "CARS",
          icon: HiTruck,
          emptyMessage: "There are no cars available.",
        };
    }
  }, [activeTab, carsData, maintenanceData]);

  // Single table instance
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

>>>>>>> origin/frontend
  return (
    <div style={styles.page}>
      <Header />
      <AdminSideBar />
<<<<<<< HEAD
      
      <div style={styles.header}>
        <h2>Manage Cars</h2>
        <button 
          style={styles.button}
          onClick={() => {
            setCurrentCar(null);
            setFormData({
              make: "",
              model: "",
              year: new Date().getFullYear(),
              license_plate: "",
              no_of_seat: 4,
              rent_price: 0,
              status: "available"
            });
            setShowForm(true);
          }}
        >
          Add New Car
        </button>
=======

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
>>>>>>> origin/frontend
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
