import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Tooltip, Typography, Chip } from '@mui/material';
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
      headerName: 'Customer',
      flex: 1.5,
      minWidth: 140,
      editable: false,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {params.value}
        </Typography>
      ),
    },
  ];

  // Define tab-specific columns
  const tabSpecificColumns = {
    TRANSACTIONS: [
      {
        field: 'carModel',
        headerName: 'Car Model',
        flex: 1.5,
        minWidth: 120,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'startDate',
        headerName: 'Start Date',
        flex: 1.5,
        minWidth: 120,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'endDate',
        headerName: 'End Date',
        flex: 1.5,
        minWidth: 120,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'driver',
        headerName: 'Driver',
        flex: 1.5,
        minWidth: 130,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'completionDate',
        headerName: 'Completion',
        flex: 1.5,
        minWidth: 130,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'cancellationDate',
        headerName: 'Cancellation',
        flex: 1.5,
        minWidth: 140,
        editable: false,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    PAYMENT: [
      {
        field: 'paymentMethod',
        headerName: 'Method',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'referenceNo',
        headerName: 'Reference No',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'gCashNo',
        headerName: 'GCash No',
        flex: 1.5,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'totalAmount',
        headerName: 'Total Amount',
        flex: 1.5,
        minWidth: 120,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1976d2' }}
          >
            {params.value
              ? '₱' +
                Number(params.value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : 'N/A'}
          </Typography>
        ),
      },
      {
        field: 'paidDate',
        headerName: 'Paid Date',
        flex: 1.5,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    REFUND: [
      {
        field: 'refundMethod',
        headerName: 'Method',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'referenceNo',
        headerName: 'Reference No',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'gCashNo',
        headerName: 'GCash No',
        flex: 1.5,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'refundAmount',
        headerName: 'Amount',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography
            sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1976d2' }}
          >
            {params.value
              ? '₱' +
                Number(params.value).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : 'N/A'}
          </Typography>
        ),
      },
      {
        field: 'refundDate',
        headerName: 'Refund Date',
        flex: 1.5,
        minWidth: 110,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 130,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
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
          background:
            'linear-gradient(135deg, rgba(193, 0, 7, 0.05) 0%, rgba(139, 0, 5, 0.06) 100%)',
          border: 'none',
          '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(193, 0, 7, 0.12)',
            },
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#fafafa',
            borderBottom: '2px solid #e0e0e0',
            minHeight: '56px !important',
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            fontSize: '0.875rem',
            color: '#424242',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
          '& .MuiTablePagination-root': {
            color: '#000',
            '& .MuiSvgIcon-root': {
              color: '#000',
            },
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '2px solid #e0e0e0',
            backgroundColor: '#fafafa',
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
