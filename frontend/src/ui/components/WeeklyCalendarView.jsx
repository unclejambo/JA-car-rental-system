import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Tooltip,
} from '@mui/material';
import { CarRental, Event, Warning } from '@mui/icons-material';
import { Link } from 'react-router-dom';

export default function WeeklyCalendarView({ forRelease = [], forReturn = [] }) {
  const [view, setView] = useState('release');
  const [weekOffset, setWeekOffset] = useState(0);

  // Get week dates based on offset (Sunday to Saturday)
  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [weekOffset]);

  const currentData = view === 'release' ? forRelease : forReturn;

  // Group bookings by date
  const groupedByDate = useMemo(() => {
    const grouped = {};
    weekDates.forEach((date) => {
      const dateKey = date.toDateString();
      grouped[dateKey] = [];
    });

    currentData.forEach((booking) => {
      const bookingDate = new Date(
        view === 'release'
          ? booking.pickup_time || booking.start_date
          : booking.effective_end_date || booking.dropoff_time || booking.end_date
      );
      const dateKey = bookingDate.toDateString();
      if (grouped[dateKey]) {
        grouped[dateKey].push(booking);
      }
    });

    return grouped;
  }, [currentData, weekDates, view]);

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getStatusInfo = (booking) => {
    const now = new Date();
    const targetDate = new Date(
      view === 'release'
        ? booking.pickup_time || booking.start_date
        : booking.effective_end_date || booking.dropoff_time || booking.end_date
    );
    const isOverdue = targetDate < now;

    return {
      isOverdue,
      color: isOverdue ? '#ff9800' : '#4caf50',
      label: isOverdue ? 'OVERDUE' : 'UPCOMING',
    };
  };

  // Calculate counts for bookings within the displayed week
  const now = new Date();
  const startOfWeek = weekDates[0];
  const endOfWeek = new Date(weekDates[6]);
  endOfWeek.setHours(23, 59, 59, 999);

  // For current week (weekOffset === 0), filter by 'now' to show active/overdue
  // For past/future weeks, show all bookings in that week
  const activeBookings = currentData.filter((b) => {
    const targetDate = new Date(
      view === 'release'
        ? b.pickup_time || b.start_date
        : b.effective_end_date || b.dropoff_time || b.end_date
    );
    // Check if booking falls within the displayed week
    const inWeek = targetDate >= startOfWeek && targetDate <= endOfWeek;
    
    if (weekOffset === 0) {
      // Current week: only show non-overdue bookings
      return inWeek && targetDate >= now;
    } else {
      // Past/future weeks: show all bookings that aren't overdue relative to now
      return inWeek && targetDate >= now;
    }
  });
  
  const overdueBookings = currentData.filter((b) => {
    const targetDate = new Date(
      view === 'release'
        ? b.pickup_time || b.start_date
        : b.effective_end_date || b.dropoff_time || b.end_date
    );
    // Check if booking falls within the displayed week and is overdue
    return targetDate >= startOfWeek && targetDate <= endOfWeek && targetDate < now;
  });

  return (
    <Card
      sx={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background:
            view === 'release'
              ? 'linear-gradient(135deg, #c10007 0%, #8b0005 100%)'
              : 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
          p: { xs: 2, md: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
            }}
          >
            {view === 'release' ? (
              <CarRental sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }} />
            ) : (
              <Event sx={{ fontSize: { xs: 20, md: 24 }, color: '#fff' }} />
            )}
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: '#fff',
                fontSize: { xs: '1.125rem', md: '1.25rem' },
              }}
            >
              {view === 'release' ? 'FOR RELEASE' : 'FOR RETURN'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
              }}
            >
              {view === 'release' ? 'Pending vehicle releases' : 'Completed returns'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={
              activeBookings.length > 0 && overdueBookings.length > 0
                ? `${activeBookings.length} Upcoming, ${overdueBookings.length} Overdue`
                : activeBookings.length > 0
                  ? `${activeBookings.length} Upcoming`
                  : overdueBookings.length > 0
                    ? `${overdueBookings.length} Overdue`
                    : '0'
            }
            sx={{
              bgcolor:
                overdueBookings.length > 0
                  ? 'rgba(255, 152, 0, 0.9)'
                  : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
            size="small"
          />

          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                px: { xs: 1.5, md: 2 },
                py: 0.5,
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                '&.Mui-selected': {
                  bgcolor: 'rgba(255, 255, 255, 0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.35)',
                  },
                },
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                },
              },
            }}
          >
            <ToggleButton value="release">RELEASE</ToggleButton>
            <ToggleButton value="return">RETURN</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              onClick={() => setWeekOffset(weekOffset - 1)}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                minWidth: 'auto',
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              ◀
            </Button>
            <Typography
              variant="caption"
              sx={{
                color: '#fff',
                fontSize: { xs: '0.7rem', md: '0.75rem' },
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {weekOffset === 0 ? 'This Week' : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
            </Typography>
            <Button
              size="small"
              onClick={() => setWeekOffset(weekOffset + 1)}
              sx={{
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                minWidth: 'auto',
                px: 1.5,
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
              }}
            >
              ▶
            </Button>
            {weekOffset !== 0 && (
              <Button
                size="small"
                onClick={() => setWeekOffset(0)}
                sx={{
                  color: '#fff',
                  bgcolor: 'rgba(255, 235, 59, 0.2)',
                  fontSize: { xs: '0.65rem', md: '0.7rem' },
                  px: 1,
                  '&:hover': { bgcolor: 'rgba(255, 235, 59, 0.3)' },
                }}
              >
                Today
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 1.5, md: 2 } }}>
        {/* Weekly Calendar Grid - Always show */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: { xs: 0.5, md: 1 },
            mb: 2,
          }}
        >
              {weekDates.map((date, index) => {
                const dateKey = date.toDateString();
                const bookings = groupedByDate[dateKey] || [];
                const todayDate = isToday(date);
                const pastDate = isPast(date);

                return (
                  <Box
                    key={index}
                    sx={{
                      border: '1px solid',
                      borderColor: todayDate ? '#c10007' : '#e0e0e0',
                      borderRadius: 1,
                      p: { xs: 0.5, md: 1 },
                      bgcolor: todayDate
                        ? 'rgba(193, 0, 7, 0.05)'
                        : pastDate
                          ? '#fafafa'
                          : '#fff',
                      minHeight: { xs: 80, md: 100 },
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {/* Day Header */}
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: todayDate ? '#c10007' : 'text.secondary',
                        display: 'block',
                        mb: 0.5,
                        fontSize: { xs: '0.65rem', md: '0.75rem' },
                      }}
                    >
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: todayDate ? '#c10007' : 'text.primary',
                        mb: 0.5,
                        fontSize: { xs: '0.875rem', md: '1rem' },
                      }}
                    >
                      {date.getDate()}
                    </Typography>

                    {/* Bookings */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {bookings.slice(0, 3).map((booking) => {
                        const status = getStatusInfo(booking);
                        const time = new Date(
                          view === 'release'
                            ? booking.pickup_time || booking.start_date
                            : booking.effective_end_date || booking.dropoff_time || booking.end_date
                        );

                        return (
                          <Tooltip
                            key={booking.booking_id}
                            title={
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {booking.customer_name}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                  {booking.car_model}
                                </Typography>
                                <Typography variant="caption" sx={{ display: 'block' }}>
                                  {time.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Typography>
                                {view === 'return' && booking.isExtended && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      display: 'block', 
                                      color: '#ffeb3b',
                                      fontWeight: 700 
                                    }}
                                  >
                                    ⚡ Extended
                                  </Typography>
                                )}
                              </Box>
                            }
                            arrow
                          >
                            <Box
                              sx={{
                                bgcolor: status.color,
                                borderRadius: 0.5,
                                p: { xs: 0.25, md: 0.5 },
                                cursor: 'pointer',
                                border: view === 'return' && booking.isExtended ? '1px solid #ffeb3b' : 'none',
                                boxShadow: view === 'return' && booking.isExtended ? '0 0 4px rgba(255, 235, 59, 0.5)' : 'none',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#fff',
                                  fontSize: { xs: '0.55rem', md: '0.65rem' },
                                  fontWeight: 600,
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {view === 'return' && booking.isExtended && '⚡ '}
                                {time.toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: '#fff',
                                  fontSize: { xs: '0.5rem', md: '0.6rem' },
                                  display: 'block',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {booking.customer_name}
                              </Typography>
                            </Box>
                          </Tooltip>
                        );
                      })}
                      {bookings.length > 3 && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: { xs: '0.5rem', md: '0.6rem' },
                            textAlign: 'center',
                          }}
                        >
                          +{bookings.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
        </Box>

        {/* View All Button */}
        <Button
          component={Link}
          to={`/schedule?tab=${view === 'release' ? 'RELEASE' : 'RETURN'}`}
          variant="outlined"
          fullWidth
          sx={{
            borderColor: view === 'release' ? '#c10007' : '#000',
            color: view === 'release' ? '#c10007' : '#000',
            '&:hover': {
              borderColor: view === 'release' ? '#a00006' : '#333',
              bgcolor:
                view === 'release'
                  ? 'rgba(193, 0, 7, 0.04)'
                  : 'rgba(0, 0, 0, 0.04)',
            },
            py: { xs: 1, md: 1.5 },
          }}
        >
          View All {view === 'release' ? 'Releases' : 'Returns'}
        </Button>
      </CardContent>
    </Card>
  );
}
