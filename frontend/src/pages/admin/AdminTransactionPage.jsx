import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { FaFileCsv } from 'react-icons/fa';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { HiDocumentCurrencyDollar } from 'react-icons/hi2';
import TransactionLogsHeader from '../../ui/components/header/TransactionLogsHeader';
import TransactionLogsTable from '../../ui/components/table/TranscationLogsTable';
import SearchBar from '../../ui/components/SearchBar';
import BookingDetailsModal from '../../ui/components/modal/BookingDetailsModal';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
import Loading from '../../ui/components/Loading';
import { useTransactionStore } from '../../store/transactions';
import AddPaymentModal from '../../ui/components/modal/AddPaymentModal';
import AddRefundModal from '../../ui/components/modal/AddRefundModal';
import { generateTransactionPDF } from '../../utils/pdfExport';
import { generateTransactionCSV } from '../../utils/csvExport';

export default function AdminTransactionPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadTransactions = useTransactionStore((s) => s.loadTransactions);
  const loadPayments = useTransactionStore((s) => s.loadPayments);
  const loadRefunds = useTransactionStore((s) => s.loadRefunds);
  const loaded = useTransactionStore((s) => s.loaded);
  const storeLoading = useTransactionStore((s) => s.loading);
  const [activeTab, setActiveTab] = useState('TRANSACTIONS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingDetailsModal, setShowBookingDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  // Original rows from store
  const storeRows = useTransactionStore((s) => s.getRowsForTab(activeTab));
  // Apply filtering rules per requirement:
  // For TRANSACTIONS tab we only show entries that are completed OR cancelled.
  // Backend does not send an explicit status field; we infer status from the
  // presence of completionDate or cancellationDate (returned by /transactions).
  // For PAYMENT tab, exclude rows where description is 'User Booked the Car'.
  const rows = React.useMemo(() => {
    if (!Array.isArray(storeRows)) return [];
    if (activeTab === 'TRANSACTIONS') {
      return storeRows.filter((r) => {
        return Boolean(r?.completionDate) || Boolean(r?.cancellationDate);
      });
    }
    if (activeTab === 'PAYMENT') {
      return storeRows.filter((r) => r?.description !== 'User Booked the Car');
    }
    return storeRows; // REFUND unchanged
  }, [storeRows, activeTab]);

  // Filter rows based on search query
  const getFilteredRows = () => {
    if (!rows || rows.length === 0) return [];

    if (!searchQuery) return rows;

    const query = searchQuery.toLowerCase().trim();

    return rows.filter((row) => {
      // Search by customer name
      if (row.customerName?.toLowerCase().includes(query)) return true;

      // Search by car model
      if (row.carModel?.toLowerCase().includes(query)) return true;

      // Search by booking date
      if (row.bookingDate?.toLowerCase().includes(query)) return true;

      // Search by completion date (TRANSACTIONS tab)
      if (row.completionDate?.toLowerCase().includes(query)) return true;

      // Search by cancellation date (TRANSACTIONS tab)
      if (row.cancellationDate?.toLowerCase().includes(query)) return true;

      // Search by payment method (PAYMENT tab)
      if (row.paymentMethod?.toLowerCase().includes(query)) return true;

      // Search by reference number (PAYMENT & REFUND tabs)
      if (row.referenceNo?.toLowerCase().includes(query)) return true;

      // Search by GCash number (PAYMENT & REFUND tabs)
      if (row.gCashNo?.toLowerCase().includes(query)) return true;

      // Search by total amount (PAYMENT tab)
      if (row.totalAmount?.toString().toLowerCase().includes(query))
        return true;

      // Search by paid date (PAYMENT tab)
      if (row.paidDate?.toLowerCase().includes(query)) return true;

      // Search by description (PAYMENT & REFUND tabs)
      if (row.description?.toLowerCase().includes(query)) return true;

      // Search by refund method (REFUND tab)
      if (row.refundMethod?.toLowerCase().includes(query)) return true;

      // Search by refund amount (REFUND tab)
      if (row.refundAmount?.toString().toLowerCase().includes(query))
        return true;

      // Search by refund date (REFUND tab)
      if (row.refundDate?.toLowerCase().includes(query)) return true;

      return false;
    });
  };

  // Fetch booking details by bookingId and open modal
  const openBookingDetails = async (bookingId) => {
    if (!bookingId) return;
    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');
      const res = await authFetch(`${API_BASE}/bookings/${bookingId}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load booking details');
      const data = await res.json();
      // Pass the raw booking data - BookingDetailsModal expects the original field names
      const mapped = {
        ...data, // Include all original fields
        // Add/ensure required fields for the modal
        booking_id: data.booking_id,
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        car_id: data.car_id,
        car_model: data.car_model,
        drivers_id: data.drivers_id,
        driver_name: data.driver_name,
        booking_date: data.booking_date,
        purpose: data.purpose,
        start_date: data.start_date,
        end_date: data.end_date,
        pickup_time: data.pickup_time,
        dropoff_time: data.dropoff_time,
        pickup_loc: data.pickup_loc,
        dropoff_loc: data.dropoff_loc,
        isSelfDriver: data.isSelfDriver,
        total_amount: data.total_amount,
        balance: data.balance,
        total_paid: data.total_paid,
        payment_status: data.payment_status,
        booking_status: data.booking_status,
        isExtend: data.isExtend,
        isCancel: data.isCancel,
        isDeliver: data.isDeliver,
        isRelease: data.isRelease,
        isReturned: data.isReturned,
        new_end_date: data.new_end_date,
        deliver_loc: data.deliver_loc,
      };
      setSelectedBooking(mapped);
      setShowBookingDetailsModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const closeBookingDetails = () => {
    setShowBookingDetailsModal(false);
    setSelectedBooking(null);
  };

  // console.log('AdminTransactionPage - Rows:', rows);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const openAddPaymentModal = () => setShowAddPaymentModal(true);
  const closeAddPaymentModal = () => setShowAddPaymentModal(false);

  const [showAddRefundModal, setShowAddRefundModal] = useState(false);
  const openAddRefundModal = () => setShowAddRefundModal(true);
  const closeAddRefundModal = () => setShowAddRefundModal(false);

  // Download menu state
  const [downloadAnchorEl, setDownloadAnchorEl] = useState(null);
  const downloadMenuOpen = Boolean(downloadAnchorEl);

  const handleDownloadClick = (event) => {
    setDownloadAnchorEl(event.currentTarget);
  };

  const handleDownloadClose = () => {
    setDownloadAnchorEl(null);
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    generateTransactionPDF(activeTab, rows);
    handleDownloadClose();
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    generateTransactionCSV(activeTab, rows);
    handleDownloadClose();
  };

  // Initial & on-tab-change data loader
  useEffect(() => {
    const load = async () => {
      try {
        if (activeTab === 'TRANSACTIONS' && !loaded.TRANSACTIONS)
          await loadTransactions();
        if (activeTab === 'PAYMENT' && !loaded.PAYMENT) await loadPayments();
        if (activeTab === 'REFUND' && !loaded.REFUND) await loadRefunds();
        setLoading(false);
      } catch (e) {
        console.error(e);
        setError('Failed to load data. Please try again later.');
        setLoading(false);
      }
    };
    load();
  }, [activeTab, loaded, loadTransactions, loadPayments, loadRefunds]);

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
      <title>Transactions</title>
      <AddPaymentModal
        show={showAddPaymentModal}
        onClose={closeAddPaymentModal}
      />
      <AddRefundModal show={showAddRefundModal} onClose={closeAddRefundModal} />
      <BookingDetailsModal
        open={showBookingDetailsModal}
        onClose={closeBookingDetails}
        booking={selectedBooking}
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
          <TransactionLogsHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
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
                  gap: { xs: 1, sm: 5 },
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                      fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      mb: 0,
                    }}
                  >
                    <HiDocumentCurrencyDollar
                      style={{
                        verticalAlign: 'middle',
                      }}
                    />
                    {activeTab}
                  </Typography>
                  {/* Download Button with Dropdown */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <Button
                      variant="outlined"
                      onClick={handleDownloadClick}
                      disabled={!rows || rows.length === 0}
                      sx={{
                        color: '#000',
                        p: 0,
                        py: 0,
                        pr: 0.5,
                        height: { xs: 30, sm: 32, md: 36 },
                        border: 'none',
                        backgroundColor: 'transparent',
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: 'grey',
                          boxShadow: 'none',
                        },
                        '&:disabled': {
                          color: '#666',
                        },
                      }}
                    >
                      <DownloadIcon
                        sx={{
                          width: { xs: '18px', sm: '26px' },
                          height: { xs: '18px', sm: '26px' },
                        }}
                      />
                      <ArrowDropDownIcon
                        sx={{
                          width: { xs: '16px', sm: '20px' },
                          height: { xs: '16px', sm: '20px' },
                          ml: -0.5,
                        }}
                      />
                    </Button>
                    <Menu
                      anchorEl={downloadAnchorEl}
                      open={downloadMenuOpen}
                      onClose={handleDownloadClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      sx={{
                        '& .MuiPaper-root': {
                          minWidth: '150px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <MenuItem onClick={handleDownloadPDF}>
                        <ListItemIcon>
                          <PictureAsPdfIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                        </ListItemIcon>
                        <ListItemText>PDF</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={handleDownloadCSV}>
                        <ListItemIcon>
                          <FaFileCsv style={{ fontSize: '18px', color: '#2e7d32' }} />
                        </ListItemIcon>
                        <ListItemText>CSV</ListItemText>
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  {activeTab === 'PAYMENT' && (
                    <Button
                      variant="outlined"
                      startIcon={
                        <AddIcon
                          sx={{ width: '18px', height: '18px', mt: '-2px' }}
                        />
                      }
                      onClick={openAddPaymentModal}
                      sx={{
                        color: '#fff',
                        p: 1,
                        pb: 0.5,
                        height: 36,
                        border: 'none',
                        backgroundColor: '#c10007',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: '#a00006',
                          color: '#fff',
                          fontWeight: 600,
                          borderColor: '#4a4a4a',
                          boxShadow: 'none',
                        },
                        '@media (max-width: 600px)': {
                          height: 32,
                          fontSize: '0.7rem',
                          px: 0.75,
                          py: 0.5,
                          '& .MuiButton-startIcon': {
                            marginRight: '2px',
                          },
                          '& .MuiSvgIcon-root': {
                            width: '14px',
                            height: '14px',
                          },
                        },
                      }}
                    >
                      Add New {activeTab}
                    </Button>
                  )}
                  {activeTab === 'REFUND' && (
                    <Button
                      variant="outlined"
                      startIcon={
                        <AddIcon
                          sx={{ width: '18px', height: '18px', mt: '-2px' }}
                        />
                      }
                      onClick={openAddRefundModal}
                      sx={{
                        color: '#fff',
                        p: 1,
                        pb: 0.5,
                        height: 36,
                        border: 'none',
                        backgroundColor: '#c10007',
                        whiteSpace: 'nowrap',
                        minWidth: 'auto',
                        '&:hover': {
                          backgroundColor: '#a00006',
                          color: '#fff',
                          fontWeight: 600,
                          borderColor: '#4a4a4a',
                          boxShadow: 'none',
                        },
                        '@media (max-width: 600px)': {
                          height: 32,
                          fontSize: '0.7rem',
                          px: 0.75,
                          py: 0.5,
                          '& .MuiButton-startIcon': {
                            marginRight: '2px',
                          },
                          '& .MuiSvgIcon-root': {
                            width: '14px',
                            height: '14px',
                          },
                        },
                      }}
                    >
                      Add New {activeTab}
                    </Button>
                  )}
                </Box>
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
                    width: { xs: '100%', sm: 350 },
                    maxWidth: 'auto',
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
              <TransactionLogsTable
                activeTab={activeTab}
                rows={getFilteredRows()}
                loading={loading || storeLoading[activeTab]}
                onViewBooking={(row) => openBookingDetails(row.bookingId)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
