import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { HiInboxIn } from 'react-icons/hi';

const TransactionLogsTable = ({ activeTab, rows, loading, onViewBooking }) => {
  // Custom empty state overlay
  const NoRowsOverlay = () => {
    const getMessage = () => {
      switch (activeTab) {
        case 'PAYMENT':
          return 'No Payments';
        case 'REFUND':
          return 'No Refunds';
        default:
          return 'No Transactions';
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          backgroundColor: '#f9f9f9',
          py: 8,
        }}
      >
        <HiInboxIn size={64} color="#9e9e9e" />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            color: '#757575',
            fontWeight: 500,
          }}
        >
          {getMessage()}
        </Typography>
      </Box>
    );
  };

  const commonColumns = [
    {
      field: 'customerName',
      headerName: 'Customer Name',
      flex: 1.5,
      minWidth: 120,
      editable: false,
    },
  ];

  // Define tab-specific columns
  const tabSpecificColumns = {
    TRANSACTIONS: [
      {
        field: 'carModel',
        headerName: 'Car Model',
        flex: 1.5,
        minWidth: 70,
        editable: false,
      },
      {
        field: 'bookingDate',
        headerName: 'Booking Date',
        flex: 1.5,
        minWidth: 100,
        editable: false,
      },
      {
        field: 'completionDate',
        headerName: 'Completion Date',
        flex: 1.5,
        minWidth: 100,
        editable: false,
      },
      {
        field: 'cancellationDate',
        headerName: 'Cancellation Date',
        flex: 1.5,
        minWidth: 100,
        editable: false,
      },
    ],
    PAYMENT: [
      {
        field: 'paymentMethod',
        headerName: 'Payment Method',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'referenceNo',
        headerName: 'Reference No',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'gCashNo',
        headerName: 'GCash No',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => {
          return params.value
            ? '₱' +
                Number(params.value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
            : 'N/A';
        },
      },
      {
        field: 'paidDate',
        headerName: 'Paid Date',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 120,
      },
    ],
    REFUND: [
      {
        field: 'refundMethod',
        headerName: 'Refund Method',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'referenceNo',
        headerName: 'Reference No',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'gCashNo',
        headerName: 'GCash No',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'refundAmount',
        headerName: 'Refund Amount',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => {
          return params.value
            ? '₱' +
                Number(params.value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
            : 'N/A';
        },
      },
      {
        field: 'refundDate',
        headerName: 'Refund Date',
        flex: 1.5,
        minWidth: 100,
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 120,
      },
    ],
  };

  // Combine columns based on active tab
  const actionColumn =
    activeTab === 'TRANSACTIONS'
      ? [
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
                  onClick={() =>
                    onViewBooking &&
                    onViewBooking(params.row, params.row.transactionId)
                  }
                  sx={{
                    '&:hover': { backgroundColor: 'rgba(25,118,210,0.08)' },
                  }}
                >
                  <MoreHorizIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ),
          },
        ]
      : [];

  const columns = [
    ...commonColumns,
    ...(tabSpecificColumns[activeTab] || []),
    ...actionColumn,
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
        rows={rows}
        columns={columns.filter((col) => !col.hide)}
        getRowId={(row) => row.transactionId}
        loading={loading}
        autoHeight={true}
        hideFooterSelectedRowCount
        disableColumnMenu
        disableColumnFilter
        disableColumnSelector
        disableDensitySelector
        disableVirtualization
        pagination
        pageSizeOptions={[5, 10, 25]}
        disableColumnResize
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        slots={{
          noRowsOverlay: () => <NoRowsOverlay />,
        }}
        sx={{
          width: '100%',
          minHeight: '400px',
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

export default TransactionLogsTable;
