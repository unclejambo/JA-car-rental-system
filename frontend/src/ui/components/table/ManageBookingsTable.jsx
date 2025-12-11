import { DataGrid } from '@mui/x-data-grid';
import { Box, Alert, Snackbar, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { HiInboxIn } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { bookingAPI, paymentAPI } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const ManageBookingsTable = ({
  activeTab,
  rows,
  loading,
  onViewDetails,
  onDataChange,
}) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [autoProcessedBookings, setAutoProcessedBookings] = useState(new Set());

  // Auto-confirm bookings where payment is >= 1000 (isPay === true)
  useEffect(() => {
    if (!rows || rows.length === 0 || activeTab !== 'BOOKINGS') {
      return;
    }

    // Find bookings that need auto-confirmation
    const bookingsToAutoConfirm = rows.filter((row) => {
      const isPaid =
        row.isPay === true || row.isPay === 'true' || row.isPay === 'TRUE';
      const bookingStatus = row.booking_status?.toLowerCase();

      // Only auto-confirm PENDING or CONFIRMED bookings with payment submitted
      // and haven't been auto-processed yet
      return (
        isPaid &&
        (bookingStatus === 'pending' || bookingStatus === 'confirmed') &&
        !autoProcessedBookings.has(row.actualBookingId)
      );
    });

    // Auto-confirm each booking that meets criteria
    if (bookingsToAutoConfirm.length > 0) {
      bookingsToAutoConfirm.forEach(async (booking) => {
        // Mark as processed to prevent duplicate calls
        setAutoProcessedBookings((prev) =>
          new Set(prev).add(booking.actualBookingId)
        );

        // Call handleConfirm without user interaction
        try {
          const result = await bookingAPI.confirmBooking(
            booking.actualBookingId,
            logout
          );

          // Refresh data if callback provided
          if (onDataChange && typeof onDataChange === 'function') {
            onDataChange();
          }
        } catch (error) {
          // Silently fail - user doesn't need to see auto-confirmation errors
          console.error(
            'Auto-confirmation failed for booking:',
            booking.actualBookingId,
            error
          );
        }
      });
    }
  }, [rows, activeTab, autoProcessedBookings, onDataChange]);

  // Custom empty state overlay
  const NoRowsOverlay = () => {
    const getMessage = () => {
      switch (activeTab) {
        case 'CANCELLATION':
          return 'No Cancellation Requests';
        case 'EXTENSION':
          return 'No Extension Requests';
        default:
          return 'No Booking Requests';
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#f9f9f9',
          py: 8,
        }}
      >
        <HiInboxIn size={64} color="#9e9e9e" />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            color: '#757575',
            fontWeight: 500,
          }}
        >
          {getMessage()}
        </Typography>
      </Box>
    );
  };

  // Logout function for API calls
  const logout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  // Show snackbar message
  const showMessage = (message, severity = 'success') => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle check button click (Confirm)
  const handleConfirm = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Call the confirm booking API
      const result = await bookingAPI.confirmBooking(bookingId, logout);

      // Use the message from backend response
      const message = result.message || 'Booking confirmed successfully!';
      showMessage(message, 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(error.message || 'Failed to confirm booking', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle confirm cancellation (for CANCELLATION tab)
  const handleConfirmCancellation = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Call the confirm cancellation API
      const result = await bookingAPI.confirmCancellationRequest(
        bookingId,
        logout
      );

      showMessage('Cancellation confirmed successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(error.message || 'Failed to confirm cancellation', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject cancellation (for CANCELLATION tab)
  const handleRejectCancellation = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Call the reject cancellation API
      const result = await bookingAPI.rejectCancellationRequest(
        bookingId,
        logout
      );

      showMessage('Cancellation request rejected successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(
        error.message || 'Failed to reject cancellation request',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle confirm extension (for EXTENSION tab)
  const handleConfirmExtension = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Check if this is payment confirmation or extension approval
      const isPaid =
        row.isPay === true || row.isPay === 'true' || row.isPay === 'TRUE';

      if (isPaid) {
        // Customer has paid - confirm the PAYMENT (not the extension request)
        const result = await bookingAPI.confirmBooking(bookingId, logout);
        showMessage(
          'Extension payment confirmed! End date has been updated.',
          'success'
        );
      } else {
        // Customer hasn't paid yet - approve the extension REQUEST
        const result = await bookingAPI.confirmExtensionRequest(
          bookingId,
          logout
        );
        showMessage(
          'Extension request approved! Waiting for customer payment.',
          'success'
        );
      }

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(error.message || 'Failed to confirm extension', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject extension (for EXTENSION tab)
  const handleRejectExtension = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Call the reject extension API
      const result = await bookingAPI.rejectExtensionRequest(bookingId, logout);

      showMessage('Extension request rejected successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(
        error.message || 'Failed to reject extension request',
        'error'
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle cancel button click (X)
  const handleCancel = async (row) => {
    if (processing) return;

    try {
      setProcessing(true);
      const bookingId = row.actualBookingId;

      // Update isPay to false first
      await bookingAPI.updateIsPay(bookingId, false, logout);

      // Delete payment with keepStatus=true to maintain current booking status
      await paymentAPI.deletePaymentByBookingId(bookingId, logout, true);

      showMessage('Payment cancelled successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      showMessage(error.message || 'Failed to cancel payment', 'error');
    } finally {
      setProcessing(false);
    }
  };

  // Helper: return YYYY-MM-DD from an ISO datetime or Date
  const formatDateString = (value) => {
    if (!value && value !== 0) return '';
    if (typeof value === 'string' && value.includes('T')) {
      return value.split('T')[0];
    }
    if (value instanceof Date && !isNaN(value)) {
      return value.toISOString().split('T')[0];
    }
    // fallback to string conversion
    try {
      return String(value).split('T')[0];
    } catch {
      return '';
    }
  };

  // Handle view details action
  const handleViewDetails = (row) => {
    if (onViewDetails && typeof onViewDetails === 'function') {
      // Map the row data to match the expected booking object format
      const bookingData = {
        id: row.actualBookingId, // Use the actual booking ID from database
        customerName: row.customer_name,
        carModel: row.car_model,
        carPlateNumber: row.car_plate_number || row.plate_number,
        bookingDate: row.booking_date,
        purpose: row.purpose,
        startDate: row.start_date,
        endDate: row.end_date,
        pickupTime: row.pickup_time,
        dropoffTime: row.dropoff_time,
        deliveryLocation: row.delivery_location,
        dropoffLocation: row.dropoff_location,
        selfDrive: row.self_drive || false,
        driverName: row.driver_name,
        phoneNumber: row.phone_number,
        fbLink: row.fb_link,
        reservationFee: row.reservation_fee,
        driverFee: row.driver_fee,
        deliveryFee: row.delivery_fee,
        totalAmount: row.total_amount || row.total_rental_amount,
        paymentStatus: row.payment_status,
        bookingStatus: row.booking_status,
        // Add any other fields that might be needed
        ...row, // Spread the original row to include any additional fields
      };
      onViewDetails(bookingData);
    }
  };

  // create a display copy so original rows remain unchanged
  const displayRows = (rows || []).map((r, idx) => ({
    ...r,
    booking_date: formatDateString(r.booking_date),
    start_date: formatDateString(r.start_date),
    end_date: formatDateString(r.end_date),
    // Use the actual booking ID from database for DataGrid's id requirement
    id: r.booking_id || r.id || r.reservation_id || `row-${idx}`,
    // Store the actual booking ID separately for display
    actualBookingId: r.booking_id || r.id || r.reservation_id || idx,
  }));

  // Define columns that are common to all tabs
  const commonColumns = [
    {
      field: 'actualBookingId', // Changed from 'id' to show actual booking ID
      headerName: 'ID',
      flex: 1,
      minWidth: 50,
      editable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'customer_name',
      headerName: 'Customer Name',
      flex: 1.5,
      minWidth: 120,
      editable: false,
      resizable: true,
      headerAlign: 'center',
    },
    {
      field: 'car_model',
      headerName: 'Car',
      flex: 1.5,
      minWidth: 70,
      editable: false,
      resizable: true,
      headerAlign: 'center',
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1.5,
      minWidth: 80,
      editable: false,
      resizable: true,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1.5,
      minWidth: 80,
      editable: false,
      resizable: true,
      headerAlign: 'center',
      align: 'center',
    },
  ];

  // Define tab-specific columns
  const tabSpecificColumns = {
    BOOKINGS: [
      {
        field: 'balance',
        headerName: 'Balance',
        flex: 1.2,
        minWidth: 100,
        resizable: false,
        renderCell: (params) => {
          return (
            '₱' +
            Number(params.value).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          );
        },
      },
    ],
    CANCELLATION: [
      {
        field: 'request_type',
        headerName: 'Request Type',
        flex: 2,
        minWidth: 200,
        resizable: true,
        renderCell: (params) => {
          return (
            <Box
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                color: '#d32f2f',
                fontWeight: 500,
                lineHeight: 1.3,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                py: 0.5,
              }}
            >
              ❌ Customer requested to cancel
            </Box>
          );
        },
      },
    ],
    EXTENSION: [
      {
        field: 'new_end_date',
        headerName: 'New End Date',
        flex: 1.5,
        minWidth: 120,
        resizable: true,
        renderCell: (params) => {
          return formatDateString(params.value);
        },
      },
      {
        field: 'request_type',
        headerName: 'Request Type',
        flex: 2,
        minWidth: 200,
        resizable: true,
        renderCell: (params) => {
          const isPaid =
            params.row.isPay === true ||
            params.row.isPay === 'true' ||
            params.row.isPay === 'TRUE';
          const bookingStatus = params.row.booking_status?.toLowerCase();
          const latestExtension = params.row.latest_extension;

          // Check if extension has been approved by admin
          const isExtensionApproved =
            latestExtension &&
            (latestExtension.extension_status === 'approved' ||
              latestExtension.approve_time !== null);

          // Status = "In Progress" + isPay = true → Extension paid, awaiting admin confirmation
          if (bookingStatus === 'in progress' && isPaid) {
            return (
              <Box
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  color: '#2e7d32',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  py: 0.5,
                }}
              >
                ✅ Extension paid - Confirm to apply new date
              </Box>
            );
          }

          // Status = "In Progress" + Extension approved by admin → Awaiting customer payment
          if (bookingStatus === 'in progress' && isExtensionApproved) {
            return (
              <Box
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  color: '#ed6c02',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  py: 0.5,
                }}
              >
                💰 Extension approved - Awaiting customer payment
              </Box>
            );
          }

          // Otherwise, it's a new extension request (status=Pending or other) - not yet approved
          return (
            <Box
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                color: '#1976d2',
                fontWeight: 500,
                lineHeight: 1.3,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                py: 0.5,
              }}
            >
              📅 New extension request - Review & approve/reject
            </Box>
          );
        },
      },
    ],
  };

  // Action column to all tabs
  const actionColumn = {
    field: 'action',
    headerName: '',
    flex: 1,
    minWidth: 120,
    sortable: false,
    editable: false,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      // Check if isPay is true (for showing check/cancel buttons in BOOKINGS tab)
      const shouldShowPaymentButtons =
        params.row.isPay === true ||
        params.row.isPay === 'true' ||
        params.row.isPay === 'TRUE';

      // Check if this booking is auto-accepted (iPay true + pending/confirmed status)
      // These bookings don't need manual action buttons anymore
      const bookingStatus = params.row.booking_status?.toLowerCase();
      const isAutoAccepted =
        shouldShowPaymentButtons &&
        (bookingStatus === 'pending' || bookingStatus === 'confirmed');

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
          {/* BOOKINGS TAB - View details and payment buttons */}
          {activeTab === 'BOOKINGS' && (
            <>
              <IconButton
                size="small"
                color="primary"
                aria-label="view details"
                onClick={() => handleViewDetails(params.row)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  },
                }}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>

              {/* Show payment buttons only when isPay is true AND not auto-accepted */}
              {shouldShowPaymentButtons && !isAutoAccepted && (
                <>
                  <IconButton
                    size="small"
                    color="success"
                    aria-label="confirm"
                    onClick={() => handleConfirm(params.row)}
                    disabled={processing}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.08)',
                      },
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="cancel"
                    onClick={() => handleCancel(params.row)}
                    disabled={processing}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)',
                      },
                    }}
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </>
          )}

          {/* CANCELLATION TAB - Confirm and reject buttons */}
          {activeTab === 'CANCELLATION' && (
            <>
              <IconButton
                size="small"
                color="success"
                aria-label="confirm cancellation"
                onClick={() => handleConfirmCancellation(params.row)}
                disabled={processing}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.08)',
                  },
                }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                aria-label="reject cancellation"
                onClick={() => handleRejectCancellation(params.row)}
                disabled={processing}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(211, 47, 47, 0.08)',
                  },
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </>
          )}

          {/* EXTENSION TAB - Confirm and reject buttons */}
          {activeTab === 'EXTENSION' &&
            (() => {
              const latestExtension = params.row.latest_extension;
              const isExtensionApproved =
                latestExtension &&
                (latestExtension.extension_status === 'approved' ||
                  latestExtension.approve_time !== null);
              const isPaid =
                params.row.isPay === true ||
                params.row.isPay === 'true' ||
                params.row.isPay === 'TRUE';

              // Show buttons based on state:
              // 1. New request (not approved) → Approve + Reject
              // 2. Approved, awaiting payment → No buttons (admin waits)
              // 3. Customer paid → Confirm + Reject (admin can reject payment if invalid)

              if (isPaid) {
                // State 3: Customer paid, show confirm AND reject buttons
                return (
                  <>
                    <IconButton
                      size="small"
                      color="success"
                      aria-label="confirm extension payment"
                      onClick={() => handleConfirmExtension(params.row)}
                      disabled={processing}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        },
                      }}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="reject extension payment"
                      onClick={() => handleRejectExtension(params.row)}
                      disabled={processing}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                        },
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                );
              } else if (isExtensionApproved) {
                // State 2: Approved, awaiting payment - NO buttons (admin just waits)
                return null;
              } else {
                // State 1: New request - show approve/reject buttons
                return (
                  <>
                    <IconButton
                      size="small"
                      color="success"
                      aria-label="approve extension"
                      onClick={() => handleConfirmExtension(params.row)}
                      disabled={processing}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(46, 125, 50, 0.08)',
                        },
                      }}
                    >
                      <CheckCircleIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="reject extension"
                      onClick={() => handleRejectExtension(params.row)}
                      disabled={processing}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'rgba(211, 47, 47, 0.08)',
                        },
                      }}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  </>
                );
              }
            })()}
        </Box>
      );
    },
  };

  // Combine columns based on active tab
  const columns = [
    ...commonColumns,
    ...(tabSpecificColumns[activeTab] || []),
    actionColumn,
  ];

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        '& .MuiDataGrid-root': {
          backgroundColor: '#fff',
          border: 'none',
          '& .MuiDataGrid-cell': {
            fontSize: {
              xs: '0.75rem',
              sm: '0.875rem',
              md: '0.875rem',
              lg: '0.925rem',
            },
            padding: { xs: '8px', sm: '16px', md: '16px', lg: '4px 10px' },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          },
          '& .MuiTablePagination-root': {
            color: '#000',
            '& .MuiSvgIcon-root': {
              color: '#000',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            backgroundColor: '#fff',
          },
          // Row color coding for BOOKINGS tab
          '& .row-payment-submitted': {
            backgroundColor: '#e8f5e9', // Light green - Payment submitted
            '&:hover': {
              backgroundColor: '#c8e6c9',
            },
          },
          '& .row-active-booking': {
            backgroundColor: '#e3f2fd', // Light blue - Active booking
            '&:hover': {
              backgroundColor: '#bbdefb',
            },
          },
          '& .row-in-progress': {
            backgroundColor: '#f3e5f5', // Light purple - In progress
            '&:hover': {
              backgroundColor: '#e1bee7',
            },
          },
          '& .row-awaiting-payment': {
            backgroundColor: '#fff3e0', // Light orange - Awaiting payment
            '&:hover': {
              backgroundColor: '#ffe0b2',
            },
          },
        },
      }}
    >
      <DataGrid
        rows={displayRows}
        columns={columns.filter((col) => !col.hide)}
        loading={loading}
        autoHeight={true}
        hideFooterSelectedRowCount
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableVirtualization
        pagination
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        slots={{
          noRowsOverlay: () => <NoRowsOverlay />,
        }}
        getRowClassName={(params) => {
          if (activeTab !== 'BOOKINGS') return '';

          const isPaid =
            params.row.isPay === true ||
            params.row.isPay === 'true' ||
            params.row.isPay === 'TRUE';
          const bookingStatus = params.row.booking_status?.toLowerCase();

          // Payment submitted - light green background
          if (
            isPaid &&
            (bookingStatus === 'pending' || bookingStatus === 'confirmed')
          ) {
            return 'row-payment-submitted';
          }

          // Confirmed booking - light blue background
          if (bookingStatus === 'confirmed' && !isPaid) {
            return 'row-active-booking';
          }

          // In Progress - light purple background
          if (bookingStatus === 'in progress') {
            return 'row-in-progress';
          }

          // Pending - light orange background
          if (bookingStatus === 'pending' && !isPaid) {
            return 'row-awaiting-payment';
          }

          return '';
        }}
        sx={{
          width: '100%',
          minHeight: '400px',
          '& .MuiDataGrid-main': {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
          },
          '& .MuiDataGrid-columnHeaders': {
            minHeight: '56px !important',
          },
          '& .MuiDataGrid-columnHeader': {
            '&:focus': {
              outline: 'none',
            },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 'bold',
          },
          '& .MuiDataGrid-virtualScroller': {
            flex: 1,
            minHeight: '200px',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            backgroundColor: '#fff',
            position: 'relative',
            bottom: 0,
            width: '100%',
          },
          '& .MuiTablePagination-root': {
            marginLeft: 'auto',
            color: '#000',
            '& .MuiSvgIcon-root': {
              color: '#000',
            },
          },
          '@media (max-width: 1024px)': {
            pageSizeOptions: [],
          },
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageBookingsTable;
