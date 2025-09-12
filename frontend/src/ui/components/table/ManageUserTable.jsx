import { DataGrid } from '@mui/x-data-grid';
import { Box, Select, MenuItem, useMediaQuery } from '@mui/material';

const ManageUserTable = ({ activeTab, rows, loading }) => {
  const isSmallScreen = useMediaQuery('(max-width:600px)');

  // Define columns that are common to all tabs
  const commonColumns = [
    {
      field: 'firstName',
      headerName: 'First Name',
      flex: 1,
      minWidth: 70,
      editable: false,
    },
    {
      field: 'lastName',
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
      field: 'contactNumber',
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
        field: 'socMedLink',
        headerName: 'SocMed Link',
        flex: 1.2,
        minWidth: 80,
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 120,
      },
      {
        field: 'driversLicenseNo',
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
        field: 'licenseType',
        headerName: 'License Type',
        flex: 1,
        minWidth: 100,
      },
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
    editable: true,
    sortable: false,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        try {
          // Update the status in the mock API
          const response = await fetch(
            `https://68bd9bc5227c48698f84f2ce.mockapi.io/users/${params.id}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...params.row,
                status: newStatus === 'Active',
              }),
            }
          );

          if (!response.ok) {
            throw new Error('Failed to update status');
          }

          // Update the local state to reflect the change
          params.api.updateRows([{ ...params.row, status: newStatus }]);
        } catch (error) {
          console.error('Error updating status:', error);
          // Optionally show an error message to the user
        }
      };

      return (
        <Select
          value={params.value}
          onChange={handleStatusChange}
          sx={{ width: 90, height: 20, fontSize: 12 }}
          onClick={(e) => e.stopPropagation()}
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
            paginationModel: { pageSize: 5, page: 0 },
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

export default ManageUserTable;
