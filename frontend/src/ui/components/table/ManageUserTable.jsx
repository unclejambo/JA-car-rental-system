import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Select,
  MenuItem,
  useMediaQuery,
  Skeleton,
  Typography,
  Chip,
} from '@mui/material';
import { HiInboxIn } from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useMemo } from 'react';

const ManageUserTable = ({ activeTab, rows, loading }) => {
  // Create authenticated fetch function
  const authFetch = useMemo(
    () =>
      createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }),
    []
  );
  const API_BASE = getApiBase().replace(/\/$/, '');
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // Custom empty state overlay
  const NoRowsOverlay = () => {
    const getMessage = () => {
      switch (activeTab) {
        case 'CUSTOMER':
          return 'No Customers Yet';
        case 'STAFF':
          return 'No Staffs Yet';
        case 'DRIVER':
          return 'No Drivers Yet';
        default:
          return 'No Users Yet';
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

  const formatDate = (iso) => {
    if (!iso) return '';
    if (typeof iso === 'string' && iso.includes('T')) return iso.split('T')[0];
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return d.toISOString().split('T')[0];
  };

  // Define columns that are common to all tabs
  const commonColumns = [
    {
      field: 'first_name',
      headerName: 'First Name',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 100,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1.5,
      minWidth: 150,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'contact_number',
      headerName: 'Contact #',
      flex: 1,
      minWidth: 100,
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
    CUSTOMER: [
      {
        field: 'fb_link',
        headerName: 'SocMed Link',
        flex: 1.2,
        minWidth: 100,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params) => {
          const url = params.value;
          if (!url)
            return (
              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                -
              </Typography>
            );
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: '#1976d2',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              Link
            </a>
          );
        },
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 150,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'driver_license_no',
        headerName: 'License #',
        flex: 1.2,
        minWidth: 120,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value || '-'}
          </Typography>
        ),
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 1.2,
        minWidth: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    STAFF: [
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 150,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 2,
        minWidth: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    DRIVER: [
      {
        field: 'restriction',
        headerName: 'Restriction',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'expiryDate',
        headerName: 'Expiry Date',
        flex: 1.5,
        minWidth: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {formatDate(params?.row?.expiryDate ?? params?.value)}
          </Typography>
        ),
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 2,
        minWidth: 100,
        renderCell: (params) => (
          <Typography sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
  };

  // Status column (common to all tabs)
  const statusColumn = {
    field: 'status',
    headerName: 'Status',
    flex: 1,
    minWidth: 120,
    editable: false,
    sortable: true,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      // If STAFF tab and user_type is superadmin -> show static label 'ADMIN'
      if (
        activeTab === 'STAFF' &&
        (params.row?.user_type === 'admin' || params.row?.userType === 'admin')
      ) {
        return (
          <Box
            sx={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 1,
            }}
          >
            ADMIN
          </Box>
        );
      }

      const handleStatusChange = async (e) => {
        const newStatusLabel = e.target.value; // 'Active' | 'Inactive'
        const bodyStatus = newStatusLabel.toLowerCase(); // send 'active'|'inactive' (backend normalizes)

        try {
          // Determine the correct API endpoint based on activeTab
          let endpoint = '';
          switch (activeTab) {
            case 'CUSTOMER':
              endpoint = `${API_BASE}/api/customers/${params.id}`;
              break;
            case 'DRIVER':
              endpoint = `${API_BASE}/drivers/${params.id}`;
              break;
            case 'STAFF':
              endpoint = `${API_BASE}/admins/${params.id}`;
              break;
            default:
              endpoint = `${API_BASE}/api/customers/${params.id}`;
          }

          const response = await authFetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: bodyStatus }),
          });

          const json = await response.json().catch(() => null);
          if (!response.ok) {
            throw new Error(
              json?.error || json?.message || 'Failed to update status'
            );
          }

          // update only the status cell in the grid with the display label
          params.api.updateRows([{ id: params.id, status: newStatusLabel }]);
        } catch (error) {
          console.error('Failed to update status:', error);
        }
      };

      // normalize value so boolean, "Active"/"active" all display correctly
      const statusLabel =
        params.value === true ||
        params.value === 'Active' ||
        params.value === 'active' ||
        params.value === 1 ||
        params.value === '1'
          ? 'Active'
          : 'Inactive';

      return (
        <Select
          value={statusLabel}
          onChange={handleStatusChange}
          sx={{
            width: 100,
            height: 32,
            fontSize: '0.8rem',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#e0e0e0',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#bdbdbd',
            },
          }}
          onClick={(e) => e.stopPropagation()}
          MenuProps={{ disableScrollLock: true }}
        >
          <MenuItem value="Active" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
            Active
          </MenuItem>
          <MenuItem
            value="Inactive"
            sx={{ fontSize: '0.8rem', fontWeight: 600 }}
          >
            Inactive
          </MenuItem>
        </Select>
      );
    },
  };

  // Combine columns based on active tab
  const columns = [
    ...commonColumns,
    ...(tabSpecificColumns[activeTab] || []),
    statusColumn,
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
          '& .MuiDataGrid-loadingOverlay': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '& .MuiCircularProgress-root': {
              color: '#c10007',
            },
          },
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns.filter((col) => !col.hide)}
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
        disableColumnResize={false}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        // slotProps={{
        //   loadingOverlay: {
        //     variant: 'linear-progress',
        //   },
        // }}
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
          '& .MuiDataGrid-loadingOverlay': {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(1px)',
          },
          '@media (max-width: 1024px)': {
            pageSizeOptions: [],
          },
        }}
      />
    </Box>
  );
};

export default ManageUserTable;
