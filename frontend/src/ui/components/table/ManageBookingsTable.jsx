import { DataGrid } from '@mui/x-data-grid';
import { Box, Select, MenuItem } from '@mui/material';

const ManageBookingsTable = ({ activeTab, rows, loading }) => {
    // const isSmallScreen = useMediaQuery('(max-width:600px)');

    // Define columns that are common to all tabs
    const commonColumns = [
        {
            field: 'customerName',
            headerName: 'Customer Name',
            flex: 1.5,
            minWidth: 120,
            editable: false,
        },
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
            field: 'startDate',
            headerName: 'Start Date',
            flex: 1.5,
            minWidth: 100,
            editable: false,
        },
        {
            field: 'endDate',
            headerName: 'End Date',
            flex: 1.5,
            minWidth: 100,
            editable: false,
        },
    ];

    // Define tab-specific columns
    const tabSpecificColumns = {
        BOOKINGS: [
            {
                field: 'purpose',
                headerName: 'Purpose',
                flex: 1.2,
                minWidth: 80,
            },
             {
                field: 'paymentStatus',
                headerName: 'Payment Status',
                flex: 1.2,
                minWidth: 100,
            },
            {
                field: 'bookingStatus',
                headerName: 'Booking Status',
                flex: 1.2,
                minWidth: 100,
            }
        ],
        CANCELLATION: [
            {
                field: 'cancellationDate',
                headerName: 'Cancellation Date',
                flex: 1.5,
                minWidth: 120,
            },
            {
                field: 'cancellationReason',
                headerName: 'Cancellation Reason',
                flex: 1.5,
                minWidth: 120,
            },
        ],
        EXTENSION: [
            {
                field: 'newEndDate',
                headerName: 'New End Date',
                flex: 1.5,
            }
        ],
    };


    // Combine columns based on active tab
    const columns = [
        ...commonColumns,
        ...(tabSpecificColumns[activeTab] || []),
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
                disableColumnResize
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

export default ManageBookingsTable;
