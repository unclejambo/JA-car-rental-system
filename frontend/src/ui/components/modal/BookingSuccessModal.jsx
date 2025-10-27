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
} from '@mui/material';
import {
  HiCheckCircle,
  HiX,
  HiCalendar,
  HiClock,
  HiLocationMarker,
  HiCurrencyDollar,
} from 'react-icons/hi';

export default function BookingSuccessModal({
  open,
  onClose,
  bookingData,
  car,
}) {
  if (!bookingData || !car) return null;

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

  const calculateDays = () => {
    const start = new Date(bookingData.startDate);
    const end = new Date(bookingData.endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
          Booking Request Sent!
        </Typography>

        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Your car rental request has been submitted successfully
        </Typography>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Booking Reference */}
        <Box sx={{ p: 3, backgroundColor: '#f8f9fa', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Booking Reference
          </Typography>
          <Typography
            variant="h6"
            sx={{ fontWeight: 'bold', color: '#c10007' }}
          >
            #BK-{Date.now().toString().slice(-6)}
          </Typography>
        </Box>

        {/* Car Details */}
        <Card sx={{ m: 3, border: '2px solid #c10007' }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ mb: 2, fontWeight: 'bold', color: '#c10007' }}
            >
              🚗 Vehicle Details
            </Typography>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
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
                ₱{car.rent_price?.toLocaleString()}/day
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Booking Summary */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Card sx={{ border: '1px solid #e0e0e0' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                📋 Booking Summary
              </Typography>

              {/* Duration */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HiCalendar size={20} color="#c10007" />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Rental Period
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatDate(bookingData.startDate)} -{' '}
                    {formatDate(bookingData.endDate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {calculateDays()} days total
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Time */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HiClock size={20} color="#c10007" />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Schedule
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Pickup: {formatTime(bookingData.pickupTime)} • Drop-off:{' '}
                    {formatTime(bookingData.dropoffTime)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Location */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <HiLocationMarker size={20} color="#c10007" />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Service Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {bookingData.deliveryType === 'delivery'
                      ? '🚚 Delivery Service'
                      : '📍 Pickup Service'}
                  </Typography>
                  {bookingData.deliveryType === 'delivery' ? (
                    <Typography variant="body2" color="text.secondary">
                      Delivery: {bookingData.deliveryLocation}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      JA Car Rental Office
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Cost */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HiCurrencyDollar size={20} color="#c10007" />
                <Box sx={{ ml: 2, flex: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Cost
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 'bold', color: '#c10007' }}
                  >
                    ₱{bookingData.totalCost?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {bookingData.isSelfDrive
                      ? 'Self-Drive Service'
                      : 'With Professional Driver'}
                  </Typography>
                </Box>
              </Box>
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
                secure your booking.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                • You can pay ₱1,000 to reserve your booking. The remaining
                balance must be settled before the vehicle is released.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.6 }}>
                • After completing your payment, you’ll receive a confirmation
                message.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                • You can also check your booking status anytime in the My
                Bookings section.
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
