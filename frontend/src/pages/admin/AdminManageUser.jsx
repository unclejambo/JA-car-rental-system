import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import AddIcon from '@mui/icons-material/Add';
import ManageUserHeader from '../../ui/components/header/ManageUserHeader';
import ManageUserTable from '../../ui/components/table/ManageUserTable';
import Loading from '../../ui/components/Loading';
import AddStaffModal from '../../ui/components/modal/AddStaffModal';
import AddDriverModal from '../../ui/components/modal/AddDriverModal';
import { HiOutlineUserGroup } from 'react-icons/hi2';
// import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import { useUserStore } from '../../store/users';
import { AuthContext } from '../../contexts/AuthContext.js';

export default function AdminManageUser() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]); // local rows for DataGrid (transformed)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('CUSTOMER');
  const { user, userRole } = useContext(AuthContext);
  const [adminMeta, setAdminMeta] = useState(null); // fetched admin details if needed
  const effectiveUserType = (
    adminMeta?.user_type ||
    user?.user_type ||
    ''
  ).toLowerCase();
  const isStaffRestricted = effectiveUserType === 'staff';

  // Fetch admin meta if logged in as admin but user_type absent
  useEffect(() => {
    const fetchAdminMeta = async () => {
      try {
        if (userRole !== 'admin') return;
        if (user?.user_type) return; // already present
        if (!user?.id) return;
        const resp = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/admins/${user.id}`.replace(
            /\/$/,
            ''
          )
        );
        if (!resp.ok) return;
        const data = await resp.json();
        setAdminMeta(data);
      } catch (e) {
        console.warn('Failed to fetch admin meta:', e);
      }
    };
    fetchAdminMeta();
  }, [userRole, user]);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const openAddStaffModal = () => setShowAddStaffModal(true);
  const closeAddStaffModal = () => setShowAddStaffModal(false);

  const openAddDriverModal = () => setShowAddDriverModal(true);
  const closeAddDriverModal = () => setShowAddDriverModal(false);

  // (auth fetch removed for now; store calls public endpoints)

  // Zustand store selectors
  const loadCustomers = useUserStore((s) => s.loadCustomers);
  const loadAdmins = useUserStore((s) => s.loadAdmins);
  const loadDrivers = useUserStore((s) => s.loadDrivers);
  const getRowsForTab = useUserStore((s) => s.getRowsForTab);
  const storeLoading = useUserStore((s) => s.loading);
  const storeLoaded = useUserStore((s) => s.loaded);
  const storeError = useUserStore((s) => s.error);

  // load data when tab changes (only once per tab unless forced)
  useEffect(() => {
    let loader;
    if (activeTab === 'CUSTOMER' && !storeLoaded.CUSTOMER)
      loader = loadCustomers;
    if (activeTab === 'STAFF' && !storeLoaded.ADMIN) loader = loadAdmins;
    if (activeTab === 'DRIVER' && !storeLoaded.DRIVER) loader = loadDrivers;
    if (loader) loader();
  }, [activeTab, loadCustomers, loadAdmins, loadDrivers, storeLoaded]);

  // derive rows when store data changes or tab changes
  useEffect(() => {
    const raw = getRowsForTab(
      activeTab === 'STAFF' ? 'ADMIN' : activeTab // map STAFF -> ADMIN store key
    );
    // normalize shape
    const formatted = (raw || []).map((item) => {
      if (activeTab === 'CUSTOMER') {
        return {
          ...item,
          id: item.customer_id,
          contact_number: item.contact_no,
          status:
            item.status === true ||
            item.status === 'Active' ||
            item.status === 'active' ||
            item.status === 1 ||
            item.status === '1'
              ? 'Active'
              : 'Inactive',
        };
      }
      if (activeTab === 'STAFF') {
        return {
          ...item,
          id: item.admin_id,
          contact_number: item.contact_no,
          status: item.isActive ? 'Active' : 'Inactive',
        };
      }
      if (activeTab === 'DRIVER') {
        return {
          ...item,
          id: item.drivers_id,
          contact_number: item.contact_no,
          restriction: item.restriction || item.restrictions,
          expiryDate: item.expiryDate || item.expiry_date,
          status:
            item.status === true ||
            item.status === 'Active' ||
            item.status === 'active' ||
            item.status === 1 ||
            item.status === '1'
              ? 'Active'
              : 'Inactive',
        };
      }
      return item;
    });
    setRows(formatted);
  }, [
    activeTab,
    getRowsForTab,
    storeLoaded.CUSTOMER,
    storeLoaded.ADMIN,
    storeLoaded.DRIVER,
  ]);

  useEffect(() => {
    setLoading(storeLoading[activeTab === 'STAFF' ? 'ADMIN' : activeTab]);
  }, [storeLoading, activeTab]);

  useEffect(() => {
    setError(storeError);
  }, [storeError]);

  // Enforce staff can only stay on CUSTOMER tab
  useEffect(() => {
    if (isStaffRestricted && activeTab !== 'CUSTOMER') {
      setActiveTab('CUSTOMER');
    }
  }, [isStaffRestricted, activeTab]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Loading />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
          color="error.main"
        >
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Manage Users</title>
      <AddStaffModal show={showAddStaffModal} onClose={closeAddStaffModal} />
      <AddDriverModal show={showAddDriverModal} onClose={closeAddDriverModal} />

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
          {!isStaffRestricted && (
            <ManageUserHeader
              activeTab={activeTab}
              onTabChange={(tab) => {
                if (isStaffRestricted && tab !== 'CUSTOMER') return; // block
                setActiveTab(tab);
              }}
              user={
                adminMeta ? { ...user, user_type: adminMeta.user_type } : user
              }
            />
          )}
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
                <HiOutlineUserGroup
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                {isStaffRestricted ? 'CUSTOMERS' : activeTab}
              </Typography>
              {!isStaffRestricted && activeTab === 'STAFF' && (
                <Button
                  variant="outlined"
                  startIcon={
                    <AddIcon
                      sx={{ width: '18px', height: '18px', mt: '-2px' }}
                    />
                  }
                  onClick={openAddStaffModal}
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
              {!isStaffRestricted && activeTab === 'DRIVER' && (
                <Button
                  variant="outlined"
                  startIcon={
                    <AddIcon
                      sx={{ width: '18px', height: '18px', mt: '-2px' }}
                    />
                  }
                  onClick={openAddDriverModal}
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
              <ManageUserTable
                rows={rows}
                loading={loading}
                activeTab={activeTab}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
