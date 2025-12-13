import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  IconButton,
  Button,
  Select,
  MenuItem,
  Typography,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { HiInboxIn } from 'react-icons/hi';

const NullLoadingOverlay = () => null;

const ManageCarsTable = ({
  activeTab,
  rows,
  onEdit,
  onDelete,
  onExtend,
  onSetAvailable,
  onStatusChange,
}) => {
  // Custom empty state overlay
  const NoRowsOverlay = () => {
    const getMessage = () => {
      switch (activeTab) {
        case 'MAINTENANCE':
          return 'No Cars Under Maintenance';
        default:
          return 'No Cars Found';
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
      field: 'car_id',
      headerName: 'Car ID',
      flex: 1,
      minWidth: 80,
      editable: false,
      renderCell: (params) => (
        <Chip
          label={`#${params.value}`}
          size="small"
          sx={{
            backgroundColor: '#f5f5f5',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      ),
    },
    {
      field: 'model',
      headerName: 'Model',
      flex: 1.5,
      minWidth: 120,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {params.value}
        </Typography>
      ),
    },
  ];

  // Define tab-specific columns
  const tabSpecificColumns = {
    CARS: [
      {
        field: 'make',
        headerName: 'Make',
        flex: 1.5,
        minWidth: 80,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'car_type',
        headerName: 'Type',
        flex: 1.5,
        minWidth: 80,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'year',
        headerName: 'Year',
        flex: 1.5,
        minWidth: 80,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'mileage',
        headerName: 'Mileage',
        flex: 1.5,
        minWidth: 80,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'no_of_seat',
        headerName: 'Seats',
        flex: 1.5,
        minWidth: 70,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'isManual',
        headerName: 'Transmission',
        flex: 1.5,
        minWidth: 100,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value ? 'Manual' : 'Automatic'}
          </Typography>
        ),
      },
      {
        field: 'rent_price',
        headerName: 'Rent Price',
        flex: 1.5,
        minWidth: 100,
        editable: false,
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
        field: 'license_plate',
        headerName: 'License Plate',
        flex: 1.5,
        minWidth: 100,
        editable: false,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1.5,
        minWidth: 140,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const value = params.row.status || 'Available';
          return (
            <Select
              size="small"
              value={value}
              MenuProps={{
                disableScrollLock: true,
              }}
              onChange={(e) => {
                const newStatus = e.target.value;
                onStatusChange?.(params.row, newStatus);
              }}
              sx={{
                fontSize: '0.8rem',
                minWidth: 125,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#e0e0e0',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#bdbdbd',
                },
              }}
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Rented">Rented</MenuItem>
              <MenuItem value="Maintenance">Maintenance</MenuItem>
            </Select>
          );
        },
      },
      {
        field: 'action',
        headerName: '',
        flex: 1.5,
        minWidth: 80,
        editable: false,
        align: 'center',
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              color="primary"
              aria-label="edit"
              sx={{ p: 0.5 }}
              onClick={() => onEdit?.(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              aria-label="delete"
              sx={{ p: 0.5 }}
              onClick={() => onDelete?.(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      },
    ],
    MAINTENANCE: [
      {
        field: 'maintenance_start_date',
        headerName: 'Start Date',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => {
          const value =
            params.row.maintenance_start_date ||
            params.row.start_date ||
            params.row.startDate ||
            params.row.start;

          if (!value)
            return (
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                N/A
              </Typography>
            );
          const d = new Date(value);
          const dateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
          return (
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {dateStr}
            </Typography>
          );
        },
      },
      {
        field: 'maintenance_end_date',
        headerName: 'End Date',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => {
          const value =
            params.row.maintenance_end_date ||
            params.row.end_date ||
            params.row.endDate ||
            params.row.end;

          if (!value)
            return (
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                N/A
              </Typography>
            );
          const d = new Date(value);
          const dateStr = isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
          return (
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {dateStr}
            </Typography>
          );
        },
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 120,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'maintenance_shop_name',
        headerName: 'Shop Assigned',
        flex: 1.5,
        minWidth: 120,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'maintenance_cost',
        headerName: 'Maintenance Fee',
        flex: 1.5,
        minWidth: 130,
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
        field: 'action',
        headerName: '',
        flex: 2,
        minWidth: 180,
        editable: false,
        align: 'center',
        renderCell: (params) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Button
              size="small"
              variant="outlined"
              onClick={() => onExtend?.(params.row)}
              sx={{
                minWidth: 'auto',
                fontSize: '0.75rem',
                padding: '4px 4px',
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="contained"
              color="success"
              onClick={() => onSetAvailable?.(params.row)}
              sx={{
                minWidth: 'auto',
                fontSize: '0.70rem',
                padding: '4px 4px',
                whiteSpace: 'nowrap',
              }}
            >
              Set Available
            </Button>
          </Box>
        ),
      },
    ],
  };

  // Combine columns based on active tab
  const columns = [...commonColumns, ...(tabSpecificColumns[activeTab] || [])];

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
        getRowId={(row) =>
          row.maintenance_id ?? row.transactionId ?? row.id ?? row.car_id
        }
        // loading={loading}
        components={{ LoadingOverlay: NullLoadingOverlay }}
        componentsProps={{
          loadingOverlay: { sx: { display: 'none !important' } },
        }}
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

export default ManageCarsTable;
