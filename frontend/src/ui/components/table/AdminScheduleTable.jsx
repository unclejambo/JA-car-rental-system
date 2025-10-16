import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import IconButton from '@mui/material/IconButton';
import CancelIcon from '@mui/icons-material/Cancel';
import { useState } from 'react';
import { useScheduleStore } from '../../../store/useScheduleStore';
import { bookingAPI } from '../../../utils/api';
import { useNavigate } from 'react-router-dom';

const AdminScheduleTable = ({
  rows,
  loading,
  onOpenRelease,
  onOpenReturn,
  onOpenGPS,
}) => {
  const navigate = useNavigate();
  const updateReservationStatus = useScheduleStore(
    (state) => state.updateReservationStatus
  );

  // State for cancel confirmation dialog
  const [cancelDialog, setCancelDialog] = useState({
    open: false,
    booking: null,
  });

  // State for snackbar notifications
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

  // Open cancel confirmation dialog
  const handleOpenCancelDialog = (booking) => {
    setCancelDialog({
      open: true,
      booking,
    });
  };

  // Close cancel confirmation dialog
  const handleCloseCancelDialog = () => {
    setCancelDialog({
      open: false,
      booking: null,
    });
  };

  // Confirm cancellation
  const handleConfirmCancel = async () => {
    if (!cancelDialog.booking) return;

    try {
      const bookingId =
        cancelDialog.booking.reservationId ?? cancelDialog.booking.booking_id;

      console.log('Cancelling booking:', bookingId);

      // Call the admin cancel booking API
      const result = await bookingAPI.adminCancelBooking(bookingId, logout);

      console.log('Cancel result:', result);

      showMessage('Booking cancelled successfully!', 'success');

      // Close the dialog
      handleCloseCancelDialog();

      // Refresh the schedule data
      updateReservationStatus(bookingId, 'Cancelled');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showMessage(error.message || 'Failed to cancel booking', 'error');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    // If the incoming value is an ISO datetime string, return only the date part (YYYY-MM-DD)
    if (typeof iso === 'string' && iso.includes('T')) {
      return iso.split('T')[0];
    }
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    // handle ISO datetime strings like "2025-08-21T23:28:18.025Z"
    if (typeof iso === 'string' && iso.includes('T')) {
      try {
        const t = new Date(iso);
        if (!isNaN(t)) {
          // show only time in local HH:MM:SS (or HH:MM) format
          return t.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: undefined,
          });
        }
      } catch {
        // fall through
      }
    }
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: undefined,
    });
  };
  // Normalize incoming rows so the DataGrid and renderCell logic can rely on consistent keys
  const normalizedRows = Array.isArray(rows)
    ? rows.map((r) => {
        const resolvedId = r.reservationId ?? r.booking_id ?? r.id;
        return {
          // keep original data
          ...r,
          // ensure DataGrid has an `id`
          id: resolvedId,
          // id used by other logic
          reservationId: resolvedId,
          booking_id: resolvedId,
          // car_id - ensure this is available
          car_id: r.car_id ?? r.carId ?? r.cars_id,
          // status field used in render logic
          status: r.status ?? r.booking_status,
          // date fields expected by render logic
          startDate: r.start_date ?? r.startDate,
          endDate: r.end_date ?? r.endDate,
          // pickup/dropoff location keys expected by columns
          pickup_location: r.pickup_location ?? r.pickup_loc,
          dropoff_location: r.dropoff_location ?? r.dropoff_loc,
          // keep pickup/dropoff times if present
          pickup_time: r.pickup_time ?? r.start_time,
          dropoff_time: r.dropoff_time ?? r.end_time,
          // keep car object if it exists
          car: r.car,
        };
      })
    : [];

  // Define columns that are common to all tabs (use normalized field names)
  const commonColumns = [
    {
      field: 'customer_name',
      headerName: 'Customer Name',
      flex: 1.5,
      minWidth: 100,
      editable: false,
    },
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1.5,
      minWidth: 80,
      editable: false,
      renderCell: (params) => {
        const iso =
          params?.row?.start_date ?? params?.row?.startDate ?? params?.value;
        return <span>{formatDate(iso)}</span>;
      },
    },
    {
      field: 'pickup_time',
      headerName: 'Pickup Time',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => {
        const iso = params?.row?.pickup_time ?? params?.value;
        return <span>{formatTime(iso)}</span>;
      },
    },
    {
      field: 'pickup_location',
      headerName: 'Pickup Location',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => (
        <span>
          {params?.row?.pickup_location ??
            params?.row?.pickup_loc ??
            params?.value ??
            ''}
        </span>
      ),
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1,
      minWidth: 80,
      editable: false,
      renderCell: (params) => {
        const iso =
          params?.row?.end_date ?? params?.row?.endDate ?? params?.value;
        return <span>{formatDate(iso)}</span>;
      },
    },
    {
      field: 'dropoff_time',
      headerName: 'Drop Off Time',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => {
        const iso = params?.row?.dropoff_time ?? params?.value;
        return <span>{formatTime(iso)}</span>;
      },
    },
    {
      field: 'dropoff_location',
      headerName: 'Drop Off Location',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => (
        <span>
          {params?.row?.dropoff_location ??
            params?.row?.dropoff_loc ??
            params?.value ??
            ''}
        </span>
      ),
    },
    {
      field: 'isSelfDriver',
      headerName: 'Self Drive',
      flex: 1,
      minWidth: 80,
      editable: false,
      renderCell: (params) => {
        const val = params?.row?.isSelfDriver ?? params?.value;
        return <span>{val ? 'Yes' : 'No'}</span>;
      },
    },
  ];

  // Status column (common to all tabs)
  const statusColumn = {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 150,
    editable: false,
    sortable: true,
    headerAlign: 'left',
    align: 'left',
    renderCell: (params) => {
      // compare only date parts
      const today = new Date().toISOString().split('T')[0];
      const startIso = params.row.start_date ?? params.row.startDate ?? '';
      const endIso = params.row.end_date ?? params.row.endDate ?? '';
      const startDate = startIso
        ? new Date(startIso).toISOString().split('T')[0]
        : null;
      const endDate = endIso
        ? new Date(endIso).toISOString().split('T')[0]
        : null;

      const handleAction = async (actionType) => {
        try {
          await updateReservationStatus(
            params.row.reservationId ?? params.row.booking_id,
            actionType
          );
        } catch (error) {
          console.error('Error updating status:', error);
        }
      };

      // Show release button if today is start date and status is 'Confirmed'
      if (today === startDate && params.row.status === 'Confirmed') {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={() =>
                onOpenRelease
                  ? onOpenRelease(params.row)
                  : handleAction('Ongoing')
              }
              sx={{
                textTransform: 'none',
                fontWeight: 'normal',
                backgroundColor: '#2e7d32',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
              }}
            >
              Release
            </Button>
            <IconButton
              size="medium"
              color="error"
              aria-label="cancel"
              onClick={() => handleOpenCancelDialog(params.row)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(211, 47, 47, 0.08)',
                },
              }}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }

      // Show return button if today is end date and status is 'Ongoing'
      if (today === endDate && params.row.status === 'In Progress') {
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() =>
              onOpenReturn ? onOpenReturn(params.row) : handleAction('Done')
            }
            sx={{
              textTransform: 'none',
              fontWeight: 'normal',
              backgroundColor: '#2e7d32',
              '&:hover': {
                backgroundColor: '#1b5e20',
              },
            }}
          >
            Return
          </Button>
        );
      }

      // Default to showing status with optional GPS button
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>
            {params.row.status ?? params.row.booking_status ?? 'Pending'}
          </span>
          {/* change 'In Progress' to 'Ongoing' */}
          {(params.row.status === 'In Progress' ||
            params.row.booking_status === 'In Progress') && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                console.log('🌍 Globe icon clicked!');
                console.log('  Row data:', params.row);
                console.log(
                  '  Car ID:',
                  params.row.car_id || params.row.carId || 'NOT FOUND'
                );
                if (onOpenGPS) {
                  onOpenGPS(params.row);
                }
              }}
              size="small"
              sx={{
                borderRadius: '50%',
                minWidth: 'auto',
                padding: '2px',
                backgroundColor: '#2e7d32',
                '&:hover': {
                  backgroundColor: '#1b5e20',
                },
              }}
            >
              <PublicIcon />
            </Button>
          )}
        </Box>
      );
    },
  };

  const columns = [...commonColumns, statusColumn];

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
        rows={normalizedRows}
        columns={columns}
        getRowId={(row) => row.reservationId ?? row.booking_id ?? row.id}
        loading={loading}
        autoHeight
        hideFooterSelectedRowCount
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableVirtualization
        pagination
        pageSizeOptions={[5, 10, 25]}
        disableColumnResize={false}
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

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={handleCloseCancelDialog}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          Confirm Booking Cancellation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="cancel-dialog-description">
            Are you sure you want to cancel this booking for{' '}
            <strong>{cancelDialog.booking?.customer_name}</strong>?
            <br />
            <br />
            This action will:
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Set the booking status to "Cancelled"</li>
              <li>Create a transaction record with cancellation details</li>
            </ul>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog} color="primary">
            No, Keep Booking
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            autoFocus
          >
            Yes, Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdminScheduleTable;
