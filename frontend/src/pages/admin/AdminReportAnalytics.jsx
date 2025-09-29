import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Typography, Select, MenuItem, Chip, Stack } from '@mui/material';
import { createAuthenticatedFetch } from '../../utils/api';
import { useAuth } from '../../hooks/useAuth';
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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler
);

// API base URL
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

// Default months for fallback labels only
const DEFAULT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export default function AdminReportAnalytics() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View toggles from the sketches
  const [primaryView, setPrimaryView] = useState('income'); // 'income' | 'expenses' | 'topCars' | 'topCustomers'
  const [period, setPeriod] = useState('monthly'); // 'monthly' | 'quarterly' | 'yearly'
  const [topCategory, setTopCategory] = useState('cars'); // for bar section switcher (cars/customers)

  // Auth and API
  const { logout } = useAuth();
  const authenticatedFetch = useCallback(() => createAuthenticatedFetch(logout), [logout]);

  // Fallback timeout to ensure loading doesn't stay true forever
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, setting loading to false');
        setLoading(false);
        setError('Loading took too long. Please refresh the page.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  // Data states
  const [chartData, setChartData] = useState([]);
  const [chartLabels, setChartLabels] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [apiAvailableYears, setApiAvailableYears] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Separate data states for expenses view (maintenance + refunds)
  const [maintenanceData, setMaintenanceData] = useState([]);
  const [refundsData, setRefundsData] = useState([]);
  const [totalMaintenance, setTotalMaintenance] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);

  // Period selectors
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Use API years or fallback to static years (memoized to prevent re-computation)
  const availableYears = useMemo(() => {
    if (apiAvailableYears.length > 0) {
      return apiAvailableYears;
    }
    // Fallback years
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear; year++) {
      years.push(year);
    }
    return years;
  }, [apiAvailableYears]);

  // Load initial data
  useEffect(() => {
    const loadYears = async () => {
      try {
        console.log('Fetching available years from:', `${API_BASE}/analytics/years`);
        const authFetch = authenticatedFetch();
        const response = await authFetch(`${API_BASE}/analytics/years`);
        console.log('Years API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Years API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Years API response data:', data);
        
        if (data.ok) {
          setApiAvailableYears(data.years);
          setIsInitialLoad(false);
          // Don't update selectedYear here to prevent infinite loops
          // Let the user manually select or use current year default
        } else {
          console.error('API returned error:', data.message);
          setError(data.message || 'Failed to fetch available years');
          setIsInitialLoad(false);
        }
      } catch (err) {
        console.error('Error fetching available years:', err);
        setError('Failed to fetch available years: ' + err.message);
        // Set default years if API fails
        const currentYear = new Date().getFullYear();
        const fallbackYears = [];
        for (let year = 2020; year <= currentYear; year++) {
          fallbackYears.push(year);
        }
        setApiAvailableYears(fallbackYears);
        setIsInitialLoad(false);
      }
    };
    
    // Only load years once during initial load
    if (isInitialLoad && apiAvailableYears.length === 0) {
      loadYears();
    }
  }, [authenticatedFetch, apiAvailableYears.length, isInitialLoad]); // Only run during initial load
  
  // Fetch data when view or period changes
  useEffect(() => {
    const loadData = async () => {
      // Skip if no years available yet
      if (availableYears.length === 0) {
        console.log('No available years yet, skipping data load');
        return;
      }
      
      try {
        setLoading(true);
        let endpoint = '';
        let params = new URLSearchParams({
          period,
          year: selectedYear.toString()
        });
        
        if (period === 'quarterly') {
          params.append('quarter', selectedQuarter.toString());
        } else if (period === 'monthly') {
          params.append('month', selectedMonthIndex.toString());
        }
        
        const authFetch = authenticatedFetch();
        
        // Handle expenses view separately (fetch both maintenance and refunds)
        if (primaryView === 'expenses') {
          // Fetch maintenance data
          const maintenanceEndpoint = `/analytics/expenses?${params}`;
          console.log('Fetching maintenance data from:', `${API_BASE}${maintenanceEndpoint}`);
          const maintenanceResponse = await authFetch(`${API_BASE}${maintenanceEndpoint}`);
          
          if (!maintenanceResponse.ok) {
            throw new Error(`Maintenance API error: ${maintenanceResponse.status}`);
          }
          
          const maintenanceResult = await maintenanceResponse.json();
          console.log('Maintenance API response:', maintenanceResult);
          
          // Fetch refunds data
          const refundsEndpoint = `/analytics/refunds?${params}`;
          console.log('Fetching refunds data from:', `${API_BASE}${refundsEndpoint}`);
          const refundsResponse = await authFetch(`${API_BASE}${refundsEndpoint}`);
          
          if (!refundsResponse.ok) {
            throw new Error(`Refunds API error: ${refundsResponse.status}`);
          }
          
          const refundsResult = await refundsResponse.json();
          console.log('Refunds API response:', refundsResult);
          
          if (maintenanceResult.ok && refundsResult.ok) {
            setMaintenanceData(maintenanceResult.data || []);
            setRefundsData(refundsResult.data || []);
            setChartLabels(maintenanceResult.labels || refundsResult.labels || []);
            setTotalMaintenance(maintenanceResult.totalMaintenance || 0);
            setTotalRefunds(refundsResult.totalRefunds || 0);
            setTotalIncome((maintenanceResult.totalMaintenance || 0) + (refundsResult.totalRefunds || 0));
          } else {
            setError('Failed to fetch expenses data');
          }
          
          setLoading(false);
          return;
        }
        
        // Handle other views normally
        switch (primaryView) {
          case 'income':
            endpoint = `/analytics/income?${params}`;
            break;
          case 'topCars':
            endpoint = `/analytics/top-cars?${params}`;
            setTopCategory('cars'); // Sync topCategory
            break;
          case 'topCustomers':
            endpoint = `/analytics/top-customers?${params}`;
            setTopCategory('customers'); // Sync topCategory
            break;
          default:
            endpoint = `/analytics/income?${params}`;
        }
        
        console.log('Fetching analytics data from:', `${API_BASE}${endpoint}`);
        const response = await authFetch(`${API_BASE}${endpoint}`);
        console.log('Analytics API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log('Analytics API error response:', errorText);
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Analytics API response data:', data);
        
        if (data.ok) {
          setChartData(data.data || []);
          setChartLabels(data.labels || []);
          
          // Handle different total values from API
          if (data.totalIncome !== undefined) {
            setTotalIncome(data.totalIncome);
          } else if (data.totalExpenses !== undefined) {
            setTotalIncome(data.totalExpenses); // Reuse totalIncome state for expenses
          } else {
            // For top cars/customers, calculate total from data array
            const total = (data.data || []).reduce((sum, val) => sum + val, 0);
            setTotalIncome(total);
          }
        } else {
          setError(data.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to fetch analytics data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [primaryView, period, selectedYear, selectedQuarter, selectedMonthIndex, availableYears, authenticatedFetch]); // Now using memoized availableYears

  // Use totalIncome from API data only
  const income = totalIncome || 0;

  const formatCurrency = (n) =>
    `₱ ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Line dataset builder - API data only
  const lineData = useMemo(() => {
    const labels = chartLabels.length > 0 ? chartLabels : DEFAULT_MONTHS;
    
    console.log('Line chart data:', { labels, primaryView });
    
    if (primaryView === 'expenses') {
      // For expenses view, show two lines: maintenance and refunds
      const maintenanceChartData = maintenanceData.length > 0 ? maintenanceData : [];
      const refundsChartData = refundsData.length > 0 ? refundsData : [];
      
      console.log('Expenses chart data:', { maintenanceChartData, refundsChartData });
      
      return {
        labels,
        datasets: [
          {
            label: 'MAINTENANCE',
            data: maintenanceChartData,
            borderColor: '#ff6b35',
            backgroundColor: 'rgba(255,107,53,0.2)',
            tension: 0.3,
            fill: false,
          },
          {
            label: 'REFUNDS',
            data: refundsChartData,
            borderColor: '#c62828',
            backgroundColor: 'rgba(198,40,40,0.2)',
            tension: 0.3,
            fill: false,
          },
        ],
      };
    } else {
      // For income view, show single line
      const data = chartData.length > 0 ? chartData : [];
      console.log('Income chart data:', { data });
      
      return {
        labels,
        datasets: [
          {
            label: 'INCOME',
            data,
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(46,125,50,0.2)',
            tension: 0.3,
            fill: true,
          },
        ],
      };
    }
  }, [primaryView, chartData, chartLabels, maintenanceData, refundsData]);

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

  // Bar dataset builder - API data only
  const barData = useMemo(() => {
    const isCars = topCategory === 'cars';
    const hasApiData = chartData.length > 0 && chartLabels.length > 0;
    
    const labels = hasApiData ? chartLabels : [];
    const data = hasApiData ? chartData : [];
    
    console.log('Bar chart data:', { labels, data, topCategory, hasApiData });
    
    return {
      labels,
      datasets: [
        {
          label: isCars ? 'CARS' : 'CUSTOMERS',
          data,
          backgroundColor: '#1976d2',
          borderRadius: 6,
        },
      ],
    };
  }, [topCategory, chartData, chartLabels]);

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
                  {primaryView === 'income' && period === 'monthly' && `INCOME FOR ${new Date(2000, selectedMonthIndex, 1).toLocaleString(undefined, { month: 'long' })} :`}
                  {primaryView === 'income' && period === 'quarterly' && `INCOME FOR QUARTER ${selectedQuarter} :`}
                  {primaryView === 'income' && period === 'yearly' && `INCOME FOR ${selectedYear} :`}
                  {primaryView === 'expenses' && period === 'monthly' && `EXPENSES FOR ${new Date(2000, selectedMonthIndex, 1).toLocaleString(undefined, { month: 'long' })} :`}
                  {primaryView === 'expenses' && period === 'quarterly' && `EXPENSES FOR QUARTER ${selectedQuarter} :`}
                  {primaryView === 'expenses' && period === 'yearly' && `EXPENSES FOR ${selectedYear} :`}
                  {(primaryView === 'topCars' || primaryView === 'topCustomers') && `TOTAL BOOKINGS :`}{' '}
                  
                  {primaryView === 'expenses' ? (
                    <Box component="span" sx={{ display: 'block', mt: 0.5 }}>
                      <span style={{ color: '#ff6b35', fontSize: '0.85em' }}>
                        Maintenance: {formatCurrency(totalMaintenance)}
                      </span>
                      {' • '}
                      <span style={{ color: '#c62828', fontSize: '0.85em' }}>
                        Refunds: {formatCurrency(totalRefunds)}
                      </span>
                      <br />
                      <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                        Total: {formatCurrency(income)}
                      </span>
                    </Box>
                  ) : (
                    <span style={{ color: '#2e7d32' }}>
                      {formatCurrency(income)}
                    </span>
                  )}
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
                  {/* Dynamic dropdown based on period */}
                  {period === 'monthly' && (
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
                  )}
                  
                  {period === 'quarterly' && (
                    <Select
                      size="small"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      sx={{
                        backgroundColor: '#fff',
                        minWidth: { md: 140 },
                        width: { xs: '100%', md: 160 },
                      }}
                      MenuProps={{ disableScrollLock: true }}
                    >
                      <MenuItem value={1}>Quarter 1</MenuItem>
                      <MenuItem value={2}>Quarter 2</MenuItem>
                      <MenuItem value={3}>Quarter 3</MenuItem>
                      <MenuItem value={4}>Quarter 4</MenuItem>
                    </Select>
                  )}
                  
                  {period === 'yearly' && (
                    <Select
                      size="small"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      sx={{
                        backgroundColor: '#fff',
                        minWidth: { md: 140 },
                        width: { xs: '100%', md: 160 },
                      }}
                      MenuProps={{ disableScrollLock: true }}
                    >
                      {availableYears.map((year) => (
                        <MenuItem key={year} value={year}>
                          {year}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
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
                          LINE GRAPH
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
                          BAR GRAPH
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ p: 2, height: 320 }}>
                    {(chartData.length > 0 || (primaryView === 'expenses' && (maintenanceData.length > 0 || refundsData.length > 0))) ? (
                      primaryView === 'income' || primaryView === 'expenses' ? (
                        <Line 
                          key={`line-${primaryView}-${period}-${selectedYear}-${selectedQuarter}-${selectedMonthIndex}`}
                          data={lineData} 
                          options={lineOptions} 
                        />
                      ) : (
                        <Bar 
                          key={`bar-${primaryView}-${period}-${selectedYear}-${selectedQuarter}-${selectedMonthIndex}`}
                          data={barData} 
                          options={barOptions} 
                        />
                      )
                    ) : (
                      <Box 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#666',
                          fontSize: '1.1rem'
                        }}
                      >
                        {loading ? 'Loading data...' : 'No data available for the selected period'}
                      </Box>
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
