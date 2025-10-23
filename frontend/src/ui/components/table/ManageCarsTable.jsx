import { DataGrid } from '@mui/x-data-grid';
import { Box, IconButton, Button, Select, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const commonColumns = [
    {
      field: 'car_id',
      headerName: 'Car ID',
      flex: 1,
      minWidth: 70,
      editable: false,
      headerAlign: 'center',
      align: 'center',
    },
    {
      field: 'model',
      headerName: 'Model',
      flex: 1.5,
      minWidth: 80,
      editable: false,
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
      },
      {
        field: 'car_type',
        headerName: 'Type',
        flex: 1.5,
        minWidth: 80,
        editable: false,
      },
      {
        field: 'year',
        headerName: 'Year',
        flex: 1.5,
        minWidth: 80,
        editable: false,
      },
      {
        field: 'mileage',
        headerName: 'Mileage',
        flex: 1.5,
        minWidth: 80,
        editable: false,
      },
      {
        field: 'no_of_seat',
        headerName: 'Seats',
        flex: 1.5,
        minWidth: 70,
        editable: false,
      },
      {
        field: 'rent_price',
        headerName: 'Rent Price',
        flex: 1.5,
        minWidth: 100,
        editable: false,
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
        field: 'license_plate',
        headerName: 'License Plate',
        flex: 1.5,
        minWidth: 100,
        editable: false,
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1.5,
        minWidth: 130,
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
                // notify parent with the raw row
                onStatusChange?.(params.row, newStatus);
              }}
              sx={{ fontSize: '0.775rem', minWidth: 120 }}
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
          // Try multiple potential field names for start date
          const value =
            params.row.maintenance_start_date ||
            params.row.start_date ||
            params.row.startDate ||
            params.row.start;

          if (!value) return 'N/A';
          const d = new Date(value);
          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
        },
      },
      {
        field: 'maintenance_end_date',
        headerName: 'End Date',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => {
          // Try multiple potential field names for end date
          const value =
            params.row.maintenance_end_date ||
            params.row.end_date ||
            params.row.endDate ||
            params.row.end;

          if (!value) return 'N/A';
          const d = new Date(value);
          return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
        },
      },
      {
        field: 'description',
        headerName: 'Description',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'maintenance_shop_name',

        headerName: 'Shop Assigned',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'maintenance_cost',

        headerName: 'Maintenance Fee',
        flex: 1.5,
        minWidth: 120,
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
        getRowId={(row) =>
          row.maintenance_id ?? row.transactionId ?? row.id ?? row.car_id
        }
        // loading={loading}
        components={{ LoadingOverlay: NullLoadingOverlay }}
        componentsProps={{
          loadingOverlay: { sx: { display: 'none !important' } },
        }}
        autoHeight={false}
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

export default ManageCarsTable;
