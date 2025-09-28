import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import React, { useState, useEffect } from 'react';
import AddCarModal from '../../ui/components/modal/AddCarModal.jsx';
import EditCarModal from '../../ui/components/modal/EditCarModal.jsx';
import MaintenanceModal from '../../ui/components/modal/MaintenanceModal.jsx';
import ExtendMaintenanceModal from '../../ui/components/modal/ExtendMaintenanceModal.jsx';
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
  const authenticatedFetch = createAuthenticatedFetch(logout);
  const API_BASE = getApiBase();

  const [cars, setCars] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [error, setError] = useState(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showExtendMaintenanceModal, setShowExtendMaintenanceModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [pendingStatus, setPendingStatus] = useState(null); // { carId, previousStatus }
  const [activeTab, setActiveTab] = useState('CARS');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCar, setEditCar] = useState(null);

  // Normalize maintenance records so table renderers can read consistent keys
  function normalizeMaintenanceRecord(rec, model = '') {
    const pick = (v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(v);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    };
    const rawStart =
      rec?.maintenance_start_date ?? rec?.start_date ?? rec?.startDate ?? rec?.start ?? null;
    const rawEnd =
      rec?.maintenance_end_date ?? rec?.end_date ?? rec?.endDate ?? rec?.end ?? null;
    const startStr = pick(rawStart);
    const endStr = pick(rawEnd);

    return {
      ...rec, // spread first so our normalized aliases overwrite
      model: model ?? rec?.model ?? '',
      // very common short keys
      start: startStr,
      end: endStr,
      // canonical camel
      startDate: startStr,
      endDate: endStr,
      // snake
      start_date: startStr,
      end_date: endStr,
      // backend names kept in sync
      maintenance_start_date: startStr,
      maintenance_end_date: endStr,
    };
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === 'CARS') {
          console.log('Fetching cars from:', `${API_BASE}/cars`);
          const response = await authenticatedFetch(`${API_BASE}/cars`);
          console.log('Cars response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('Raw cars data received:', data);
            console.log('Number of cars received:', (data || []).length);
            setCars(data || []);
          } else {
            const errorText = await response.text();
            console.error('Failed to load cars. Status:', response.status, 'Error:', errorText);
            setError('Failed to load cars');
          }
        } else if (activeTab === 'MAINTENANCE') {
          const response = await authenticatedFetch(`${API_BASE}/cars`);
          if (response.ok) {
            const carsData = await response.json();

            // Only include cars currently set to Maintenance
            const maintenanceCars = carsData.filter((c) => {
              const s = String(c.car_status || '').toLowerCase();
              return s.includes('maint');
            });

            // Fetch maintenance records only for those cars
            const maintenanceResponses = await Promise.all(
              maintenanceCars.map((car) =>
                authenticatedFetch(`${API_BASE}/cars/${car.car_id}/maintenance`)
              )
            );
            const maintenanceDataArrays = await Promise.all(
              maintenanceResponses.map((res) => res.json())
            );

            // Debug log to check raw maintenance data from API
            console.log('Raw maintenance data from API:', maintenanceDataArrays);

            // For each car, pick the latest maintenance record (by start date)
            const latestByCarId = new Map();
            maintenanceDataArrays.forEach((arr) => {
              (arr || []).forEach((rec) => {
                const existing = latestByCarId.get(rec.car_id);
                const recStart = rec.maintenance_start_date
                  ? new Date(rec.maintenance_start_date).getTime()
                  : 0;
                const exStart = existing && existing.maintenance_start_date
                  ? new Date(existing.maintenance_start_date).getTime()
                  : 0;
                if (!existing || recStart >= exStart) {
                  latestByCarId.set(rec.car_id, rec);
                }
              });
            });

            const rows = Array.from(latestByCarId.values()).map((m) => {
              const model = (maintenanceCars.find((c) => c.car_id === m.car_id)?.model) || '';
              const normalized = normalizeMaintenanceRecord(m, model);
              // Debug log to check the normalized data
              console.log('Normalized maintenance record:', normalized);
              return normalized;
            });

            setMaintenanceData(rows);
          } else {
            setError('Failed to load maintenance data');
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load data');
      }
    };

    loadData();
  }, [activeTab, API_BASE, authenticatedFetch, reloadTick]);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);
  const closeEditModal = () => {
    setEditCar(null);
    // trigger reload to reflect any edits
    setReloadTick((t) => t + 1);
  };

  const handleSaveMaintenance = async (maintenanceData) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/cars/${selectedCar.car_id}/maintenance`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(maintenanceData),
        }
      );

      if (response.ok) {
        // Persist car_status=Maintenance if pending
        const carId = selectedCar.car_id;
        if (pendingStatus && pendingStatus.carId === carId) {
          try {
            const resp = await authenticatedFetch(`${API_BASE}/cars/${carId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ car_status: 'Maintenance' }),
            });
            if (resp.ok) {
              setCars((prev) => (prev || []).map((c) => (c.car_id === carId ? { ...c, car_status: 'Maintenance' } : c)));
            }
          } catch {}
        }
        setShowMaintenanceModal(false);
        setSelectedCar(null);
        setPendingStatus(null);
        // If currently on MAINTENANCE tab, add this new record (use latest only per car)
        if (activeTab === 'MAINTENANCE') {
          try {
            const maintenanceResponse = await authenticatedFetch(
              `${API_BASE}/cars/${selectedCar.car_id}/maintenance`
            );
            const list = await maintenanceResponse.json();
            const latest = (list || []).reduce((acc, cur) => {
              const t = cur.maintenance_start_date
                ? new Date(cur.maintenance_start_date).getTime()
                : 0;
              const ta = acc && acc.maintenance_start_date
                ? new Date(acc.maintenance_start_date).getTime()
                : 0;
              return t >= ta ? cur : acc;
            }, null);
            if (latest) {
              setMaintenanceData((prev) => {
                const filtered = prev.filter((m) => m.car_id !== selectedCar.car_id);
                return [
                  ...filtered,
                  normalizeMaintenanceRecord(
                    latest,
                    selectedCar?.model || selectedCar?.raw?.model || ''
                  ),
                ];
              });
            }
          } catch (e) {
            // noop
          }
        }
        // Ensure user sees it in the Maintenance tab
        setActiveTab('MAINTENANCE');
        setReloadTick((t) => t + 1);
      } else {
        console.error('Failed to save maintenance data');
      }
    } catch (error) {
      console.error('Failed to save maintenance data:', error);
    }
  };

  const handleCancelMaintenance = () => {
    // Revert dropdown to previous status if we had a pending change
    if (pendingStatus?.carId) {
      const { carId, previousStatus } = pendingStatus;
      // Map previousStatus back to car_status string
      const raw = previousStatus;
      setCars((prev) => (prev || []).map((c) => (c.car_id === carId ? { ...c, car_status: raw } : c)));
      setPendingStatus(null);
    }
    setShowMaintenanceModal(false);
    setSelectedCar(null);
    setReloadTick((t) => t + 1);
  };

  const handleExtendMaintenance = async (maintenanceId, data) => {
    try {
      if (!selectedMaintenance) return;
      const response = await authenticatedFetch(
        `${API_BASE}/cars/${selectedMaintenance.car_id}/maintenance/${maintenanceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        setShowExtendMaintenanceModal(false);
        setSelectedMaintenance(null);
        // Update list locally (only end date changed)
        const newEnd = data.end_date;
        setMaintenanceData((prev) =>
          prev.map((m) =>
            m.maintenance_id === maintenanceId
              ? normalizeMaintenanceRecord({ ...m, maintenance_end_date: newEnd }, m.model)
              : m
          )
        );
      } else {
        console.error('Failed to extend maintenance');
      }
    } catch (error) {
      console.error('Failed to extend maintenance:', error);
    }
  };

  const handleSetAvailable = async (maintenance) => {
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/cars/${maintenance.car_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ car_status: 'Available' }),
        }
      );

      if (response.ok) {
        // Refresh cars and remove this car from maintenance list
        try {
          const carsResponse = await authenticatedFetch(`${API_BASE}/cars`);
          const carsData = await carsResponse.json();
          setCars(carsData || []);
        } catch { /* ignore */ }
        setMaintenanceData((prev) => prev.filter((m) => m.car_id !== maintenance.car_id));
      } else {
        console.error('Failed to set car to available');
      }
    } catch (error) {
      console.error('Failed to set car to available:', error);
    }
  };

  const handleDelete = async (carId) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        const response = await authenticatedFetch(`${API_BASE}/cars/${carId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setCars(cars.filter((car) => car.car_id !== carId));
        } else {
          console.error('Failed to delete car');
        }
      } catch (error) {
        console.error('Failed to delete car:', error);
      }
    }
  };

  const handleEditRow = (row) => {
    setEditCar(row);
  };

  const handleDeleteRow = (row) => {
    const id = row?.car_id ?? row?.transactionId ?? row?.id;
    if (id != null) handleDelete(id);
  };

  const handleTableStatusChange = async (row, newStatus) => {
    const carId = row?.car_id ?? row?.id;
    if (!carId) return;
    try {
      if (newStatus === 'Maintenance') {
        // Force user to complete Maintenance modal BEFORE persisting status
        // Remember previous status so we can revert if cancelled
        const prev = row.status || 'Available';
        setPendingStatus({ carId, previousStatus: prev });
        setSelectedCar(row);
        setShowMaintenanceModal(true);
        // Do not persist yet; also trigger re-render so dropdown snaps back
        setReloadTick((t) => t + 1);
      } else {
        // Persist non-maintenance statuses immediately
        const resp = await authenticatedFetch(`${API_BASE}/cars/${carId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ car_status: newStatus }),
        });
        if (!resp.ok) throw new Error('Failed to update status');

        // Update local cars state
        setCars((prev) => (prev || []).map((c) => (c.car_id === carId ? { ...c, car_status: newStatus } : c)));
        // If leaving maintenance, remove from maintenanceData
        setMaintenanceData((prev) => prev.filter((m) => m.car_id !== carId));
      }
    } catch (e) {
      console.error('Status update failed:', e);
      alert('Failed to update status. Please try again.');
    }
  };

  const formattedData = (cars || []).map((item) => {
    console.log('Raw car data from API:', item);
    const rawStatus = String(item.car_status ?? item.status ?? '').toLowerCase();

    const status =
      rawStatus.includes('rent') || rawStatus === 'rented' || rawStatus === 'r'
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
      type: item.make ?? 'N/A', // Use make field for type display since type column doesn't exist
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
      <EditCarModal
        show={!!editCar}
        onClose={closeEditModal}
        car={editCar}
        onStatusChange={(car, status) => {
          if (status === 'Maintenance') {
            setSelectedCar(car);
            setShowMaintenanceModal(true);
          }
          // Optimistically update local cars state so Maintenance tab picks it up
          if (car?.car_id) {
            setCars((prev) =>
              (prev || []).map((c) =>
                c.car_id === car.car_id ? { ...c, car_status: status } : c
              )
            );
          }
        }}
      />
      <MaintenanceModal
        show={showMaintenanceModal}
        onClose={handleCancelMaintenance}
        car={selectedCar}
        onSave={handleSaveMaintenance}
      />
      <ExtendMaintenanceModal
        show={showExtendMaintenanceModal}
        onClose={() => setShowExtendMaintenanceModal(false)}
        maintenance={selectedMaintenance}
        onSave={handleExtendMaintenance}
      />

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
                rows={activeTab === 'CARS' ? formattedData : maintenanceData}
                activeTab={activeTab}
                onEdit={handleEditRow}
                onDelete={handleDeleteRow}
                onStatusChange={handleTableStatusChange}
                onExtend={(row) => {
                  setSelectedMaintenance(row);
                  setShowExtendMaintenanceModal(true);
                }}
                onSetAvailable={handleSetAvailable}
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
