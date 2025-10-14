import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

const CustomerBookingHistoryTable = ({ bookings, onViewBooking }) => {
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  const columns = [
    {
      field: 'booking_date',
      headerName: 'Booking Date',
      flex: 1.5,
      minWidth: 120,
      renderCell: (p) => formatDate(p.value),
    },
    { field: 'car_model', headerName: 'Car Model', flex: 1.5, minWidth: 150 },
    {
      field: 'completion_date',
      headerName: 'Completion Date',
      flex: 1.5,
      minWidth: 120,
      renderCell: (p) => (p.value ? formatDate(p.value) : '-'),
    },
    {
      field: 'cancellation_date',
      headerName: 'Cancellation Date',
      flex: 1.5,
      minWidth: 120,
      renderCell: (p) => (p.value ? formatDate(p.value) : '-'),
    },
    {
      field: 'action',
      headerName: '',
      flex: 0.6,
      minWidth: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="View Booking Details" arrow>
          <IconButton
            size="small"
            onClick={() => onViewBooking && onViewBooking(params.row)}
            sx={{
              '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' },
            }}
          >
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // ✅ Normalize rows to ensure DataGrid always gets an array
  const normalizedRows = Array.isArray(bookings) ? bookings : [];

  return (
    <DataGrid
      rows={normalizedRows}
      columns={columns}
      getRowId={(row) => row.booking_id ?? row.id}
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
    />
  );
};

export default CustomerBookingHistoryTable;
