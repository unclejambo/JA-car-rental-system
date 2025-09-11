import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import '../../styles/admincss/admincar.css';
import React, { useMemo, useState, useEffect } from 'react';
import { carColumns } from '../accessor/CarColumns.jsx';
import { useCarStore } from '../../store/cars.js';
import { carMaintenanceColumns } from '../accessor/CarMaintenanceColumns.jsx';
import { useMaintenanceStore } from '../../store/maintenance.js';
import AddCarModal from '../../ui/components/modal/AddCarModal.jsx';
import EditCarModal from '../../ui/components/modal/EditCarModal.jsx';
import { AiOutlinePlus } from 'react-icons/ai';
import { HiTruck, HiWrenchScrewdriver } from 'react-icons/hi2';
import AdminTable from '../../ui/components/AdminTable';

export default function AdminCarPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const [activeTab, setActiveTab] = useState('cars');
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
      case 'cars':
        return {
          data: carsData,
          columns: carColumns(setEditCar, handleDelete),
          title: 'CARS',
          icon: HiTruck,
          emptyMessage: 'There are no cars available.',
        };
      case 'maintenance':
        return {
          data: maintenanceData,
          columns: carMaintenanceColumns,
          title: 'MAINTENANCE',
          icon: HiWrenchScrewdriver,
          emptyMessage: 'There are no maintenance requests yet.',
        };
      default:
        return {
          data: carsData,
          columns: carColumns(setEditCar, handleDelete),
          title: 'CARS',
          icon: HiTruck,
          emptyMessage: 'There are no cars available.',
        };
    }
  }, [activeTab, carsData, maintenanceData]);

  const getButtonClass = (tabName) =>
    `user-type-btn ${activeTab === tabName ? 'active' : ''}`;

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <AddCarModal show={showAddModal} onClose={closeAddModal} />
      <EditCarModal show={!!editCar} onClose={closeEditModal} car={editCar} />

      <div className="page-container">
        <div className="cars-container">
          <button
            className={getButtonClass('cars')}
            onClick={() => setActiveTab('cars')}
          >
            CARS
          </button>
          <button
            className={getButtonClass('maintenance')}
            onClick={() => setActiveTab('maintenance')}
          >
            MAINTENANCE
          </button>
        </div>
        <div>
          <title>Manage Cars</title>

          {activeTab === 'cars' && (
            <button className="add-car-btn" onClick={openAddModal}>
              <AiOutlinePlus className="add-icon" style={{ marginRight: 6 }} />
              ADD NEW CAR
            </button>
          )}

          <AdminTable
            data={data}
            columns={columns}
            title={title}
            Icon={TabIcon}
            emptyMessage={emptyMessage}
            pageSize={10}
          />
        </div>
      </div>
    </>
  );
}
