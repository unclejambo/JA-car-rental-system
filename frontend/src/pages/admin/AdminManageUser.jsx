import React, { useState, useEffect } from 'react';
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

export default function AdminManageUser() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('CUSTOMER');

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);

  const openAddStaffModal = () => setShowAddStaffModal(true);
  const closeAddStaffModal = () => setShowAddStaffModal(false);

  const openAddDriverModal = () => setShowAddDriverModal(true);
  const closeAddDriverModal = () => setShowAddDriverModal(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'http://localhost:3001/customers'
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const formattedData = data.map((item) => ({
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
        color="error.main"
      >
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
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
          <ManageUserHeader activeTab={activeTab} onTabChange={setActiveTab} />
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
                    fontSize: '2rem',
                  },
                }}
              >
                <HiOutlineUserGroup
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                {activeTab}
              </Typography>
              {activeTab === 'STAFF' && (
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
              {activeTab === 'DRIVER' && (
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
