import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { useState, useEffect, useMemo } from 'react';
import AddCarModal from '../../ui/components/modal/AddCarModal.jsx';
import EditCarModal from '../../ui/components/modal/EditCarModal.jsx';
import { HiTruck, HiWrenchScrewdriver } from 'react-icons/hi2';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ManageCarsHeader from '../../ui/components/header/ManageCarsHeader.jsx';
import ManageCarsTable from '../../ui/components/table/ManageCarsTable.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';

export default function AdminCarPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const authenticatedFetch = useMemo(() => createAuthenticatedFetch(logout), [logout]);
  const API_BASE = getApiBase();

  // UI state for the table fetch
  const [cars, setCars] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const response = await authenticatedFetch(`${API_BASE}/cars`);
        if (response.ok) {
          const data = await response.json();
          setCars(data || []);
        } else {
          setError('Failed to load cars');
        }
      } catch (error) {
        console.error('Failed to load cars:', error);
        setError('Failed to load cars');
      }
    };

    loadCars();
  }, [API_BASE, authenticatedFetch]); // Now authenticatedFetch is properly memoized

  const [activeTab, setActiveTab] = useState('CARS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCar, setEditCar] = useState(null);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);
  const closeEditModal = () => setEditCar(null);

  const handleDelete = async (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        const response = await authenticatedFetch(`${API_BASE}/cars/${carId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          // Remove car from local state
          setCars(cars.filter(car => car.car_id !== carId));
        } else {
          console.error('Failed to delete car');
        }
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

  // Format data for the table
  const formattedData = (cars || []).map((item) => {
    const rawStatus = String(item.car_status ?? item.status ?? '').toLowerCase();

    const status =
      rawStatus.includes('rent') || rawStatus === 'rented' || rawStatus === 'r'
        ? 'Rented'
        : rawStatus.includes('maint') || rawStatus.includes('maintenance') || rawStatus === 'm'
          ? 'Maintenance'
          : rawStatus.includes('avail') || rawStatus === 'available' || rawStatus === 'true' || rawStatus === '1' || item.is_available === true
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
                rows={formattedData}
                activeTab={activeTab}
                onEdit={handleEditRow}
                onDelete={handleDeleteRow}
              />
              {error && (
                <Box sx={{ p: 2, color: 'error.main' }}>
                  {error}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
