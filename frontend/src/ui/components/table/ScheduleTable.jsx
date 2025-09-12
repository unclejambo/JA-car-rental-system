import { DataGrid } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';
import { useScheduleStore } from '../../../store/schedule';
import PublicIcon from '@mui/icons-material/Public';

const ScheduleTable = ({ rows, loading }) => {
  const updateReservationStatus = useScheduleStore(
    (state) => state.updateReservationStatus
  );

  console.log('ScheduleTable - Rows:', rows); // Debug log

  // Define columns that are common to all tabs
  const commonColumns = [
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: 1.5,
      minWidth: 120,
      editable: false,
    },
    {
      field: 'startDate',
      headerName: 'Start Date',
      flex: 1.5,
      minWidth: 100,
      editable: false,
    },
    {
      field: 'pickupTime',
      headerName: 'Pickup Time',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
    {
      field: 'pickupLocation',
      headerName: 'Pickup Location',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      flex: 1,
      minWidth: 100,
      editable: false,
    },
    {
      field: 'dropOffTime',
      headerName: 'Drop Off Time',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
    {
      field: 'dropOffLocation',
      headerName: 'Drop Off Location',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
    {
      field: 'selfDrive',
      headerName: 'Self Drive',
      flex: 1,
      minWidth: 80,
      editable: false,
    },
  ];

  // Status column (common to all tabs)
  const statusColumn = {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 150,
    editable: false,
    sortable: false,
    headerAlign: 'left',
    align: 'left',
    renderCell: (params) => {
      const today = new Date().toISOString().split('T')[0];
      const startDate = params.row.startDate?.split('T')[0];
      const endDate = params.row.endDate?.split('T')[0];

      const handleAction = async (actionType) => {
        try {
          await updateReservationStatus(params.row.reservationId, actionType);
        } catch (error) {
          console.error('Error updating status:', error);
        }
      };

      // Show release button if today is start date and status is 'Confirmed'
      // Change '2025-07-06' to today
      if ('2025-07-06' === startDate && params.row.status === 'Confirmed') {
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleAction('Ongoing')}
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
        );
      }

      // Show return button if today is end date and status is 'Ongoing'
      if (today === endDate && params.row.status === 'Ongoing') {
        return (
          <Button
            variant="contained"
            color="success"
            size="small"
            onClick={() => handleAction('Done')}
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

      // Default to showing status with button
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>{params.row.status || 'Pending'}</span>
          {params.row.status === 'Ongoing' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => console.log('GPS Clicked!')}
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
  console.log('ScheduleTable - Columns:', columns); // Debug log

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
        rows={Array.isArray(rows) ? rows : []}
        columns={columns}
        getRowId={(row) => row.reservationId}
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
            paginationModel: { pageSize: 5, page: 0 },
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
    </Box>
  );
};

export default ScheduleTable;
