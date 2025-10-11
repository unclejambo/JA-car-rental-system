import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Chip } from '@mui/material';

const CustomerBookingHistoryTable = ({ bookings }) => {
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
      field: 'start_date',
      headerName: 'Start Date',
      flex: 1.5,
      minWidth: 120,
      renderCell: (p) => formatDate(p.value),
    },
    {
      field: 'end_date',
      headerName: 'End Date',
      flex: 1.5,
      minWidth: 120,
      renderCell: (p) => formatDate(p.value),
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => (p.value != null ? `₱${p.value}` : ''),
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
