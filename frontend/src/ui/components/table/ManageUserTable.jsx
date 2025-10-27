import { DataGrid } from '@mui/x-data-grid';
import { Box, Select, MenuItem, useMediaQuery, Skeleton } from '@mui/material';

// use Vite env var, fallback to localhost; remove trailing slash if present
const API_BASE = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;

const ManageUserTable = ({ activeTab, rows, loading }) => {
  const isSmallScreen = useMediaQuery('(max-width:600px)');
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
      minWidth: 70,
      editable: false,
    },
    {
      field: 'last_name',
      headerName: 'Last Name',
      flex: 1,
      minWidth: 70,
      editable: false,
    },
    {
      field: 'address',
      headerName: 'Address',
      flex: 1.5,
      minWidth: 120,
      editable: false,
    },
    {
      field: 'contact_number',
      headerName: 'Contact #',
      flex: 1,
      minWidth: 90,
      editable: false,
    },
  ];

  // Define tab-specific columns
  const tabSpecificColumns = {
    CUSTOMER: [
      {
        field: 'fb_link',
        headerName: 'SocMed Link',
        flex: 1.2,
        minWidth: 80,
        renderCell: (params) => {
          const url = params.value;
          if (!url) return <span>-</span>;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color: '#1976d2',
                textDecoration: 'none',
                fontWeight: 500,
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
        minWidth: 120,
      },
      {
        field: 'driver_license_no',
        headerName: 'License #',
        flex: 1.2,
        minWidth: 80,
        hide: isSmallScreen,
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 1.2,
        minWidth: 90,
      },
    ],
    STAFF: [
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 2,
        minWidth: 90,
      },
    ],
    DRIVER: [
      {
        field: 'restriction',
        headerName: 'Restriction',
        flex: 1.5,
        minWidth: 70,
      },
      {
        field: 'expiryDate',
        headerName: 'Expiry Date',
        flex: 1.5,
        minWidth: 80,
        renderCell: (params) => (
          <span>{formatDate(params?.row?.expiryDate ?? params?.value)}</span>
        ),
      },
      {
        field: 'username',
        headerName: 'Username',
        flex: 2,
        minWidth: 90,
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
              endpoint = `${API_BASE}/customers/${params.id}`;
              break;
            case 'DRIVER':
              endpoint = `${API_BASE}/drivers/${params.id}`;
              break;
            case 'STAFF':
              // For staff/admin, we don't allow status changes via dropdown
              return;
            default:
              endpoint = `${API_BASE}/customers/${params.id}`;
          }

          const response = await fetch(endpoint, {
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
        } catch (error) {}
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
          sx={{ width: 90, height: 20, fontSize: 12 }}
          onClick={(e) => e.stopPropagation()}
          MenuProps={{ disableScrollLock: true }}
        >
          <MenuItem value="Active" sx={{ fontSize: 12 }}>
            Active
          </MenuItem>
          <MenuItem value="Inactive" sx={{ fontSize: 12 }}>
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
        autoHeight={false}
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
