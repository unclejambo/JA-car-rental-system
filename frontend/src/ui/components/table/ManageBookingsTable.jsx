import { DataGrid } from '@mui/x-data-grid';
import { Box, Alert, Snackbar } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useState } from 'react';
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

      console.log('Confirming booking:', {
        bookingId,
        currentStatus: row.booking_status,
        currentIsPay: row.isPay,
        activeTab,
      });

      // Call the confirm booking API
      const result = await bookingAPI.confirmBooking(bookingId, logout);

      console.log('Confirm result:', result);

      // Use the message from backend response
      const message = result.message || 'Booking confirmed successfully!';
      showMessage(message, 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
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

      console.log('Confirming cancellation:', {
        bookingId,
        currentStatus: row.booking_status,
        isCancel: row.isCancel,
      });

      // Call the confirm cancellation API
      const result = await bookingAPI.confirmCancellationRequest(
        bookingId,
        logout
      );

      console.log('Confirm cancellation result:', result);

      showMessage('Cancellation confirmed successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      console.error('Error confirming cancellation:', error);
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

      console.log('Rejecting cancellation:', {
        bookingId,
        currentStatus: row.booking_status,
        isCancel: row.isCancel,
      });

      // Call the reject cancellation API
      const result = await bookingAPI.rejectCancellationRequest(
        bookingId,
        logout
      );

      console.log('Reject cancellation result:', result);

      showMessage('Cancellation request rejected successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      console.error('Error rejecting cancellation:', error);
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

      console.log('Confirming extension:', {
        bookingId,
        currentStatus: row.booking_status,
        isExtend: row.isExtend,
        isPay: row.isPay,
        newEndDate: row.new_end_date,
      });

      // Check if this is payment confirmation or extension approval
      const isPaid =
        row.isPay === true || row.isPay === 'true' || row.isPay === 'TRUE';

      if (isPaid) {
        // Customer has paid - confirm the PAYMENT (not the extension request)
        console.log('🟢 Confirming extension PAYMENT...');
        const result = await bookingAPI.confirmBooking(bookingId, logout);
        console.log('✅ Extension payment confirmed:', result);
        showMessage(
          'Extension payment confirmed! End date has been updated.',
          'success'
        );
      } else {
        // Customer hasn't paid yet - approve the extension REQUEST
        console.log('🔵 Approving extension REQUEST...');
        const result = await bookingAPI.confirmExtensionRequest(
          bookingId,
          logout
        );
        console.log('✅ Extension request approved:', result);
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
      console.error('Error confirming extension:', error);
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

      console.log('Rejecting extension:', {
        bookingId,
        currentStatus: row.booking_status,
        isExtend: row.isExtend,
      });

      // Call the reject extension API
      const result = await bookingAPI.rejectExtensionRequest(bookingId, logout);

      console.log('Reject extension result:', result);

      showMessage('Extension request rejected successfully!', 'success');

      // Refresh data if callback provided
      if (onDataChange && typeof onDataChange === 'function') {
        onDataChange();
      }
    } catch (error) {
      console.error('Error rejecting extension:', error);
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

      console.log('Cancelling payment:', {
        bookingId,
        currentStatus: row.booking_status,
        currentIsPay: row.isPay,
      });

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
      console.error('Error cancelling payment:', error);
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

          // Payment submitted - awaiting admin confirmation
          if (isPaid && (bookingStatus === 'pending' || bookingStatus === 'confirmed')) {
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
                ✅ Payment submitted - Confirm to activate booking
              </Box>
            );
          }

          // Confirmed booking - actively being used
          if (bookingStatus === 'confirmed' && !isPaid) {
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
                🚗 Active booking - Car currently rented
              </Box>
            );
          }

          // In Progress - ongoing rental
          if (bookingStatus === 'in progress') {
            return (
              <Box
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                  color: '#9c27b0',
                  fontWeight: 500,
                  lineHeight: 1.3,
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  py: 0.5,
                }}
              >
                🔄 Ongoing rental - In use by customer
              </Box>
            );
          }

          // Pending - awaiting customer payment
          if (bookingStatus === 'pending' && !isPaid) {
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
                💰 New booking - Awaiting customer payment
              </Box>
            );
          }

          // Default fallback
          return (
            <Box
              sx={{
                fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
                color: '#757575',
                fontWeight: 500,
                lineHeight: 1.3,
                wordBreak: 'break-word',
                whiteSpace: 'normal',
                py: 0.5,
              }}
            >
              📋 {bookingStatus || 'Unknown status'}
            </Box>
          );
        },
      },
    ],
    // CANCELLATION: [
    //   {
    //     field: 'cancellation_date',
    //     headerName: 'Cancellation Date',
    //     flex: 1.5,
    //     minWidth: 120,
    //     resizable: true,
    //     renderCell: (params) => {
    //       return formatDateString(params.value);
    //     },
    //   },
    //   {
    //     field: 'cancellation_reason',
    //     headerName: 'Cancellation Reason',
    //     flex: 1.5,
    //     minWidth: 120,
    //     resizable: true,
    //   },
    // ],
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

              {/* Show payment buttons only when isPay is true */}
              {shouldShowPaymentButtons && (
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
        autoHeight={false}
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
        getRowClassName={(params) => {
          if (activeTab !== 'BOOKINGS') return '';
          
          const isPaid =
            params.row.isPay === true ||
            params.row.isPay === 'true' ||
            params.row.isPay === 'TRUE';
          const bookingStatus = params.row.booking_status?.toLowerCase();

          // Payment submitted - light green background
          if (isPaid && (bookingStatus === 'pending' || bookingStatus === 'confirmed')) {
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
