import React, { useEffect, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import { FaFileCsv } from 'react-icons/fa';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Header from '../../ui/components/Header';
import { HiDocumentCurrencyDollar } from 'react-icons/hi2';
import TransactionLogsHeader from '../../ui/components/header/TransactionLogsHeader';
import TransactionLogsTable from '../../ui/components/table/TranscationLogsTable';
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

  // Handle PDF download
  const handleDownloadPDF = () => {
    generateTransactionPDF(activeTab, rows);
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    generateTransactionCSV(activeTab, rows);
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
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              mb: 1
            }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: '1.8rem',
                  color: '#000',
                  mb: 0,
                  '@media (max-width: 1024px)': {
                    fontSize: '1.5rem',
                  },
                  '@media (max-width: 600px)': {
                    fontSize: '1.2rem',
                  },
                }}
              >
                <HiDocumentCurrencyDollar
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                {activeTab}
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 1,
                flexWrap: 'wrap',
                '@media (max-width: 600px)': {
                  gap: 0.5,
                  width: '100%',
                  justifyContent: 'flex-end',
                }
              }}>
                {/* Download PDF Button */}
                <Button
                  variant="outlined"
                  startIcon={
                    <DownloadIcon
                      sx={{ width: '18px', height: '18px', mt: '-2px' }}
                    />
                  }
                  onClick={handleDownloadPDF}
                  disabled={!rows || rows.length === 0}
                  sx={{
                    color: '#fff',
                    p: 1,
                    pb: 0.5,
                    height: 36,
                    border: 'none',
                    backgroundColor: '#1976d2',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                      color: '#fff',
                      fontWeight: 600,
                      boxShadow: 'none',
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc',
                      color: '#666',
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
                  Download PDF
                </Button>
                
                {/* Download CSV Button */}
                <Button
                  variant="outlined"
                  startIcon={
                    <FaFileCsv
                      style={{ width: '18px', height: '18px', marginTop: '-2px' }}
                    />
                  }
                  onClick={handleDownloadCSV}
                  disabled={!rows || rows.length === 0}
                  sx={{
                    color: '#fff',
                    p: 1,
                    pb: 0.5,
                    height: 36,
                    border: 'none',
                    backgroundColor: '#2e7d32',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                    '&:hover': {
                      backgroundColor: '#1b5e20',
                      color: '#fff',
                      fontWeight: 600,
                      boxShadow: 'none',
                    },
                    '&:disabled': {
                      backgroundColor: '#ccc',
                      color: '#666',
                    },
                    '@media (max-width: 600px)': {
                      height: 32,
                      fontSize: '0.7rem',
                      px: 0.75,
                      py: 0.5,
                      '& .MuiButton-startIcon': {
                        marginRight: '2px',
                      },
                      '& svg': {
                        width: '14px',
                        height: '14px',
                      },
                    },
                  }}
                >
                  Download CSV
                </Button>
                
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
                rows={rows}
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
