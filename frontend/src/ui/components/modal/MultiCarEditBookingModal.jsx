import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  IconButton,
} from '@mui/material';
import { HiX, HiCheck, HiChevronDown, HiTrash } from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

const API_BASE = getApiBase();

export default function MultiCarEditBookingModal({ open, onClose, groupBooking, onBookingUpdated }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(0);
  const [drivers, setDrivers] = useState([]);
  const [customerData, setCustomerData] = useState(null);
  const [hasDriverLicense, setHasDriverLicense] = useState(true);
  const [cancelledBookings, setCancelledBookings] = useState(new Set());
  const [cancellingBooking, setCancellingBooking] = useState(null);

  // Individual booking data for each car
  const [bookingsData, setBookingsData] = useState([]);

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/drivers`);
      if (response.ok) {
        const response_data = await response.json();
        const data = Array.isArray(response_data) ? response_data : (response_data.data || []);
        const filteredDrivers = data.filter(driver => driver.drivers_id !== 1 && driver.driver_id !== 1);
        setDrivers(filteredDrivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch customer data
  const fetchCustomerData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/customers/me`);
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);
        const hasLicense = data.driver_license?.driver_license_no && data.driver_license.driver_license_no.trim() !== '';
        setHasDriverLicense(hasLicense);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setHasDriverLicense(false);
    }
  };

  // Initialize form with group booking data
  useEffect(() => {
    if (groupBooking && groupBooking.bookings && groupBooking.bookings.length > 0 && open) {
      fetchDrivers();
      fetchCustomerData();
      
      // Initialize each booking's data
      const initialBookings = groupBooking.bookings.map((booking) => {
        // Extract time from database timestamps
        let pickupTimeFormatted = '';
        let dropoffTimeFormatted = '';
        
        if (booking.pickup_time) {
          const pickupDate = new Date(booking.pickup_time);
          const utcHours = pickupDate.getUTCHours();
          const utcMinutes = pickupDate.getUTCMinutes();
          let phHours = utcHours + 8;
          if (phHours >= 24) phHours -= 24;
          pickupTimeFormatted = `${String(phHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
        }
        
        if (booking.dropoff_time) {
          const dropoffDate = new Date(booking.dropoff_time);
          const utcHours = dropoffDate.getUTCHours();
          const utcMinutes = dropoffDate.getUTCMinutes();
          let phHours = utcHours + 8;
          if (phHours >= 24) phHours -= 24;
          dropoffTimeFormatted = `${String(phHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
        }

        // Determine the purpose
        const predefinedPurposes = ['Travel', 'Vehicle Replacement', 'Local Transportation', 'Specialize Needs', 'One-Way Rental', 'Others'];
        const bookingPurpose = booking.purpose || '';
        const isPredefined = predefinedPurposes.includes(bookingPurpose);
        
        const isDelivery = booking.deliver_loc && booking.deliver_loc.trim() !== '';
        
        return {
          booking_id: booking.booking_id,
          car: booking.car_details,
          startDate: booking.start_date ? new Date(booking.start_date).toISOString().split('T')[0] : '',
          endDate: booking.end_date ? new Date(booking.end_date).toISOString().split('T')[0] : '',
          pickupTime: pickupTimeFormatted,
          dropoffTime: dropoffTimeFormatted,
          purpose: isPredefined ? bookingPurpose : 'Others',
          customPurpose: !isPredefined && bookingPurpose ? bookingPurpose : '',
          isSelfDrive: booking.driver_id === 1 || booking.isSelfDriver !== false,
          selectedDriver: booking.driver_id && booking.driver_id !== 1 ? booking.driver_id.toString() : '',
          deliveryType: isDelivery ? 'delivery' : 'pickup',
          deliveryLocation: booking.deliver_loc || '',
          pickupLocation: booking.pickup_loc || 'JA Car Rental Office',
          dropoffLocation: booking.dropoff_loc || 'JA Car Rental Office',
          total_amount: booking.total_amount || 0,
        };
      });
      
      setBookingsData(initialBookings);
      setCancelledBookings(new Set());
    }
  }, [groupBooking, open]);

  const getMinimumDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const handleBookingChange = (index, field, value) => {
    setBookingsData(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Clear selected driver when switching to self-drive
      if (field === 'isSelfDrive' && value === true) {
        updated[index].selectedDriver = '';
      }
      
      // Handle deliveryType changes
      if (field === 'deliveryType') {
        if (value === 'pickup') {
          updated[index].pickupLocation = 'JA Car Rental Office';
          updated[index].dropoffLocation = 'JA Car Rental Office';
          updated[index].deliveryLocation = '';
        } else {
          updated[index].deliveryLocation = '';
        }
      }
      
      return updated;
    });
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will send a cancellation request to the admin for approval.')) {
      return;
    }
    
    setCancellingBooking(bookingId);
    setError('');
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/bookings/${bookingId}/cancel`,
        { method: 'PUT' }
      );

      if (response.ok) {
        const result = await response.json();
        setCancelledBookings(prev => new Set([...prev, bookingId]));
        
        // Show success alert
        alert('Cancellation request submitted successfully! The admin will review your request.');
        
        // Refresh parent data
        if (onBookingUpdated) {
          setTimeout(() => {
            onBookingUpdated();
          }, 500);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to cancel booking');
        alert(`Error: ${errorData.error || 'Failed to cancel booking'}`);
      }
    } catch (error) {
      console.error('Cancel booking error:', error);
      setError('Failed to cancel booking. Please try again.');
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancellingBooking(null);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    bookingsData.forEach((booking, index) => {
      // Skip cancelled bookings
      if (cancelledBookings.has(booking.booking_id)) return;
      
      if (!booking.purpose) errors.push(`Car ${index + 1}: Purpose is required`);
      if (booking.purpose === 'Others' && !booking.customPurpose?.trim()) {
        errors.push(`Car ${index + 1}: Please specify custom purpose`);
      }
      if (!booking.startDate) errors.push(`Car ${index + 1}: Start date is required`);
      if (!booking.endDate) errors.push(`Car ${index + 1}: End date is required`);
      if (!booking.pickupTime) errors.push(`Car ${index + 1}: Pickup time is required`);
      if (!booking.dropoffTime) errors.push(`Car ${index + 1}: Drop-off time is required`);
      
      if (booking.deliveryType === 'delivery' && !booking.deliveryLocation?.trim()) {
        errors.push(`Car ${index + 1}: Delivery location is required`);
      }
      
      if (!booking.isSelfDrive && !booking.selectedDriver) {
        errors.push(`Car ${index + 1}: Please select a driver or enable self-drive`);
      }

      // Validate dates
      if (booking.startDate && booking.endDate) {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
          errors.push(`Car ${index + 1}: Start date cannot be in the past`);
        }

        if (endDate <= startDate) {
          errors.push(`Car ${index + 1}: End date must be after start date`);
        }
      }

      // Validate times
      if (booking.pickupTime) {
        const [pickupHour, pickupMin] = booking.pickupTime.split(':').map(Number);
        if (pickupHour < 7 || pickupHour > 19 || (pickupHour === 19 && pickupMin > 0)) {
          errors.push(`Car ${index + 1}: Pickup time must be between 7:00 AM and 7:00 PM`);
        }
      }

      if (booking.dropoffTime) {
        const [dropoffHour, dropoffMin] = booking.dropoffTime.split(':').map(Number);
        if (dropoffHour < 7 || dropoffHour > 19 || (dropoffHour === 19 && dropoffMin > 0)) {
          errors.push(`Car ${index + 1}: Drop-off time must be between 7:00 AM and 7:00 PM`);
        }
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    setError('');
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(errors.join('. '));
      return;
    }

    if (!groupBooking || !groupBooking.bookings || groupBooking.bookings.length === 0) {
      setError('No bookings found to update');
      return;
    }

    try {
      setLoading(true);

      // Update each booking that hasn't been cancelled
      const updatePromises = bookingsData
        .filter(booking => !cancelledBookings.has(booking.booking_id))
        .map(async (booking) => {
          const finalPurpose = booking.purpose === 'Others' ? booking.customPurpose : booking.purpose;

          const updateData = {
            purpose: finalPurpose,
            startDate: booking.startDate,
            endDate: booking.endDate,
            pickupTime: booking.pickupTime,
            dropoffTime: booking.dropoffTime,
            deliveryType: booking.deliveryType,
            deliveryLocation: booking.deliveryType === 'delivery' ? booking.deliveryLocation : null,
            pickupLocation: booking.deliveryType === 'pickup' ? booking.pickupLocation : null,
            dropoffLocation: booking.dropoffLocation,
            selectedDriver: booking.isSelfDrive ? null : booking.selectedDriver,
            isSelfDrive: booking.isSelfDrive,
          };

          const response = await authenticatedFetch(
            `${API_BASE}/bookings/${booking.booking_id}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to update booking ${booking.booking_id}`);
          }

          return await response.json();
        });

      await Promise.all(updatePromises);

      // Success - call the callback
      if (onBookingUpdated) {
        onBookingUpdated();
      }

      handleClose();
    } catch (error) {
      setError(error.message || 'Error updating bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setCancelledBookings(new Set());
      onClose();
    }
  };

  if (!groupBooking || !groupBooking.bookings || groupBooking.bookings.length === 0 || bookingsData.length === 0) {
    return null;
  }

  const remainingBookings = bookingsData.filter(b => !cancelledBookings.has(b.booking_id)).length;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#c10007',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        flexShrink: 0
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Edit Group Booking
          </Typography>
          <Chip 
            label={`${remainingBookings} of ${groupBooking.car_count} Cars`} 
            size="small" 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{ color: 'white' }}
        >
          <HiX size={24} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {cancelledBookings.size > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {cancelledBookings.size} booking(s) cancelled. Changes will only save to remaining bookings.
            </Typography>
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Edit each vehicle individually. You can also cancel specific vehicles from this group.
          </Typography>
        </Alert>

        {/* Individual Booking Accordions */}
        {bookingsData.map((booking, index) => {
          const isCancelled = cancelledBookings.has(booking.booking_id);
          const isCancelling = cancellingBooking === booking.booking_id;
          
          return (
            <Accordion
              key={booking.booking_id}
              expanded={expandedBooking === index && !isCancelled}
              onChange={() => !isCancelled && setExpandedBooking(expandedBooking === index ? -1 : index)}
              disabled={isCancelled}
              sx={{ 
                mb: 1,
                opacity: isCancelled ? 0.6 : 1,
                border: isCancelled ? '2px dashed #999' : '1px solid #e0e0e0',
              }}
            >
              <AccordionSummary 
                expandIcon={!isCancelled && <HiChevronDown />}
                sx={{
                  backgroundColor: isCancelled ? '#f5f5f5' : 'white',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontWeight: 'bold', fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {booking.car.display_name}
                    </Typography>
                    {isCancelled && (
                      <Chip label="Cancelled" size="small" color="error" />
                    )}
                  </Box>
                  {!isCancelled && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Cancel booking for ${booking.car.display_name}?`)) {
                          handleCancelBooking(booking.booking_id);
                        }
                      }}
                      disabled={isCancelling}
                      sx={{ color: '#c10007' }}
                    >
                      {isCancelling ? <CircularProgress size={20} /> : <HiTrash />}
                    </IconButton>
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* Car Info */}
                  <Grid item xs={12}>
                    <Box sx={{ p: 1.5, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Plate: {booking.car.license_plate} | Amount: ₱{booking.total_amount?.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Purpose */}
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Purpose of Rental</InputLabel>
                      <Select
                        value={booking.purpose}
                        label="Purpose of Rental"
                        onChange={(e) => handleBookingChange(index, 'purpose', e.target.value)}
                      >
                        <MenuItem value="Travel">Travel</MenuItem>
                        <MenuItem value="Vehicle Replacement">Vehicle Replacement</MenuItem>
                        <MenuItem value="Local Transportation">Local Transportation</MenuItem>
                        <MenuItem value="Specialize Needs">Specialize Needs</MenuItem>
                        <MenuItem value="One-Way Rental">One-Way Rental</MenuItem>
                        <MenuItem value="Others">Others (Specify)</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {booking.purpose === 'Others' && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Custom Purpose"
                        value={booking.customPurpose}
                        onChange={(e) => handleBookingChange(index, 'customPurpose', e.target.value)}
                        required
                        placeholder="Please specify your purpose"
                      />
                    </Grid>
                  )}

                  {/* Dates */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      value={booking.startDate}
                      onChange={(e) => handleBookingChange(index, 'startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      inputProps={{ min: getMinimumDate() }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      value={booking.endDate}
                      onChange={(e) => handleBookingChange(index, 'endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      inputProps={{ min: booking.startDate || getMinimumDate() }}
                    />
                  </Grid>

                  {/* Times */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Pickup Time (7 AM - 7 PM)"
                      value={booking.pickupTime}
                      onChange={(e) => handleBookingChange(index, 'pickupTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      helperText="Office hours: 7:00 AM - 7:00 PM"
                      inputProps={{
                        min: "07:00",
                        max: "19:00",
                        step: 300
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="time"
                      label="Drop-off Time (7 AM - 7 PM)"
                      value={booking.dropoffTime}
                      onChange={(e) => handleBookingChange(index, 'dropoffTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      helperText="Office hours: 7:00 AM - 7:00 PM"
                      inputProps={{
                        min: "07:00",
                        max: "19:00",
                        step: 300
                      }}
                    />
                  </Grid>

                  {/* Delivery Type */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Service Type</InputLabel>
                      <Select
                        value={booking.deliveryType}
                        label="Service Type"
                        onChange={(e) => handleBookingChange(index, 'deliveryType', e.target.value)}
                      >
                        <MenuItem value="pickup">Pickup at Office</MenuItem>
                        <MenuItem value="delivery">Delivery Service</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Location Fields */}
                  {booking.deliveryType === 'delivery' ? (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Pickup Location (Delivery Address)"
                          value={booking.deliveryLocation}
                          onChange={(e) => handleBookingChange(index, 'deliveryLocation', e.target.value)}
                          required
                          multiline
                          rows={2}
                          placeholder="Enter the address where you want the car delivered"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Drop-off Location (Return Address)"
                          value={booking.dropoffLocation}
                          onChange={(e) => handleBookingChange(index, 'dropoffLocation', e.target.value)}
                          required
                          multiline
                          rows={2}
                          placeholder="Enter the address where you want to return the car"
                        />
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} sm={6}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Pickup:</strong><br />
                            JA Car Rental Office
                          </Typography>
                        </Alert>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Alert severity="info">
                          <Typography variant="body2">
                            <strong>Drop-off:</strong><br />
                            JA Car Rental Office
                          </Typography>
                        </Alert>
                      </Grid>
                    </>
                  )}

                  {/* Driver Selection */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={booking.isSelfDrive}
                          onChange={(e) => {
                            if (e.target.checked && !hasDriverLicense) {
                              setError('You must have a driver\'s license on file to use self-drive service.');
                              return;
                            }
                            handleBookingChange(index, 'isSelfDrive', e.target.checked);
                          }}
                          color="primary"
                          disabled={!hasDriverLicense && !booking.isSelfDrive}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            Self-Drive Service
                            {!hasDriverLicense && (
                              <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>
                                🔒 (Driver's license required)
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {booking.isSelfDrive ? 'You will drive the vehicle yourself' : 'A driver will be assigned'}
                          </Typography>
                        </Box>
                      }
                    />

                    {!booking.isSelfDrive && (
                      <FormControl fullWidth sx={{ mt: 2 }} required>
                        <InputLabel>Select Driver</InputLabel>
                        <Select
                          value={booking.selectedDriver}
                          label="Select Driver"
                          onChange={(e) => handleBookingChange(index, 'selectedDriver', e.target.value)}
                        >
                          {drivers.length === 0 ? (
                            <MenuItem disabled>No drivers available</MenuItem>
                          ) : (
                            drivers.map((driver) => (
                              <MenuItem key={driver.drivers_id} value={driver.drivers_id.toString()}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#c10007' }}>
                                    {driver.first_name?.[0]}{driver.last_name?.[0]}
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1">
                                      {driver.first_name} {driver.last_name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      License: {driver.driver_license?.driver_license_no || driver.license_number || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        backgroundColor: '#f5f5f5', 
        gap: 2, 
        flexShrink: 0,
        flexDirection: { xs: 'column', sm: 'row' }
      }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          variant="outlined"
          fullWidth
          sx={{ 
            borderColor: '#c10007',
            color: '#c10007',
            '&:hover': {
              borderColor: '#a50006',
              backgroundColor: 'rgba(193, 0, 7, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || remainingBookings === 0}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HiCheck />}
          sx={{ 
            backgroundColor: '#c10007',
            '&:hover': { backgroundColor: '#a50006' }
          }}
        >
          {loading ? 'Updating...' : `Update ${remainingBookings} Booking${remainingBookings !== 1 ? 's' : ''}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
