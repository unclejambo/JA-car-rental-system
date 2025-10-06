import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const ScheduleTable = ({ rows, loading }) => {
  const formatDate = (iso) => {
    if (!iso) return '';
    if (typeof iso === 'string' && iso.includes('T')) return iso.split('T')[0];
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    if (typeof iso === 'string' && iso.includes('T')) {
      const t = new Date(iso);
      if (!isNaN(t)) {
        return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Normalize incoming rows to the keys the grid expects
  const normalizedRows = Array.isArray(rows)
    ? rows.map((r) => {
        const id =
          r.schedule_id ??
          r.reservationId ??
          r.booking_id ??
          r.id ??
          Math.random();
        return {
          ...r,
          id,
          booking_id: r.booking_id ?? id,
          start_date: r.start_date ?? r.startDate,
          end_date: r.end_date ?? r.endDate,
          pickup_time: r.pickup_time ?? r.pickupTime,
          dropoff_time: r.dropoff_time ?? r.dropoffTime,
          pickup_loc: r.pickup_loc ?? r.pickup_location,
          dropoff_loc:
            r.dropoff_loc ?? r.dropoff_location ?? r.drop_location ?? 'N/A',
          car_model:
            r.car_model ??
            r.car?.model ??
            `${r.car?.make ?? ''} ${r.car?.model ?? ''}`.trim(),
        };
      })
    : [];

  const columns = [
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span>{formatDate(params?.row?.start_date ?? params?.value)}</span>
      ),
    },
    {
      field: 'pickup_time',
      headerName: 'Pickup Time',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <span>{formatTime(params?.row?.pickup_time ?? params?.value)}</span>
      ),
    },
    {
      field: 'pickup_loc',
      headerName: 'Pickup Location',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => (
        <span>{formatDate(params?.row?.end_date ?? params?.value)}</span>
      ),
    },
    {
      field: 'dropoff_time',
      headerName: 'Drop Off Time',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <span>{formatTime(params?.row?.dropoff_time ?? params?.value)}</span>
      ),
    },
    {
      field: 'dropoff_loc',
      headerName: 'Drop Off Location',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'car_model',
      headerName: 'Car Model',
      flex: 1,
      minWidth: 100,
    },
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
        rows={normalizedRows}
        columns={columns}
        getRowId={(row) =>
          row.schedule_id || row.booking_id || row.reservationId || row.id
        }
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
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
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
            '&:focus': { outline: 'none' },
          },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
          '& .MuiDataGrid-virtualScroller': { flex: 1, minHeight: '200px' },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid rgba(224, 224, 224, 1)',
            backgroundColor: '#fff',
            position: 'relative',
            bottom: 0,
            width: '100%',
          },
          '& .MuiTablePagination-root': { marginLeft: 'auto', color: '#000' },
          '@media (max-width: 1024px)': { pageSizeOptions: [] },
        }}
      />
    </Box>
  );
};

export default ScheduleTable;
