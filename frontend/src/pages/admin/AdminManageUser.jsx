import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import AddIcon from '@mui/icons-material/Add';
import ManageUserHeader from '../../ui/components/header/ManageUserHeader';
import ManageUserTable from '../../ui/components/table/ManageUserTable';
import SearchBar from '../../ui/components/SearchBar';
import Loading from '../../ui/components/Loading';
import AddStaffModal from '../../ui/components/modal/AddStaffModal';
import AddDriverModal from '../../ui/components/modal/AddDriverModal';
import AddCustomerModal from '../../ui/components/modal/AddCustomerModal';
import { HiOutlineUserGroup } from 'react-icons/hi2';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';

export default function AdminManageUser() {
  const { userRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

  const openAddStaffModal = () => setShowAddStaffModal(true);
  const closeAddStaffModal = () => setShowAddStaffModal(false);

  const openAddDriverModal = () => setShowAddDriverModal(true);
  const closeAddDriverModal = () => setShowAddDriverModal(false);

  const openAddCustomerModal = () => setShowAddCustomerModal(true);
  const closeAddCustomerModal = () => setShowAddCustomerModal(false);

  // create auth-aware fetch and API base with useMemo to prevent infinite loops
  const authFetch = useMemo(
    () =>
      createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }),
    []
  );
  const API_BASE = getApiBase().replace(/\/$/, '');

  const fetchData = useCallback(
    async (tabType = activeTab) => {
      setLoading(true);
      setError(null);

      // Restrict staff users to only access customer data
      if (userRole === 'staff' && tabType !== 'CUSTOMER') {
        setError('Access denied. Staff can only view customer data.');
        setLoading(false);
        return;
      }

      try {
        let endpoint = '';
        switch (tabType) {
          case 'CUSTOMER':
            endpoint = `${API_BASE}/api/customers`; // ✅ Fixed: Added /api prefix
            break;
          case 'STAFF':
            endpoint = `${API_BASE}/admins`;
            break;
          case 'DRIVER':
            endpoint = `${API_BASE}/drivers`;
            break;
          default:
            endpoint = `${API_BASE}/api/customers`; // ✅ Fixed: Added /api prefix
        }

        const response = await authFetch(endpoint, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const response_data = await response.json();

        // Handle paginated response - extract data array
        const data = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];

        let formattedData = [];

        if (tabType === 'CUSTOMER') {
          formattedData = data.map((item) => ({
            ...item,
            id: item.customer_id, // required by DataGrid
            contact_number: item.contact_no,
            // normalize status explicitly so strings like 'inactive' don't become truthy -> Active
            status:
              item.status === true ||
              item.status === 'Active' ||
              item.status === 'active' ||
              item.status === 1 ||
              item.status === '1'
                ? 'Active'
                : 'Inactive',
          }));
        } else if (tabType === 'STAFF') {
          formattedData = data.map((item) => ({
            ...item,
            id: item.admin_id, // required by DataGrid
            contact_number: item.contact_no,
            status:
              item.isActive === true || item.isActive === null
                ? 'Active'
                : 'Inactive',
            user_type: item.user_type, // Ensure user_type is passed through for admin detection
          }));
        } else if (tabType === 'DRIVER') {
          formattedData = data.map((item) => ({
            ...item,
            id: item.drivers_id, // required by DataGrid
            contact_number: item.contact_no,
            status:
              item.status === true ||
              item.status === 'Active' ||
              item.status === 'active' ||
              item.status === 1 ||
              item.status === '1'
                ? 'Active'
                : 'Inactive',
          }));
        }

        setRows(formattedData);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    },
    [authFetch, API_BASE, activeTab, userRole]
  );

  // Filter rows based on search query
  const getFilteredRows = () => {
    if (!rows || rows.length === 0) return [];

    if (!searchQuery) return rows;

    const query = searchQuery.toLowerCase().trim();

    return rows.filter((row) => {
      // Search by first name
      if (row.first_name?.toLowerCase().includes(query)) return true;

      // Search by last name
      if (row.last_name?.toLowerCase().includes(query)) return true;

      // Search by email
      if (row.email?.toLowerCase().includes(query)) return true;

      // Search by username
      if (row.username?.toLowerCase().includes(query)) return true;

      // Search by contact number
      if (row.contact_number?.toLowerCase().includes(query)) return true;

      // Search by address
      if (row.address?.toLowerCase().includes(query)) return true;

      // Search by status
      if (row.status?.toLowerCase().includes(query)) return true;

      // Search by driver license number (for CUSTOMER and DRIVER tabs)
      if (row.driver_license_no?.toLowerCase().includes(query)) return true;

      // Search by fb_link (for CUSTOMER tab)
      if (row.fb_link?.toLowerCase().includes(query)) return true;

      return false;
    });
  };

  // Force staff users to stay on CUSTOMER tab
  useEffect(() => {
    if (userRole === 'staff' && activeTab !== 'CUSTOMER') {
      setActiveTab('CUSTOMER');
    }
  }, [userRole, activeTab]);

  // Fetch data when component mounts or when activeTab changes
  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab, fetchData]);

  const handleStaffSuccess = useCallback(() => {
    fetchData('STAFF');
  }, [fetchData]);

  const handleDriverSuccess = useCallback(() => {
    fetchData('DRIVER');
  }, [fetchData]);

  const handleCustomerSuccess = useCallback(() => {
    fetchData('CUSTOMER');
  }, [fetchData]);

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Manage Users</title>
      <AddStaffModal
        show={showAddStaffModal}
        onClose={closeAddStaffModal}
        onSuccess={handleStaffSuccess}
      />
      <AddDriverModal
        show={showAddDriverModal}
        onClose={closeAddDriverModal}
        onSuccess={handleDriverSuccess}
      />
      <AddCustomerModal
        show={showAddCustomerModal}
        onClose={closeAddCustomerModal}
        onSuccess={handleCustomerSuccess}
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
          {/* Show header with filtered tabs based on user type */}

          {userRole !== 'staff' && (
            <ManageUserHeader
              activeTab={activeTab}
              onTabChange={(tab) => {
                // Prevent staff users from accessing STAFF and DRIVER tabs
                setActiveTab(tab);
              }}
              userType={userRole}
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
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                mb: 2,
                gap: { xs: 1, sm: 1 },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flex: { md: 1 },
                  gap: { xs: 1, sm: 1 },
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                  sx={{
                    fontSize: { xs: '1.3rem', sm: '1.5rem', md: '1.8rem' },
                    color: '#000',
                  }}
                >
                  <HiOutlineUserGroup
                    style={{ verticalAlign: '-3px', marginRight: '5px' }}
                  />
                  {activeTab}
                </Typography>

                {/* Add New Customer button */}
                {activeTab === 'CUSTOMER' && (
                  <Button
                    variant="outlined"
                    startIcon={
                      <AddIcon
                        sx={{
                          width: { xs: '14px', md: '18px' },
                          height: { xs: '14px', md: '18px' },
                          mt: '-3px',
                        }}
                      />
                    }
                    onClick={openAddCustomerModal}
                    sx={{
                      color: '#fff',
                      p: 1,
                      height: { xs: 26, md: 30 },
                      fontSize: { xs: '.7rem', md: '.875rem' },
                      border: 'none',
                      backgroundColor: '#c10007',
                      minWidth: 150,
                      '&:hover': {
                        backgroundColor: '#a00006',
                        color: '#fff',
                        fontWeight: 600,
                        borderColor: '#4a4a4a',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add New {activeTab}
                  </Button>
                )}

                {/* Hide Add buttons for staff users */}
                {userRole !== 'staff' && activeTab === 'STAFF' && (
                  <Button
                    variant="outlined"
                    startIcon={
                      <AddIcon
                        sx={{
                          width: { xs: '14px', md: '18px' },
                          height: { xs: '14px', md: '18px' },
                          mt: '-3px',
                        }}
                      />
                    }
                    onClick={openAddStaffModal}
                    sx={{
                      color: '#fff',
                      p: 1,
                      height: { xs: 26, md: 30 },
                      fontSize: { xs: '.7rem', md: '.875rem' },
                      border: 'none',

                      backgroundColor: '#c10007',

                      minWidth: 150,
                      '&:hover': {
                        backgroundColor: '#a00006',
                        color: '#fff',
                        fontWeight: 600,
                        borderColor: '#4a4a4a',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add New {activeTab}
                  </Button>
                )}
                {userRole !== 'staff' && activeTab === 'DRIVER' && (
                  <Button
                    variant="outlined"
                    startIcon={
                      <AddIcon
                        sx={{
                          width: { xs: '14px', md: '18px' },
                          height: { xs: '14px', md: '18px' },
                          mt: '-3px',
                        }}
                      />
                    }
                    onClick={openAddDriverModal}
                    sx={{
                      color: '#fff',
                      p: 1,
                      height: { xs: 26, md: 30 },
                      fontSize: { xs: '.7rem', md: '.875rem' },
                      border: 'none',
                      backgroundColor: '#c10007',
                      minWidth: 150,
                      '&:hover': {
                        backgroundColor: '#a00006',
                        color: '#fff',
                        fontWeight: 600,
                        borderColor: '#4a4a4a',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    Add New {activeTab}
                  </Button>
                )}
              </Box>
              {/* Search Bar */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <SearchBar
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeTab.toLowerCase()}...`}
                  variant="outlined"
                  size="small"
                  sx={{
                    width: { xs: '100%', md: 350 },
                    maxWidth: { xs: '100%', md: 350 },
                    height: { xs: 26, md: 30 },
                    backgroundColor: '#fff',
                    '& .MuiOutlinedInput-root': {
                      height: { xs: 26, md: 30 },
                      backgroundColor: '#fff',
                    },
                    '& .MuiInputBase-input': {
                      padding: { xs: '4px 8px', md: '6px 10px' },
                    },
                  }}
                />
              </Box>
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
                rows={getFilteredRows()}
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
