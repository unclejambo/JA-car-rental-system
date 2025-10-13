import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Chip } from '@mui/material';

const CustomerPaymentHistoryTable = ({ payments }) => {
  const columns = [
    {
      field: 'paidDate',
      headerName: 'Paid Date',
      flex: 1.2,
      minWidth: 120,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      flex: 1.2,
      minWidth: 100,
      renderCell: (p) => (p.value != null ? `₱${p.value}` : ''),
    },
    {
      field: 'paymentMethod',
      headerName: 'Method',
      flex: 1.2,
      minWidth: 120,
    },
    {
      field: 'referenceNo',
      headerName: 'Reference No',
      flex: 1.2,
      minWidth: 150,
    },
  ];

  return (
    <DataGrid
      rows={payments}
      columns={columns}
      getRowId={(row) => row.transactionId}
      autoHeight
      hideFooterSelectedRowCount
      disableColumnMenu
      disableColumnFilter
      disableColumnSelector
      disableDensitySelector
      pagination
      pageSizeOptions={[5, 10, 25]}
      initialState={{
        pagination: { paginationModel: { pageSize: 10, page: 0 } },
      }}
    />
  );
};

export default CustomerPaymentHistoryTable;
