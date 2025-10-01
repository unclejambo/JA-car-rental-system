import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import Header from '../../ui/components/Header';
import DriverSideBar from '../../ui/components/DriverSideBar';
import { HiCalendar } from 'react-icons/hi2';

export default function DriverSchedule() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Driver Schedule</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <DriverSideBar
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
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '70px', sm: '70px', md: '56px', lg: '56px' },
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: '1.8rem',
                  color: '#000',
                  '@media (max-width: 1024px)': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                <HiCalendar
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                DRIVER SCHEDULE
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                mt: 4,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Driver Schedule functionality coming soon...
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={2}>
                This page will display your assigned bookings and schedule.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
