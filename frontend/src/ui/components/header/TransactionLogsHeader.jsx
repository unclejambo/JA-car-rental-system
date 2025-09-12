import { Box, Button } from '@mui/material';

const TransactionLogsHeader = ({ activeTab = 'TRANSACTIONS', onTabChange }) => {
  const tabs = ['TRANSACTIONS', 'PAYMENT', 'REFUND'];

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.3,
        mb: -1,
        width: '100%',
        overflowX: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        py: 1,
        justifyContent: 'space-between',
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab}
          variant={activeTab === tab ? 'contained' : 'outlined'}
          onClick={() => onTabChange(tab)}
          sx={{
            flex: 1,
            minWidth: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            boxShadow: 0,
            borderRadius: 0,
            borderTopLeftRadius: tab === 'CUSTOMER' ? '8px' : 0,
            borderTopRightRadius: tab === 'DRIVER' ? '8px' : 0,
            color: activeTab === tab ? '#fff' : '#333',
            backgroundColor: activeTab === tab ? '#c10007' : '#d9d9d9',
            borderColor: '#ccc',
            textTransform: 'none',
            fontWeight: activeTab === tab ? 600 : 400,
            cursor: activeTab === tab ? 'default' : 'pointer',
            '&:hover': {
              backgroundColor: activeTab === tab ? '#c10007' : '#4a4a4a',
              borderColor: activeTab === tab ? '#4a4a4a' : '#999',
              color: activeTab === tab ? '#fff' : '#fff',
              boxShadow: 'none',
            },
            '&:active': {
              backgroundColor: activeTab === tab ? '#c10007' : '#d0d0d0',
              transition: activeTab === tab ? 'none' : 'all 0.2s ease',
            },
            '&:focus': {
              outline: 'none',
              boxShadow:
                activeTab === tab ? 'none' : '0 0 0 3px rgba(0, 0, 0, 0.1)',
            },
            '&.MuiButton-contained': {
              '&:hover, &:active': {
                boxShadow: 'none',
              },
            },
          }}
        >
          {tab}
        </Button>
      ))}
    </Box>
  );
};

export default TransactionLogsHeader;
