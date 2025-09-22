import { DataGrid } from '@mui/x-data-grid';
import { Box, Button } from '@mui/material';

const ScheduleTable = ({ rows, loading }) => {

  console.log('ScheduleTable - Rows:', rows); // Debug log

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
      } catch (e) {
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
        };
      })
    : [];

  // Define columns that are common to all tabs (use normalized field names)
  const commonColumns = [
    {
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1.5,
      minWidth: 120,
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
      flex: 1.5,
      minWidth: 140,
      editable: false,
      renderCell: (params) => {
        const iso =
          params?.row?.pickup_time ?? params?.row?.pickupTime ?? params?.value;
        return <span>{formatTime(iso)}</span>;
      },
    },
    {
      field: 'pickup_loc',
      headerName: 'Pickup Location',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1,
      minWidth: 90,
      editable: false,
      renderCell: (params) => {
        const iso =
          params?.row?.start_date ?? params?.row?.startDate ?? params?.value;
        return <span>{formatDate(iso)}</span>;
      },
    },
    {
      field: 'dropoff_time',
      headerName: 'Drop Off Time',
      flex: 1,
      minWidth: 90,
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
      minWidth: 90,
      editable: false,
    },
    {
      field: 'car_model',
      headerName: 'Car Model',
      flex: 1,
      minWidth: 80,
      editable: false,
    },
  ];

  // Status column (common to all tabs)

  const columns = [...commonColumns];
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
    </Box>
  );
};

export default ScheduleTable;
