import React, { useState, useMemo } from 'react';
import { Box, Typography, Select, MenuItem, Chip, Stack } from '@mui/material';
import Header from '../../ui/components/Header'; // Unused import removed
import AdminSideBar from '../../ui/components/AdminSideBar'; // Unused import removed
import Loading from '../../ui/components/Loading'; // Unused import removed
import { HiChartBar } from 'react-icons/hi2'; // Unused import removed
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

// ----- Static datasets for sketches (module scope to keep stable identities) -----
const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const staticIncome = [
  12000, 15000, 9000, 18000, 22000, 14000, 11000, 16000, 13000, 19000, 23000,
  25000,
];
const staticExpenses = [
  8000, 7000, 6000, 9000, 10000, 9500, 8500, 9000, 9200, 10000, 11000, 12000,
];
const staticTopCars = [12, 9, 5, 14, 7, 6];
const staticTopCarLabels = [
  'Almera',
  'Vios',
  'City',
  'Mirage',
  'Wigo',
  'Raize',
];
const staticTopCustomers = [7, 5, 4, 4, 3, 2];
const staticTopCustomerLabels = [
  'A. Cruz',
  'B. Reyes',
  'C. Santos',
  'D. Lim',
  'E. Tan',
  'F. Dela Cruz',
];

export default function AdminReportAnalytics() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading] = useState(false); // -----------------------------------> CHANGE TO TRUE WHEN CONTENT IS ADDED
  const [error] = useState(null);

  // View toggles from the sketches
  const [primaryView, setPrimaryView] = useState('income'); // 'income' | 'expenses' | 'topCars' | 'topCustomers'
  const [period, setPeriod] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [topCategory, setTopCategory] = useState('cars'); // for bar section switcher (cars/customers)

  // Month selector (default to current month)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );
  // monthName computation removed; not used in UI

  const income = staticIncome[selectedMonthIndex] || 0; // Compute income from static data

  const formatCurrency = (n) =>
    `₱ ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Line dataset builder
  const lineData = useMemo(() => {
    const series = primaryView === 'income' ? staticIncome : staticExpenses;
    return {
      labels: months,
      datasets: [
        {
          label: primaryView === 'income' ? 'INCOME' : 'EXPENSES',
          data: series,
          borderColor: primaryView === 'income' ? '#2e7d32' : '#c62828',
          backgroundColor:
            primaryView === 'income'
              ? 'rgba(46,125,50,0.2)'
              : 'rgba(198,40,40,0.2)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  }, [primaryView]);

  const lineOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: { label: (ctx) => `₱ ${ctx.parsed.y.toLocaleString()}` },
        },
      },
      scales: {
        y: {
          ticks: { callback: (v) => `₱ ${Number(v).toLocaleString()}` },
          beginAtZero: true,
        },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  // Bar dataset builder (top cars/customers)
  const barData = useMemo(() => {
    const isCars = topCategory === 'cars';
    return {
      labels: isCars ? staticTopCarLabels : staticTopCustomerLabels,
      datasets: [
        {
          label: isCars ? 'CARS' : 'CUSTOMERS',
          data: isCars ? staticTopCars : staticTopCustomers,
          backgroundColor: '#1976d2',
          borderRadius: 6,
        },
      ],
    };
  }, [topCategory]);

  const barOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top' } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Loading />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
          color="error.main"
        >
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Report & Analytics</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
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
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' }, // Adjust based on your header height
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
                <HiChartBar
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                REPORT & ANALYTICS
              </Typography>
              <Select
                size="small"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                sx={{ ml: 'auto', bgcolor: '#fff' }}
                MenuProps={{ disableScrollLock: true }}
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Top summary and month selector */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { md: 'center' },
                  gap: 1.5,
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#111' }}
                  className="font-pathway"
                >
                  TOTAL INCOME :{' '}
                  <span style={{ color: '#2e7d32' }}>
                    {formatCurrency(income)}
                  </span>
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { md: 'center' },
                    gap: 1,
                    width: { xs: '100%', md: 'auto' },
                  }}
                >
                  <Select
                    size="small"
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(e.target.value)}
                    sx={{
                      backgroundColor: '#fff',
                      minWidth: { md: 140 },
                      width: { xs: '100%', md: 160 },
                    }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <MenuItem key={i} value={i}>
                        {new Date(2000, i, 1).toLocaleString(undefined, {
                          month: 'long',
                        })}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>

              {/* Charts */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr' },
                  gap: 0.5,
                }}
              >
                {/* Summary chips and dropdowns like sketches */}
                <Stack
                  direction="row"
                  spacing={0.3}
                  sx={{ width: '100%', flexWrap: 'nowrap' }}
                >
                  <Chip
                    label="INCOME"
                    clickable
                    onClick={() => setPrimaryView('income')}
                    aria-pressed={primaryView === 'income'}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 0,
                      borderTopLeftRadius: '8px',
                      bgcolor: primaryView === 'income' ? '#28a745' : '#d9d9d9',
                      color: primaryView === 'income' ? '#fff' : '#333',
                      border: '1px solid',
                      borderColor: '#ccc',
                      '& .MuiChip-label': {
                        fontWeight: primaryView === 'income' ? 600 : 400,
                      },
                      '&:hover': {
                        bgcolor:
                          primaryView === 'income' ? '#28a745' : '#4a4a4a',
                        color: '#fff',
                      },
                      '&:focus': { outline: 'none' },
                    }}
                  />
                  <Chip
                    label="EXPENSES"
                    clickable
                    onClick={() => setPrimaryView('expenses')}
                    aria-pressed={primaryView === 'expenses'}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 0,
                      bgcolor:
                        primaryView === 'expenses' ? '#c10007' : '#d9d9d9',
                      color: primaryView === 'expenses' ? '#fff' : '#333',
                      border: '1px solid',
                      borderColor: '#ccc',
                      '& .MuiChip-label': {
                        fontWeight: primaryView === 'expenses' ? 600 : 400,
                      },
                      '&:hover': {
                        bgcolor:
                          primaryView === 'expenses' ? '#c10007' : '#4a4a4a',
                        color: '#fff',
                      },
                      '&:focus': { outline: 'none' },
                    }}
                  />
                  <Chip
                    label="TOP CARS"
                    clickable
                    onClick={() => {
                      setPrimaryView('topCars');
                      setTopCategory('cars');
                    }}
                    aria-pressed={primaryView === 'topCars'}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 0,
                      bgcolor:
                        primaryView === 'topCars' ? '#1976d2' : '#d9d9d9',
                      color: primaryView === 'topCars' ? '#fff' : '#333',
                      border: '1px solid',
                      borderColor: '#ccc',
                      '& .MuiChip-label': {
                        fontWeight: primaryView === 'topCars' ? 600 : 400,
                      },
                      '&:hover': {
                        bgcolor:
                          primaryView === 'topCars' ? '#1976d2' : '#4a4a4a',
                        color: '#fff',
                      },
                      '&:focus': { outline: 'none' },
                    }}
                  />
                  <Chip
                    label="TOP CUSTOMERS"
                    clickable
                    onClick={() => {
                      setPrimaryView('topCustomers');
                      setTopCategory('customers');
                    }}
                    aria-pressed={primaryView === 'topCustomers'}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      borderRadius: 0,
                      borderTopRightRadius: '8px',
                      bgcolor:
                        primaryView === 'topCustomers' ? '#1976d2' : '#d9d9d9',
                      color: primaryView === 'topCustomers' ? '#fff' : '#333',
                      border: '1px solid',
                      borderColor: '#ccc',
                      '& .MuiChip-label': {
                        fontWeight: primaryView === 'topCustomers' ? 600 : 400,
                      },
                      '&:hover': {
                        bgcolor:
                          primaryView === 'topCustomers'
                            ? '#1976d2'
                            : '#4a4a4a',
                        color: '#fff',
                      },
                      '&:focus': { outline: 'none' },
                    }}
                  />
                </Stack>

                {/* Chart area switch: line for income/expenses, bar for top cars/customers */}
                <Box
                  sx={{
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      p: 2,
                      borderBottom: '1px solid #eee',
                      bgcolor: '#f3f4f6',
                    }}
                  >
                    {primaryView === 'income' || primaryView === 'expenses' ? (
                      <Box>
                        <Typography
                          className="font-pathway"
                          sx={{ fontWeight: 700 }}
                        >
                          {primaryView === 'income' ? 'Income' : 'Expenses'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          BAR GRAPH
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Typography
                          className="font-pathway"
                          sx={{ fontWeight: 700 }}
                        >
                          {topCategory === 'cars'
                            ? 'Top Cars'
                            : 'Top Customers'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          LINE GRAPH
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 2, height: 320 }}>
                    {primaryView === 'income' || primaryView === 'expenses' ? (
                      <Line data={lineData} options={lineOptions} />
                    ) : (
                      <Bar data={barData} options={barOptions} />
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
