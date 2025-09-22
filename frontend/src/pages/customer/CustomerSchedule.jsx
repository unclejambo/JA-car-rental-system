import React, { useState, useEffect } from 'react';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Header from '../../ui/components/Header';
import '../../styles/customercss/customerdashboard.css';
import { Box, Typography } from '@mui/material';
import { HiCalendarDays } from 'react-icons/hi2';
import CustomerScheduleTable from '../../ui/components/table/CustomerScheduleTable';
import Loading from '../../ui/components/Loading';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';

function CustomerSchedule() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // new state for schedule + loading
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parseNumber = (v) => {
      if (v == null) return null;
      const s = String(v).trim();
      return /^\d+$/.test(s) ? Number(s) : null;
    };

    const getCustomerIdFromStorage = () => {
      // 1) direct numeric keys
      const numericKeys = ['customerId', 'userId', 'id'];
      for (const k of numericKeys) {
        const v = localStorage.getItem(k);
        const n = parseNumber(v);
        if (n) return n;
      }

      // 2) stored user object
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const parsed = JSON.parse(userRaw);
          const possible = parsed?.customer_id ?? parsed?.id ?? parsed?.userId ?? parsed?.user_id;
          const n = parseNumber(possible);
          if (n) return n;
        }
      } catch (e) {
        /* ignore */
      }

      // 3) decode JWT (common token keys)
      const tokenKeys = ['authToken', 'token'];
      for (const tk of tokenKeys) {
        const t = localStorage.getItem(tk);
        if (!t) continue;
        try {
          const payload = t.split('.')[1];
          if (!payload) continue;
          const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
          const json = JSON.parse(atob(b64));
          const possible = json?.customer_id ?? json?.id ?? json?.sub;
          const n = parseNumber(possible);
          if (n) return n;
        } catch (e) {
          /* ignore invalid token */
        }
      }

      return null;
    };

    const fetchData = async () => {
      setLoading(true);
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');

      try {
        // Call protected endpoint that returns the current user's schedules
        const res = await authFetch(`${API_BASE}/schedules/me`, {
          headers: { Accept: 'application/json' },
        });

        if (res.status === 401) {
          // not authenticated
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          return;
        }

        if (!res.ok) throw new Error(`Failed to fetch schedules: ${res.status}`);
        const data = await res.json();
        setSchedule(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching schedules:', err);
        setSchedule([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || schedule === null) {
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
            '@media (max-width: 1024px)': {
              ml: '0px',
            },
            mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Loading />
        </Box>
      </>
    );
  }

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
          '@media (max-width: 1024px)': {
            ml: '0px',
          },
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' },
          height: '100%',
          boxSizing: 'border-box',
        }}
      >
        <title>Schedule</title>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <HiCalendarDays style={{ verticalAlign: '-3px' }} />
            SCHEDULE
          </Typography>
        </Box>

        <Box sx={{ height: 'calc(100% - 64px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {(!schedule || schedule.length === 0) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <Typography variant="h6">No schedule found</Typography>
            </Box>
          ) : (
            <CustomerScheduleTable rows={schedule} loading={loading} />
          )}
        </Box>
      </Box>
    </>
  );
}

export default CustomerSchedule;
