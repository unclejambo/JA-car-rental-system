import React from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import { Box, Typography } from '@mui/material';
import { HiOutlineUserCircle } from 'react-icons/hi2';

function CustomerProfile() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = 'Profile';
  }, []);

  // Sample Data (replace later with dynamic)
  const profilePicture = 'jude.jpg';
  const favoriteCar = {
    image: 'nissan.png',
    model: 'Nissan Terra',
    type: 'SUV',
  };
  const info = {
    firstName: 'Jude Christian',
    lastName: 'Amoguis',
    address: 'R. Calo Butuan City',
    email: 'judechristian@gmail.com',
    birthdate: 'April 18, 1997',
  };
  const license = {
    number: 'K01-17-002807',
    restrictions: 'A, A1, B, B1, B2',
    expiration: '18/04/2032',
  };

  return (
    <>
      <Header onMenuClick={() => setMobileOpen(true)} isMenuOpen={mobileOpen} />
      <CustomerSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: `calc(100% - 18.7dvw)`,
          ml: {
            xs: '0px',
            sm: '0px',
            md: '18.7dvw',
            lg: '18.7dvw',
          },
          '@media (max-width: 1024px)': { ml: '0px' },
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Main Container */}
        <Box
          sx={{
            flexGrow: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f9f9f9',
            p: { xs: 1, sm: 2, md: 2, lg: 2 },
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 4px 0 6px -1px rgba(0, 0, 0, 0.1), -4px 0 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            height: 'auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontSize: '1.8rem',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'center', md: 'flex-start' },
              '@media (max-width: 1024px)': { fontSize: '1.5rem' },
            }}
          >
            <HiOutlineUserCircle style={{ marginRight: '8px' }} />
            MY PROFILE
          </Typography>

          {/* Content Box */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
              p: 4,
              bgcolor: '#fff',
              borderRadius: '10px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              mt: 2,
              alignItems: { xs: 'center', md: 'flex-start' },
              textAlign: { xs: 'center', md: 'left' },
              pl: { md: 30 },
            }}
          >
            {/* LEFT COLUMN: Profile + License */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: { xs: 'center', md: 'center' },
                gap: 3,
                flex: 1,
                width: '100%',
              }}
            >
              {/* Profile Picture */}
              <img
                src="jude.jpg"
                alt="Profile"
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              />

              {/* License Section */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'center', md: 'center' },
                  gap: 1,
                }}
              >
                <Typography sx={{ fontWeight: 700 }}>
                  License No:{' '}
                  <span style={{ fontWeight: 400 }}>{license.number}</span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Restrictions:{' '}
                  <span style={{ fontWeight: 400 }}>
                    {license.restrictions}
                  </span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Expiration Date:{' '}
                  <span style={{ fontWeight: 400 }}>{license.expiration}</span>
                </Typography>
              </Box>
            </Box>

            {/* RIGHT COLUMN: Info + Favorite Car */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: { xs: 'center', md: 'flex-start' },
                flex: 2,
                pl: { md: 30 },
                width: '100%',
              }}
            >
              {/* Info Section */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 700 }}>
                  First Name:{' '}
                  <span style={{ fontWeight: 400 }}>{info.firstName}</span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Last Name:{' '}
                  <span style={{ fontWeight: 400 }}>{info.lastName}</span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Address:{' '}
                  <span style={{ fontWeight: 400 }}>{info.address}</span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Email: <span style={{ fontWeight: 400 }}>{info.email}</span>
                </Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  Birthdate:{' '}
                  <span style={{ fontWeight: 400 }}>{info.birthdate}</span>
                </Typography>
              </Box>

              {/* Favorite Car */}
              {/* Favorite Car */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: { xs: 'center', md: 'flex-start' },
                  gap: 1,
                }}
              >
                {/* Title */}
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    mb: 1,
                  }}
                >
                  Favorite Car
                </Typography>

                {/* Car Image + Model + Type */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <img
                    src={favoriteCar.image}
                    alt="Favorite Car"
                    style={{
                      width: '120px',
                      height: '80px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      boxShadow: '0 0px 0px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                      {favoriteCar.model}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 400,
                        fontSize: '0.9rem',
                        color: 'gray',
                      }}
                    >
                      {favoriteCar.type}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default CustomerProfile;
