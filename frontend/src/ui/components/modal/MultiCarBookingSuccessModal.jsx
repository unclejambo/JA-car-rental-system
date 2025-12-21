import React from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  HiCheckCircle,
  HiX,
  HiCalendar,
  HiClock,
  HiLocationMarker,
  HiCurrencyDollar,
} from 'react-icons/hi';

export default function MultiCarBookingSuccessModal({
  open,
  onClose,
  bookingsData,
  cars,
}) {
  if (!bookingsData || !cars || cars.length === 0) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const calculateTotalCost = () => {
    return bookingsData.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
  };

  // Get car names for display
  const getCarNames = () => {
    return cars.map((car) => `${car.make} ${car.model}`).join(', ');
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          m: { xs: 1, sm: 2 },
          maxHeight: { xs: '95vh', sm: '90vh' },
        },
      }}
    >
      {/* Success Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #c10007 0%, #a50006 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <HiX size={24} />
        </IconButton>

        <Box sx={{ mb: 2 }}>
          <HiCheckCircle size={64} />
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Booking Requests Sent!
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Successfully booked {cars.length} car{cars.length !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Multiple Cars Summary */}
        <Box sx={{ px: 3, pt: 3, pb: 2 }}>
          <Card sx={{ border: '2px solid #c10007' }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#c10007' }}
              >
                🚗 Booked Vehicles ({cars.length})
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {getCarNames()}
              </Typography>
              <Chip
                label={`${cars.length} Vehicle${cars.length !== 1 ? 's' : ''}`}
                color="primary"
                sx={{
                  backgroundColor: '#c10007',
                  fontWeight: 'bold',
                }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Individual Car Details */}
        <Box sx={{ px: 3, pb: 2 }}>
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 'bold', color: '#333' }}
          >
            📋 Booking Details
          </Typography>

          {bookingsData.map((booking, index) => {
            const car = cars[index];
            if (!car) return null;

            return (
              <Card
                key={index}
                sx={{
                  mb: 2,
                  border: '1px solid #e0e0e0',
                  '&:last-child': { mb: 0 },
                }}
              >
                <CardContent>
                  {/* Car Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                      pb: 2,
                      borderBottom: '1px solid #e0e0e0',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {car.make} {car.model} ({car.year})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {car.no_of_seat} seats • Plate: {car.license_plate}
                      </Typography>
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ color: '#c10007', fontWeight: 'bold' }}
                    >
                      ₱{booking.totalCost?.toLocaleString()}
                    </Typography>
                  </Box>

                  {/* Booking Details */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Duration */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HiCalendar size={18} color="#c10007" />
                      <Box sx={{ ml: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Rental Period
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {formatDate(booking.startDate)} -{' '}
                          {formatDate(booking.endDate)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {calculateDays(booking.startDate, booking.endDate)} days
                          total
                        </Typography>
                      </Box>
                    </Box>

                    {/* Time */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HiClock size={18} color="#c10007" />
                      <Box sx={{ ml: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Schedule
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          Pickup: {formatTime(booking.pickupTime)} • Drop-off:{' '}
                          {formatTime(booking.dropoffTime)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Location */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                      <HiLocationMarker size={18} color="#c10007" />
                      <Box sx={{ ml: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Service Type
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {booking.deliveryType === 'delivery'
                            ? '🚚 Delivery Service'
                            : '📍 Pickup Service'}
                        </Typography>
                        {booking.deliveryType === 'delivery' ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            Delivery: {booking.deliveryLocation}
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            JA Car Rental Office
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Driver Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Driver:
                      </Typography>
                      <Chip
                        label={
                          booking.isSelfDrive
                            ? 'Self-Drive'
                            : 'Professional Driver'
                        }
                        size="small"
                        sx={{
                          ml: 1,
                          backgroundColor: booking.isSelfDrive
                            ? '#e3f2fd'
                            : '#fff3e0',
                          color: booking.isSelfDrive ? '#1976d2' : '#ed6c02',
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Total Cost Summary */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Card
            sx={{ backgroundColor: '#f0f8ff', border: '2px solid #c10007' }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  <HiCurrencyDollar
                    size={24}
                    color="#c10007"
                    style={{ verticalAlign: 'middle', marginRight: '8px' }}
                  />
                  Grand Total
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: '#c10007', fontWeight: 'bold' }}
                >
                  ₱{calculateTotalCost().toLocaleString()}
                </Typography>
              </Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Total for {cars.length} vehicle{cars.length !== 1 ? 's' : ''}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Status Info */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Card
            sx={{ backgroundColor: '#f0f8ff', border: '2px solid #2196f3' }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}
              >
                📞 What's Next?
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                • Go to your My Bookings section under the Settlement tab to
                make your payment and choose your preferred payment method to
                secure your bookings.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                • You can pay ₱1,000 per vehicle to reserve your bookings. The
                remaining balance must be settled before the vehicles are
                released.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                • After completing your payment, you'll receive a confirmation
                message for each booking.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                • You can check the status of all your bookings anytime in the
                My Bookings section.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tap to Close */}
        <Box
          sx={{
            p: 2,
            backgroundColor: '#c10007',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: '#a50006',
            },
          }}
          onClick={onClose}
        >
          <Typography
            variant="body2"
            sx={{ color: 'white', fontWeight: 'bold' }}
          >
            Tap anywhere to continue
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
