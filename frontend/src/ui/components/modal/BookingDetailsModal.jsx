import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { HiX } from 'react-icons/hi';

export default function BookingDetailsModal({ open, onClose, booking }) {
  if (!booking) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    return new Date(`1970-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableScrollLock
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '8px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 'bold',
        }}
      >
        📋 Booking Details
        <IconButton
          onClick={onClose}
          sx={{
            color: 'grey.500',
            '&:hover': {
              backgroundColor: 'grey.100',
            },
          }}
        >
          <HiX />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Customer Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Customer name:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.customerName || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Car plate number:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.carPlateNumber || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Car and Booking Info */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Car model:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.carModel || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Booking date:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(booking.bookingDate)}
              </Typography>
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary">
              Purpose:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {booking.purpose || 'N/A'}
            </Typography>
          </Box>

          {/* Date and Time Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Start date:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(booking.startDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Pick-up time:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatTime(booking.pickupTime)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                End date:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatDate(booking.endDate)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Drop-off time:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatTime(booking.dropoffTime)}
              </Typography>
            </Box>
          </Box>

          {/* Location Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Delivery location:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.deliveryLocation || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Drop-off location:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.dropoffLocation || 'N/A'}
              </Typography>
            </Box>
          </Box>

          {/* Driver and Contact Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Self-drive:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.selfDrive ? 'Yes' : 'No'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Driver:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.driverName ||
                  (booking.selfDrive ? 'Self-drive' : 'N/A')}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Phone number:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {booking.phoneNumber || 'N/A'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                FB link:
              </Typography>
              <Typography
                variant="body1"
                fontWeight="medium"
                sx={{ wordBreak: 'break-all' }}
              >
                {booking.fbLink || 'N/A'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Financial Information */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Reservation Fee:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(booking.reservationFee)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Driver fee:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(booking.driverFee)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Delivery fee:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {formatCurrency(booking.deliveryFee)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight="bold"
              >
                Total Rental Amount:
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                {formatCurrency(booking.totalAmount)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
