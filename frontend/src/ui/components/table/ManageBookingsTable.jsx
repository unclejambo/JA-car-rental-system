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

      showMessage('Booking confirmed successfully!', 'success');

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
      minWidth: 30,
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
      field: 'booking_date',
      headerName: 'Booking Date',
      flex: 1.5,
      minWidth: 80,
      editable: false,
      resizable: true,
      headerAlign: 'center',
      align: 'center',
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
        field: 'purpose',
        headerName: 'Purpose',
        flex: 1.2,
        minWidth: 80,
      },
      {
        field: 'payment_status',
        headerName: 'Payment Status',
        flex: 1.2,
        minWidth: 100,
        resizable: true,
      },
      {
        field: 'booking_status',
        headerName: 'Booking Status',
        flex: 1.2,
        minWidth: 100,
        resizable: true,
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
          {/* View details button - only for BOOKINGS tab */}
          {activeTab === 'BOOKINGS' && (
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
          )}

          {/* Payment confirmation buttons - only for BOOKINGS tab when isPay is true */}
          {activeTab === 'BOOKINGS' && shouldShowPaymentButtons && (
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

          {/* Cancellation confirmation buttons - only for CANCELLATION tab */}
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
