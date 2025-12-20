import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { HiX, HiCalendar, HiClock, HiLocationMarker } from 'react-icons/hi';
import { MdDirectionsCar } from 'react-icons/md';

export default function GroupBookingDetailsModal({ open, onClose, groupData }) {
  if (!groupData || !groupData.bookings) {
    return null;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#c10007',
          color: 'white',
          py: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MdDirectionsCar size={24} />
          <Typography variant="h6" fontWeight="bold">
            Group Booking Details - {groupData.booking_group_id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Summary Section */}
        <Box sx={{ mb: 3 }}>
          <Card variant="outlined" sx={{ bgcolor: '#f5f5f5', borderColor: '#c10007' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Vehicles
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="#c10007">
                    {groupData.bookings.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    ₱{groupData.total_amount?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Balance
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color={groupData.balance > 0 ? '#ff9800' : '#4caf50'}>
                    ₱{groupData.balance?.toLocaleString() || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Payment Status
                  </Typography>
                  <Chip
                    label={groupData.payment_status || 'Unpaid'}
                    color={groupData.balance === 0 ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5, fontWeight: 'bold' }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Individual Bookings Table */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
          Individual Vehicle Bookings
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Booking ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Plate Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pickup Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Dropoff Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Balance</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupData.bookings.map((booking) => (
                <TableRow
                  key={booking.booking_id}
                  sx={{
                    '&:hover': { bgcolor: '#f9f9f9' },
                  }}
                >
                  <TableCell>
                    <Chip label={`#${booking.booking_id}`} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {booking.car_details?.display_name || 
                       `${booking.car_details?.make || ''} ${booking.car_details?.model || ''}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {booking.car_details?.license_plate || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HiCalendar size={14} color="#666" />
                      <Typography variant="body2">{formatDate(booking.start_date)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HiCalendar size={14} color="#666" />
                      <Typography variant="body2">{formatDate(booking.end_date)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HiClock size={14} color="#666" />
                      <Typography variant="body2">{formatTime(booking.pickup_time)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HiClock size={14} color="#666" />
                      <Typography variant="body2">{formatTime(booking.dropoff_time)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600}>
                      ₱{booking.total_amount?.toLocaleString() || 0}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color={booking.balance > 0 ? '#ff9800' : '#4caf50'}>
                      ₱{booking.balance?.toLocaleString() || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.booking_status || 'N/A'}
                      size="small"
                      color={
                        booking.booking_status === 'Confirmed' ? 'success' :
                        booking.booking_status === 'Pending' ? 'warning' :
                        'default'
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Additional Information */}
        {groupData.bookings.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" gutterBottom>
              Common Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pickup Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <HiLocationMarker size={16} color="#c10007" />
                  <Typography variant="body2">
                    {groupData.bookings[0].pickup_loc || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Dropoff Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <HiLocationMarker size={16} color="#c10007" />
                  <Typography variant="body2">
                    {groupData.bookings[0].dropoff_loc || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f9f9f9' }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#c10007' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
