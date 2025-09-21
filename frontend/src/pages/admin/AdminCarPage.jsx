import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import React, { useState, useEffect } from 'react';
import { useCarStore } from '../../store/cars.js';
import { useMaintenanceStore } from '../../store/maintenance.js';
import AddCarModal from '../../ui/components/modal/AddCarModal.jsx';
import EditCarModal from '../../ui/components/modal/EditCarModal.jsx';
import { HiTruck, HiWrenchScrewdriver } from 'react-icons/hi2';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageCarsHeader from '../../ui/components/header/ManageCarsHeader.jsx';
import ManageCarsTable from '../../ui/components/table/ManageCarsTable.jsx';

export default function AdminCarPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { cars, init } = useCarStore();

  // new UI state for the table fetch
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const [activeTab, setActiveTab] = useState('CARS');
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

  // wrapper handlers passed to the table
  const handleEditRow = (row) => {
    setEditCar(row);
  };

  const handleDeleteRow = (row) => {
    // try a few keys to find the id
    const id = row?.car_id ?? row?.transactionId ?? row?.id;
    if (id != null) handleDelete(id);
  };

  const API_BASE = (
    import.meta.env.VITE_API_URL || 'http://localhost:5000'
  ).replace(/\/$/, '');

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/cars`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedData = (data || []).map((item, idx) => {
        const rawStatus = String(
          item.car_status ??
            item.status ??
            (item.status?.toString ? item.status.toString() : '')
        ).toLowerCase();

        const status =
          rawStatus.includes('rent') ||
          rawStatus === 'rented' ||
          rawStatus === 'r'
            ? 'Rented'
            : rawStatus.includes('maint') ||
                rawStatus.includes('maintenance') ||
                rawStatus === 'm'
              ? 'Maintenance'
              : rawStatus.includes('avail') ||
                  rawStatus === 'available' ||
                  rawStatus === 'true' ||
                  rawStatus === '1' ||
                  item.is_available === true
                ? 'Available'
                : 'Available';

        return {
          id: item.car_id,
          transactionId: item.car_id,
          car_id: item.car_id,
          make: item.make ?? '',
          model: item.model ?? '',
          type: item.type ?? item.car_status ?? '',
          year: item.year ?? '',
          mileage: item.mileage ?? '',
          no_of_seat: item.no_of_seat ?? item.no_of_seat,
          rent_price: item.rent_price ?? item.rent_price,
          license_plate: item.license_plate ?? item.license_plate,
          image: item.car_img_url ?? item.image ?? '',
          status,
          raw: item,
        };
      });
      setRows(formattedData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Car Management</title>

      <AddCarModal show={showAddModal} onClose={closeAddModal} />
      <EditCarModal show={!!editCar} onClose={closeEditModal} car={editCar} />

      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: `calc(100% - 18.7dvw)`,
          ml: {
            xs: '0px',
            sm: '0px',
            md: '18.7dvw',
            lg: '18.7dvw',
          },
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' }, // Adjust based on your header height
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ManageCarsHeader activeTab={activeTab} onTabChange={setActiveTab} />
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f9f9f9',
              p: { xs: 1, sm: 2, md: 2, lg: 2 },
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 4px 0 6px -1px rgba(0, 0, 0, 0.1), -4px 0 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              height: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: '1.8rem',
                  color: '#000',
                  '@media (max-width: 1024px)': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                {activeTab === 'CARS' ? (
                  <HiTruck
                    style={{ verticalAlign: '-3px', marginRight: '5px' }}
                  />
                ) : (
                  <HiWrenchScrewdriver
                    style={{ verticalAlign: '-3px', marginRight: '5px' }}
                  />
                )}

                {activeTab}
              </Typography>
              {activeTab === 'CARS' && (
                <Button
                  variant="outlined"
                  startIcon={
                    <AddIcon
                      sx={{ width: '18px', height: '18px', mt: '-2px' }}
                    />
                  }
                  onClick={openAddModal}
                  sx={{
                    color: '#fff',
                    p: 1,
                    pb: 0.5,
                    height: 36,
                    border: 'none',
                    backgroundColor: '#c10007',
                    '&:hover': {
                      backgroundColor: '#a00006',
                      color: '#fff',
                      fontWeight: 600,
                      borderColor: '#4a4a4a',
                      boxShadow: 'none',
                    },
                    '@media (max-width: 600px)': {
                      height: 28,
                    },
                  }}
                >
                  Add New {activeTab}
                </Button>
              )}
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <ManageCarsTable
                rows={rows}
                loading={loading}
                activeTab={activeTab}
                onEdit={handleEditRow}
                onDelete={handleDeleteRow}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
