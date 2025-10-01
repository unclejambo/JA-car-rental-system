import React from 'react';
import { DataGrid } from '@mui/x-data-grid';

const DriverScheduleTable = ({ schedules }) => {
  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  const columns = [
    {
      field: 'schedule_date',
      headerName: 'Schedule Date',
      flex: 1,
      minWidth: 120,
      renderCell: (p) => formatDate(p.value),
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      flex: 1,
      minWidth: 150,
      valueGetter: (params) =>
        `${params.row.customer_first_name || ''} ${params.row.customer_last_name || ''}`,
    },
    {
      field: 'car_model',
      headerName: 'Car Model',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'start_time',
      headerName: 'Start Time',
      flex: 1,
      minWidth: 120,
      renderCell: (p) =>
        p.value
          ? new Date(p.value).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
    },
    {
      field: 'end_time',
      headerName: 'End Time',
      flex: 1,
      minWidth: 120,
      renderCell: (p) =>
        p.value
          ? new Date(p.value).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '',
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
    },
  ];

  // ✅ Normalize rows
  const normalizedRows = Array.isArray(schedules) ? schedules : [];

  return (
    <DataGrid
      rows={normalizedRows}
      columns={columns}
      getRowId={(row) => row.schedule_id ?? row.id}
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

export default DriverScheduleTable;
