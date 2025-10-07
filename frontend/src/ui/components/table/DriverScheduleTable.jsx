import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Chip } from '@mui/material';

const DriverScheduleTable = ({ schedules = [] }) => {
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Define colors for each status
  const getStatusChip = (status) => {
    if (!status) return <Chip label="—" size="small" color="default" />;
    const lower = status.toLowerCase();

    switch (lower) {
      case 'pending':
        return (
          <Chip
            label="Pending"
            size="small"
            sx={{ backgroundColor: '#ff9800', color: 'white', fontWeight: 600 }}
          />
        );
      case 'ongoing':
        return (
          <Chip
            label="Ongoing"
            size="small"
            sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 600 }}
          />
        );
      case 'completed':
        return (
          <Chip
            label="Completed"
            size="small"
            sx={{ backgroundColor: '#4caf50', color: 'white', fontWeight: 600 }}
          />
        );
      case 'cancelled':
      case 'canceled':
        return (
          <Chip
            label="Cancelled"
            size="small"
            sx={{ backgroundColor: '#f44336', color: 'white', fontWeight: 600 }}
          />
        );
      default:
        return (
          <Chip
            label={status}
            size="small"
            sx={{ backgroundColor: '#9e9e9e', color: 'white', fontWeight: 600 }}
          />
        );
    }
  };

  const columns = [
    {
      field: 'start_date',
      headerName: 'Schedule Date',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.value || 'No Customer',
    },
    {
      field: 'car_model',
      headerName: 'Car Model',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => params.value || 'Unknown Car',
    },
    {
      field: 'pickup_time',
      headerName: 'Start Time',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => formatTime(params.value),
    },
    {
      field: 'dropoff_time',
      headerName: 'End Time',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => formatTime(params.value),
    },
    {
      field: 'booking_status',
      headerName: 'Status',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => getStatusChip(params.value),
    },
  ];

  return (
    <div style={{ width: '100%', marginTop: 10 }}>
      <DataGrid
        rows={schedules}
        columns={columns}
        getRowId={(row) => row.schedule_id ?? row.id}
        autoHeight
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        disableColumnMenu
        disableColumnSelector
        disableDensitySelector
        hideFooterSelectedRowCount
        sx={{
          '& .MuiDataGrid-columnHeaders': { backgroundColor: '#f5f5f5' },
          '& .MuiDataGrid-cell': { fontSize: 14 },
        }}
      />
    </div>
  );
};

export default DriverScheduleTable;
