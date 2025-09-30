import { Button } from '@mui/material';
import { Link } from 'react-router-dom';

export default function LoginButton() {
  return (
    <Button
      component={Link}
      to="/login"
      variant="contained"
      sx={{
        backgroundColor: '#F13F3F',
        color: 'white',
        borderRadius: '20px',
        fontSize: '18px',
        fontFamily: '"Pathway Gothic One", sans-serif',
        minWidth: '100px',
        height: '40px',
        padding: '5px 16px',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100,
        textTransform: 'none',
        boxShadow: '0 2px 8px rgba(241, 63, 63, 0.3)',
        '&:hover': {
          backgroundColor: '#d32f2f',
          boxShadow: '0 4px 12px rgba(241, 63, 63, 0.4)',
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease',
      }}
    >
      Login
    </Button>
  );
}
