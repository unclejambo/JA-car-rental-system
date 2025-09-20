import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
} from 'react';
import { Box, Typography, Select, MenuItem } from '@mui/material';
import Header from '../../ui/components/Header';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Loading from '../../ui/components/Loading';
import { HiChartBar } from 'react-icons/hi2';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { useTransactionStore } from '../../store/transactions';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';

export default function AdminReportAnalytics() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false); // -----------------------------------> CHANGE TO TRUE WHEN CONTENT IS ADDED
  const [error, setError] = useState(null);
  const transactions = useTransactionStore((state) => state.transactions);

  // Month selector (default to current month)
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    new Date().getMonth()
  );
  const monthName = useMemo(
    () =>
      new Date(2000, selectedMonthIndex, 1).toLocaleString(undefined, {
        month: 'long',
      }),
    [selectedMonthIndex]
  );

  const monthTransactions = useMemo(() => {
    return (transactions || []).filter((t) => {
      const d = new Date(t.bookingDate);
      return !isNaN(d) && d.getMonth() === selectedMonthIndex;
    });
  }, [transactions, selectedMonthIndex]);

  const carData = useMemo(() => {
    const counts = {};
    monthTransactions.forEach((t) => {
      const key = t.carModel || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([category, value]) => ({
      category,
      value,
    }));
  }, [monthTransactions]);

  const customerData = useMemo(() => {
    const counts = {};
    monthTransactions.forEach((t) => {
      const key = t.customerName || 'Unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([category, value]) => ({
      category,
      value,
    }));
  }, [monthTransactions]);

  const income = useMemo(() => {
    // Sum totalAmount if present and numeric (you can refine this using paidDate/paymentStatus)
    return monthTransactions.reduce((sum, t) => {
      const amt = typeof t.totalAmount === 'number' ? t.totalAmount : 0;
      return sum + amt;
    }, 0);
  }, [monthTransactions]);

  const formatCurrency = (n) =>
    `₱ ${Number(n || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const carChartRef = useRef(null);
  const customerChartRef = useRef(null);

  // Most Rented Car chart
  useLayoutEffect(() => {
    if (!carChartRef.current) return;
    const root = am5.Root.new(carChartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout,
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 20 }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueYField: 'value',
        categoryXField: 'category',
        tooltip: am5.Tooltip.new(root, { labelText: '{valueY}' }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
    });

    xAxis.data.setAll(carData);
    series.data.setAll(carData);

    chart.appear(1000, 100);
    series.appear();

    return () => {
      root.dispose();
    };
  }, [carData]);

  // Top Customer chart
  useLayoutEffect(() => {
    if (!customerChartRef.current) return;
    const root = am5.Root.new(customerChartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        layout: root.verticalLayout,
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.CategoryAxis.new(root, {
        categoryField: 'category',
        renderer: am5xy.AxisRendererX.new(root, { minGridDistance: 20 }),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );

    const series = chart.series.push(
      am5xy.ColumnSeries.new(root, {
        xAxis,
        yAxis,
        valueYField: 'value',
        categoryXField: 'category',
        tooltip: am5.Tooltip.new(root, { labelText: '{valueY}' }),
      })
    );

    series.columns.template.setAll({
      cornerRadiusTL: 4,
      cornerRadiusTR: 4,
      strokeOpacity: 0,
    });

    xAxis.data.setAll(customerData);
    series.data.setAll(customerData);

    chart.appear(1000, 100);
    series.appear();

    return () => {
      root.dispose();
    };
  }, [customerData]);

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
                    fontSize: '2rem',
                  },
                }}
              >
                <HiChartBar
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                REPORT & ANALYTICS
              </Typography>
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
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 2,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#111' }}
                  className="font-pathway"
                >
                  TOTAL INCOME ({monthName}):{' '}
                  <span style={{ color: '#2e7d32' }}>
                    {formatCurrency(income)}
                  </span>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#555' }}>
                    Month:
                  </Typography>
                  <Select
                    size="small"
                    value={selectedMonthIndex}
                    onChange={(e) => setSelectedMonthIndex(e.target.value)}
                    sx={{ minWidth: 140, backgroundColor: '#fff' }}
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
                  gap: 2,
                }}
              >
                {/* Most Rented Car */}
                <Box
                  sx={{
                    display: 'flex',
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '36%', sm: 220 },
                      bgcolor: '#e5e5e5',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <DirectionsCarIcon
                      sx={{ fontSize: 40, color: '#333', mb: 1 }}
                    />
                    <Typography
                      className="font-pathway"
                      sx={{ fontWeight: 700 }}
                    >
                      Most Rented Car
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      BAR GRAPH
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2 }}>
                    <div
                      ref={carChartRef}
                      style={{ width: '100%', height: 260 }}
                    />
                  </Box>
                </Box>

                {/* Top Customer */}
                <Box
                  sx={{
                    display: 'flex',
                    bgcolor: '#fff',
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: '36%', sm: 220 },
                      bgcolor: '#e5e5e5',
                      p: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 40, color: '#333', mb: 1 }} />
                    <Typography
                      className="font-pathway"
                      sx={{ fontWeight: 700 }}
                    >
                      Top Customer
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      BAR GRAPH
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 2 }}>
                    <div
                      ref={customerChartRef}
                      style={{ width: '100%', height: 260 }}
                    />
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
