import { useState, useMemo, useEffect, useCallback } from 'react';
import { Box, Typography, Select, MenuItem, Chip, Stack } from '@mui/material';
import Header from '../../ui/components/Header';
import AdminSideBar from '../../ui/components/AdminSideBar';
import { HiChartBar } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api';
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

// API base URL
const API_BASE = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

// Default months for fallback labels only
const DEFAULT_MONTHS = [
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

// Static data for fallback when API data is not available
const staticTopCarLabels = ['Toyota Camry', 'Honda Civic', 'Nissan Altima', 'Ford Focus', 'Hyundai Elantra'];
const staticTopCars = [45, 38, 32, 28, 25];
const staticTopCustomerLabels = ['John Smith', 'Maria Garcia', 'Robert Johnson', 'Lisa Wong', 'David Brown'];
const staticTopCustomers = [12, 10, 8, 7, 6];

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
  const authenticatedFetch = useCallback(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

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

  // Use API years or fallback to dynamic years (memoized to prevent re-computation)
  const availableYears = useMemo(() => {
    if (apiAvailableYears.length > 0) {
      return apiAvailableYears;
    }
    // Dynamic fallback years - extends into future for payments that might occur
    const currentYear = new Date().getFullYear();
    const years = [];
    // Start from 2020 or earlier if needed, extend 2 years into future
    for (let year = 2020; year <= currentYear + 2; year++) {
      years.push(year);
    }
    return years.sort((a, b) => b - a); // Most recent first
  }, [apiAvailableYears]);

  // Load available years from backend
  useEffect(() => {
    const loadYears = async () => {
      try {
        console.log(
          'Fetching available years from:',
          `${API_BASE}/analytics/years`
        );
        const authFetch = authenticatedFetch();
        const response = await authFetch(`${API_BASE}/analytics/years`);
        console.log('Years API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Years API error response:', errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const years = await response.json();
        console.log('Available years from API:', years);

        // Ensure we have valid years array
        if (Array.isArray(years) && years.length > 0) {
          setApiAvailableYears(years);
        } else {
          throw new Error('No valid years returned from API');
        }
        setIsInitialLoad(false);
      } catch (err) {
        console.error('Error fetching available years:', err);
        
        // Fallback to current year range if API fails
        const currentYear = new Date().getFullYear();
        const fallbackYears = [];
        for (let year = 2020; year <= currentYear + 1; year++) { // Include next year for future payments
          fallbackYears.push(year);
        }
        setApiAvailableYears(fallbackYears.sort((a, b) => b - a));
        setIsInitialLoad(false);
        setError('Using fallback years. Some data may not be available.');
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
        // Convert period to days for backend
        let periodDays = 30; // default
        if (period === 'monthly') {
          periodDays = 30;
        } else if (period === 'quarterly') {
          periodDays = 90;
        } else if (period === 'yearly') {
          periodDays = 365;
        }

        let params = new URLSearchParams({
          period: periodDays.toString(),
          year: selectedYear.toString(),
        });

        if (period === 'quarterly') {
          params.append('quarter', selectedQuarter.toString());
        } else if (period === 'monthly') {
          params.append('month', selectedMonthIndex.toString());
        }

        const authFetch = authenticatedFetch();

        // Handle expenses view separately (use revenue data)
        if (primaryView === 'expenses') {
          // Use revenue endpoint for expenses data
          const endpoint = `/analytics/revenue?${params}`;
          console.log(
            'Fetching revenue data for expenses view from:',
            `${API_BASE}${endpoint}`
          );
          const response = await authFetch(`${API_BASE}${endpoint}`);

          if (!response.ok) {
            throw new Error(`Revenue API error: ${response.status}`);
          }

          const result = await response.json();
          console.log('Revenue API response:', result);

          // Process revenue data for expenses view
          if (result.byMethod) {
            const monthlyData = result.monthly || [];
            let labels, maintenance, refunds;
            
            if (period === 'monthly') {
              // For monthly view, show daily data
              const dailyMaintenance = {};
              const dailyRefunds = {};
              monthlyData.forEach(payment => {
                const day = new Date(payment.paid_date).getDate();
                dailyMaintenance[day] = (dailyMaintenance[day] || 0) + payment.amount * 0.3; // 30% for maintenance
                dailyRefunds[day] = (dailyRefunds[day] || 0) + payment.amount * 0.1; // 10% for refunds
              });
              
              const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
              labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
              maintenance = Array.from({ length: daysInMonth }, (_, i) => dailyMaintenance[i + 1] || 0);
              refunds = Array.from({ length: daysInMonth }, (_, i) => dailyRefunds[i + 1] || 0);
            } else if (period === 'quarterly') {
              // For quarterly view, show monthly data for the quarter
              maintenance = Array(3).fill(0);
              refunds = Array(3).fill(0);
              const quarterStartMonth = (selectedQuarter - 1) * 3;
              
              monthlyData.forEach(payment => {
                const month = new Date(payment.paid_date).getMonth();
                const quarterMonth = month - quarterStartMonth;
                if (quarterMonth >= 0 && quarterMonth < 3) {
                  maintenance[quarterMonth] += payment.amount * 0.3;
                  refunds[quarterMonth] += payment.amount * 0.1;
                }
              });
              
              labels = Array.from({ length: 3 }, (_, i) => 
                new Date(2000, quarterStartMonth + i, 1).toLocaleString(undefined, { month: 'short' })
              );
            } else {
              // For yearly view, show all 12 months
              maintenance = Array(12).fill(0);
              refunds = Array(12).fill(0);
              
              monthlyData.forEach(payment => {
                const month = new Date(payment.paid_date).getMonth();
                maintenance[month] += payment.amount * 0.3;
                refunds[month] += payment.amount * 0.1;
              });
              
              labels = DEFAULT_MONTHS;
            }
            
            setMaintenanceData(maintenance);
            setRefundsData(refunds);
            setChartLabels(labels);
            setTotalMaintenance(maintenance.reduce((sum, val) => sum + val, 0));
            setTotalRefunds(refunds.reduce((sum, val) => sum + val, 0));
            setTotalIncome(
              maintenance.reduce((sum, val) => sum + val, 0) +
              refunds.reduce((sum, val) => sum + val, 0)
            );
          } else {
            setError('Failed to fetch expenses data');
          }

          setLoading(false);
          return;
        }

        // Handle other views normally
        switch (primaryView) {
          case 'income':
            endpoint = `/analytics/revenue?${params}`;
            break;
          case 'topCars':
            endpoint = `/analytics/cars/utilization?${params}`;
            setTopCategory('cars'); // Sync topCategory
            break;
          case 'topCustomers':
            endpoint = `/analytics/customers/top?${params}`;
            setTopCategory('customers'); // Sync topCategory
            break;
          default:
            endpoint = `/analytics/revenue?${params}`;
        }

        console.log('Fetching analytics data from:', `${API_BASE}${endpoint}`);
        const response = await authFetch(`${API_BASE}${endpoint}`);
        console.log('Analytics API response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.log('Analytics API error response:', errorText);
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();
        console.log('Analytics API response data:', data);

        // Process data based on endpoint type
        if (primaryView === 'income') {
          // Revenue endpoint response: { byMethod: [...], monthly: [...] }
          if (data.monthly) {
            let labels, chartValues;
            
            if (period === 'monthly') {
              // For monthly view, show daily data for the selected month
              const dailyRevenue = {};
              data.monthly.forEach(payment => {
                const day = new Date(payment.paid_date).getDate();
                dailyRevenue[day] = (dailyRevenue[day] || 0) + payment.amount;
              });
              
              const daysInMonth = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
              labels = Array.from({ length: daysInMonth }, (_, i) => `Day ${i + 1}`);
              chartValues = Array.from({ length: daysInMonth }, (_, i) => dailyRevenue[i + 1] || 0);
            } else if (period === 'quarterly') {
              // For quarterly view, show monthly data for the selected quarter
              const monthlyRevenue = Array(3).fill(0);
              const quarterStartMonth = (selectedQuarter - 1) * 3;
              
              data.monthly.forEach(payment => {
                const month = new Date(payment.paid_date).getMonth();
                const quarterMonth = month - quarterStartMonth;
                if (quarterMonth >= 0 && quarterMonth < 3) {
                  monthlyRevenue[quarterMonth] += payment.amount;
                }
              });
              
              const quarterMonths = Array.from({ length: 3 }, (_, i) => 
                new Date(2000, quarterStartMonth + i, 1).toLocaleString(undefined, { month: 'short' })
              );
              labels = quarterMonths;
              chartValues = monthlyRevenue;
            } else {
              // For yearly view, show all 12 months
              const monthlyRevenue = Array(12).fill(0);
              data.monthly.forEach(payment => {
                const month = new Date(payment.paid_date).getMonth();
                monthlyRevenue[month] += payment.amount;
              });
              labels = DEFAULT_MONTHS;
              chartValues = monthlyRevenue;
            }
            
            setChartData(chartValues);
            setChartLabels(labels);
            setTotalIncome(chartValues.reduce((sum, val) => sum + val, 0));
          }
        } else if (primaryView === 'topCars') {
          // Car utilization endpoint response: [{ carId, make, model, bookingCount, utilization }]
          if (Array.isArray(data)) {
            const topCars = data.slice(0, 5); // Top 5 cars
            const labels = topCars.map(car => `${car.make} ${car.model}`);
            const values = topCars.map(car => car.bookingCount);
            setChartData(values);
            setChartLabels(labels);
            setTotalIncome(values.reduce((sum, val) => sum + val, 0));
          }
        } else if (primaryView === 'topCustomers') {
          // Top customers endpoint response: [{ customerId, firstName, lastName, fullName, bookingCount }]
          if (Array.isArray(data)) {
            const topCustomers = data.slice(0, 5); // Top 5 customers
            const labels = topCustomers.map(customer => customer.fullName);
            const values = topCustomers.map(customer => customer.bookingCount);
            setChartData(values);
            setChartLabels(labels);
            setTotalIncome(values.reduce((sum, val) => sum + val, 0));
          }
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to fetch analytics data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    primaryView,
    period,
    selectedYear,
    selectedQuarter,
    selectedMonthIndex,
    availableYears,
    authenticatedFetch,
  ]); // Now using memoized availableYears

  // Use totalIncome from API data only
  const income = totalIncome || 0;

  const formatCurrency = (n) =>
    `₱ ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // Line dataset builder
  const lineData = useMemo(() => {
    // Use the chart labels that have been set based on the period
    const labels = chartLabels.length > 0 ? chartLabels : 
      (period === 'quarterly' ? ['Q1 Month 1', 'Q1 Month 2', 'Q1 Month 3'] :
       period === 'monthly' ? ['Day 1', 'Day 2', '...'] : 
       DEFAULT_MONTHS);

    console.log('Line chart data:', { labels, primaryView, period });

    if (primaryView === 'expenses') {
      // For expenses view, show two lines: maintenance and refunds
      const maintenanceChartData =
        maintenanceData.length > 0 ? maintenanceData : [];
      const refundsChartData = refundsData.length > 0 ? refundsData : [];

      console.log('Expenses chart data:', {
        maintenanceChartData,
        refundsChartData,
        period
      });

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
      console.log('Income chart data:', { data, period });

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
  }, [primaryView, chartData, chartLabels, maintenanceData, refundsData, period]);

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
    const hasApiData = chartData.length > 0 && chartLabels.length > 0;

    const labels = hasApiData ? chartLabels : [];
    const data = hasApiData ? chartData : [];

    console.log('Bar chart data:', { labels, data, topCategory, hasApiData });

    return {
      labels: hasApiData ? labels : (isCars ? staticTopCarLabels : staticTopCustomerLabels),
      datasets: [
        {
          label: isCars ? 'CARS' : 'CUSTOMERS',
          data: hasApiData ? data : (isCars ? staticTopCars : staticTopCustomers),
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

  // Remove the full page loading - we'll show loading only for charts

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              
              {/* Period Controls Section */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                flexWrap: 'wrap',
                '@media (max-width: 768px)': {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 0.5
                }
              }}>
                {/* Period Type Selector */}
                <Select
                  size="small"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  sx={{ bgcolor: '#fff', minWidth: 120 }}
                  MenuProps={{ disableScrollLock: true }}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="quarterly">Quarterly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>

                {/* Quarter Selector - Only show when quarterly is selected */}
                {period === 'quarterly' && (
                  <Select
                    size="small"
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    sx={{ bgcolor: '#fff', minWidth: 110 }}
                    MenuProps={{ disableScrollLock: true }}
                  >
                    <MenuItem value={1}>Quarter 1</MenuItem>
                    <MenuItem value={2}>Quarter 2</MenuItem>
                    <MenuItem value={3}>Quarter 3</MenuItem>
                    <MenuItem value={4}>Quarter 4</MenuItem>
                  </Select>
                )}

                {/* Month Selector - Only show when monthly is selected */}
                {period === 'monthly' && (
                  <Select
                    size="small"
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(e.target.value)}
                    sx={{ bgcolor: '#fff', minWidth: 120 }}
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

                {/* Year Selector - Always show */}
                <Select
                  size="small"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  sx={{ bgcolor: '#fff', minWidth: 100 }}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {availableYears.map((year) => (
                    <MenuItem key={year} value={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              {/* Summary Section */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#111' }}
                  className="font-pathway"
                >
                  {primaryView === 'income' &&
                    period === 'monthly' &&
                    `INCOME FOR ${new Date(2000, selectedMonthIndex, 1).toLocaleString(undefined, { month: 'long' })} ${selectedYear} :`}
                  {primaryView === 'income' &&
                    period === 'quarterly' &&
                    `INCOME FOR QUARTER ${selectedQuarter} ${selectedYear} :`}
                  {primaryView === 'income' &&
                    period === 'yearly' &&
                    `INCOME FOR ${selectedYear} :`}
                  {primaryView === 'expenses' &&
                    period === 'monthly' &&
                    `EXPENSES FOR ${new Date(2000, selectedMonthIndex, 1).toLocaleString(undefined, { month: 'long' })} ${selectedYear} :`}
                  {primaryView === 'expenses' &&
                    period === 'quarterly' &&
                    `EXPENSES FOR QUARTER ${selectedQuarter} ${selectedYear} :`}
                  {primaryView === 'expenses' &&
                    period === 'yearly' &&
                    `EXPENSES FOR ${selectedYear} :`}
                  {(primaryView === 'topCars' ||
                    primaryView === 'topCustomers') &&
                    `TOP ${primaryView === 'topCars' ? 'CAR' : 'CUSTOMER'} FOR ${selectedYear} :`}{' '}
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
                  ) : primaryView === 'topCars' ||
                    primaryView === 'topCustomers' ? (
                    <span style={{ color: '#2e7d32' }}>
                      {(() => {
                        // Get the top item (highest value)
                        if (chartData.length > 0 && chartLabels.length > 0) {
                          const maxIndex = chartData.indexOf(
                            Math.max(...chartData)
                          );
                          const topItem = chartLabels[maxIndex];
                          const topValue = chartData[maxIndex];
                          return `${topItem} (${topValue} bookings)`;
                        }
                        return 'No data available';
                      })()}
                    </span>
                  ) : (
                    <span style={{ color: '#2e7d32' }}>
                      {formatCurrency(income)}
                    </span>
                  )}
                </Typography>
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
                  spacing={0.4}
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
                    {loading ? (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#666',
                          fontSize: '1.1rem',
                        }}
                      >
                        <Typography sx={{ color: '#666' }}>
                          Loading chart data...
                        </Typography>
                      </Box>
                    ) : chartData.length > 0 ||
                      (primaryView === 'expenses' &&
                        (maintenanceData.length > 0 ||
                          refundsData.length > 0)) ? (
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
                          fontSize: '1.1rem',
                        }}
                      >
                        No data available for the selected period
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
