import React, { useState, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  Avatar,
  IconButton,
  Divider,
  Chip
} from '@mui/material';
import { HiX, HiCheck } from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

const API_BASE = getApiBase();

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  const [serviceType, setServiceType] = useState('delivery'); // 'delivery' or 'pickup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [isSelfService, setIsSelfService] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  
  const [formData, setFormData] = useState({
    purpose: '',
    customPurpose: '',
    startDate: '',
    endDate: '',
    pickupTime: '',
    dropoffTime: '',
    deliveryLocation: '',
    dropoffLocation: '',
    selectedDriver: '',
  });

  // Initialize form with booking data
  useEffect(() => {
    if (booking && open) {
      console.log('📝 Initializing Edit Booking Modal with data:', booking);
      console.log('📅 Raw pickup_time from DB:', booking.pickup_time);
      console.log('📅 Raw dropoff_time from DB:', booking.dropoff_time);
      
      const isDelivery = booking.deliver_loc && booking.deliver_loc.trim() !== '';
      
      // Determine the purpose - check if it matches predefined values
      const predefinedPurposes = ['Travel', 'Vehicle Replacement', 'Local Transportation', 'Specialize Needs', 'One-Way Rental', 'Others'];
      const bookingPurpose = booking.purpose || '';
      const isPredefined = predefinedPurposes.includes(bookingPurpose);
      
      // Extract time from database timestamps
      // Times are stored as UTC but represent Philippine time (UTC+8)
      // When we retrieve them, we need to convert back to Philippine time
      let pickupTimeFormatted = '';
      let dropoffTimeFormatted = '';
      
      if (booking.pickup_time) {
        const pickupDate = new Date(booking.pickup_time);
        console.log('🕐 Raw pickup_time from DB (UTC):', pickupDate.toISOString());
        
        // Convert UTC to Philippine time by adding 8 hours
        const utcHours = pickupDate.getUTCHours();
        const utcMinutes = pickupDate.getUTCMinutes();
        
        // Add 8 hours for Philippine timezone
        let phHours = utcHours + 8;
        let phMinutes = utcMinutes;
        
        // Handle day overflow (if adding 8 hours goes past midnight)
        if (phHours >= 24) {
          phHours -= 24;
        }
        
        pickupTimeFormatted = `${String(phHours).padStart(2, '0')}:${String(phMinutes).padStart(2, '0')}`;
        console.log('✅ Converted to Philippine time:', pickupTimeFormatted);
      }
      
      if (booking.dropoff_time) {
        const dropoffDate = new Date(booking.dropoff_time);
        console.log('🕐 Raw dropoff_time from DB (UTC):', dropoffDate.toISOString());
        
        // Convert UTC to Philippine time by adding 8 hours
        const utcHours = dropoffDate.getUTCHours();
        const utcMinutes = dropoffDate.getUTCMinutes();
        
        // Add 8 hours for Philippine timezone
        let phHours = utcHours + 8;
        let phMinutes = utcMinutes;
        
        // Handle day overflow (if adding 8 hours goes past midnight)
        if (phHours >= 24) {
          phHours -= 24;
        }
        
        dropoffTimeFormatted = `${String(phHours).padStart(2, '0')}:${String(phMinutes).padStart(2, '0')}`;
        console.log('✅ Converted to Philippine time:', dropoffTimeFormatted);
      }
      
      setFormData({
        purpose: isPredefined ? bookingPurpose : 'Others',
        customPurpose: !isPredefined && bookingPurpose ? bookingPurpose : '',
        startDate: booking.start_date ? new Date(booking.start_date).toISOString().split('T')[0] : '',
        endDate: booking.end_date ? new Date(booking.end_date).toISOString().split('T')[0] : '',
        pickupTime: pickupTimeFormatted,
        dropoffTime: dropoffTimeFormatted,
        deliveryLocation: booking.deliver_loc || '',
        dropoffLocation: booking.dropoff_loc || '',
        selectedDriver: booking.drivers_id ? booking.drivers_id.toString() : '',
      });
      
      console.log('📋 Final formData set:', {
        pickupTime: pickupTimeFormatted,
        dropoffTime: dropoffTimeFormatted
      });
      
      setServiceType(isDelivery ? 'delivery' : 'pickup');
      setIsSelfService(booking.isSelfDriver !== false);
      
      fetchDrivers();
    }
  }, [booking, open]);

  const fetchDrivers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/drivers`);
      if (response.ok) {
        const response_data = await response.json();
        // Handle paginated response - extract data array
        const data = Array.isArray(response_data) ? response_data : (response_data.data || []);
        // Filter out driver ID 1 (DEFAULT FOR SELFDRIVE) from customer-facing list
        const filteredDrivers = data.filter(driver => driver.drivers_id !== 1 && driver.driver_id !== 1);
        setDrivers(filteredDrivers || []);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    }
  };

  const getMinimumDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const validateForm = () => {
    const requiredFields = ['purpose', 'startDate', 'endDate', 'pickupTime', 'dropoffTime'];
    
    if (serviceType === 'delivery') {
      requiredFields.push('deliveryLocation', 'dropoffLocation');
    }

    if (!isSelfService && !formData.selectedDriver) {
      setError('Please select a driver or enable self-drive service');
      setMissingFields(['selectedDriver']);
      return false;
    }

    if (formData.purpose === 'Others' && !formData.customPurpose?.trim()) {
      setError('Please specify your custom purpose of rental');
      setMissingFields(['customPurpose']);
      return false;
    }

    const missing = requiredFields.filter(field => !formData[field]);
    setMissingFields(missing);

    if (missing.length > 0) {
      setError(`Please fill in required fields: ${missing.join(', ')}`);
      return false;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const minDate = new Date(getMinimumDate());

    if (startDate < minDate) {
      setError('Start date cannot be in the past');
      setMissingFields(['startDate']);
      return false;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date');
      setMissingFields(['endDate']);
      return false;
    }

    // Validate pickup and dropoff times (must be between 7:00 AM - 7:00 PM)
    if (formData.pickupTime) {
      const [pickupHour, pickupMinute] = formData.pickupTime.split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      const minTime = 7 * 60; // 7:00 AM
      const maxTime = 19 * 60; // 7:00 PM

      if (pickupTimeInMinutes < minTime || pickupTimeInMinutes > maxTime) {
        setError('Pickup time must be between 7:00 AM and 7:00 PM (office hours)');
        setMissingFields(['pickupTime']);
        return false;
      }
    }

    if (formData.dropoffTime) {
      const [dropoffHour, dropoffMinute] = formData.dropoffTime.split(':').map(Number);
      const dropoffTimeInMinutes = dropoffHour * 60 + dropoffMinute;
      const minTime = 7 * 60; // 7:00 AM
      const maxTime = 19 * 60; // 7:00 PM

      if (dropoffTimeInMinutes < minTime || dropoffTimeInMinutes > maxTime) {
        setError('Drop-off time must be between 7:00 AM and 7:00 PM (office hours)');
        setMissingFields(['dropoffTime']);
        return false;
      }
    }

    // Validate dropoff time is after pickup time
    if (formData.pickupTime && formData.dropoffTime) {
      const [pickupHour, pickupMinute] = formData.pickupTime.split(':').map(Number);
      const [dropoffHour, dropoffMinute] = formData.dropoffTime.split(':').map(Number);
      const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
      const dropoffTimeInMinutes = dropoffHour * 60 + dropoffMinute;

      if (dropoffTimeInMinutes <= pickupTimeInMinutes) {
        setError('Drop-off time must be after pickup time');
        setMissingFields(['dropoffTime']);
        return false;
      }
    }

    // Validate same-day booking: 3-hour minimum gap between booking time and pickup time
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const bookingDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    
    if (bookingDate.getTime() === today.getTime() && formData.pickupTime) {
      // Same day booking
      const [pickupHour, pickupMinute] = formData.pickupTime.split(':').map(Number);
      const pickupDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), pickupHour, pickupMinute);
      const threeHoursFromNow = new Date(now.getTime() + (3 * 60 * 60 * 1000));

      if (pickupDateTime < threeHoursFromNow) {
        const minPickupTime = `${String(threeHoursFromNow.getHours()).padStart(2, '0')}:${String(threeHoursFromNow.getMinutes()).padStart(2, '0')}`;
        setError(`Same-day booking requires at least 3 hours notice. Earliest pickup time: ${minPickupTime}`);
        setMissingFields(['pickupTime']);
        return false;
      }
    }

    setError('');
    setMissingFields([]);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      console.log('📤 Submitting booking update...');
      console.log('📤 Current formData:', formData);
      
      // Send times in HH:MM format as expected by backend
      const updateData = {
        purpose: formData.purpose === 'Others' ? formData.customPurpose : formData.purpose,
        start_date: formData.startDate,
        end_date: formData.endDate,
        pickup_time: formData.pickupTime, // Already in HH:MM format
        dropoff_time: formData.dropoffTime, // Already in HH:MM format
        pickup_loc: serviceType === 'pickup' ? 'J&A Car Rental Office' : formData.deliveryLocation,
        dropoff_loc: formData.dropoffLocation,
        deliver_loc: serviceType === 'delivery' ? formData.deliveryLocation : '',
        isSelfDriver: isSelfService,
        drivers_id: isSelfService ? null : parseInt(formData.selectedDriver),
      };
      
      console.log('📤 Update data being sent:', updateData);
      console.log('📤 Times being sent - pickup:', updateData.pickup_time, 'dropoff:', updateData.dropoff_time);

      const response = await authenticatedFetch(`${API_BASE}/bookings/${booking.booking_id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update booking');
      }

      const result = await response.json();
      console.log('✅ Booking updated successfully:', result);
      
      if (onBookingUpdated) {
        onBookingUpdated(result);
      }
      
      handleClose();
    } catch (error) {
      console.error('❌ Update booking error:', error);
      setError(error.message || 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setMissingFields([]);
    
    // Ensure body scroll is restored when modal closes
    document.body.style.overflow = 'unset';
    
    onClose();
  };

  // Clean up body scroll on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{ 
        sx: { 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        } 
      }}
      // Ensure proper scroll behavior
      scroll="paper"
      disableScrollLock={false}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#c10007',
        color: 'white',
        py: 2,
        flexShrink: 0
      }}>
        <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          Edit Booking #{booking?.booking_id}
        </Box>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
        {/* Current Booking Details Card - CENTERED */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Card sx={{ maxWidth: '800px', width: '100%', backgroundColor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#c10007', textAlign: 'center' }}>
                Current Booking Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Vehicle:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {booking?.car_details?.make} {booking?.car_details?.model}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {booking?.car_details?.year} • {booking?.car_details?.license_plate}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Total Amount:</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                    ₱{booking?.total_amount?.toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Booking Status:</Typography>
                  <Chip 
                    label={booking?.booking_status || 'Pending'} 
                    size="small"
                    sx={{ 
                      mt: 0.5,
                      fontWeight: 'bold',
                      backgroundColor: booking?.booking_status === 'Confirmed' ? '#4caf50' : '#ff9800',
                      color: 'white'
                    }}
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Driver Type:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {booking?.isSelfDriver ? 'Self-Drive' : 'With Driver'}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">Service Type:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {booking?.deliver_loc ? 'Delivery Service' : 'Office Pickup'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Update Booking Information - CENTERED TITLE */}
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
          Update Booking Information
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Service Type Selection - CENTERED */}
          <Grid size={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                Service Type *
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Grid container spacing={2} sx={{ maxWidth: '600px' }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      border: serviceType === 'delivery' ? '3px solid #c10007' : '2px solid #e0e0e0',
                      '&:hover': { borderColor: '#c10007' },
                      height: '100%',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setServiceType('delivery')}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        🚚 Delivery Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        We deliver the car to your location
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer', 
                      border: serviceType === 'pickup' ? '3px solid #c10007' : '2px solid #e0e0e0',
                      '&:hover': { borderColor: '#c10007' },
                      height: '100%',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setServiceType('pickup')}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        🏢 Office Pickup
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Pick up at our office location
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Purpose */}
          <Grid size={12}>
            <FormControl fullWidth required error={missingFields.includes('purpose')}>
              <InputLabel sx={{ fontSize: '1rem' }}>Purpose of Rental</InputLabel>
              <Select
                value={formData.purpose}
                label="Purpose of Rental"
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value, customPurpose: '' })}
                sx={{
                  '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#c10007',
                  },
                }}
              >
                <MenuItem value="Travel">Travel</MenuItem>
                <MenuItem value="Vehicle Replacement">Vehicle Replacement</MenuItem>
                <MenuItem value="Local Transportation">Local Transportation</MenuItem>
                <MenuItem value="Specialize Needs">Specialize Needs</MenuItem>
                <MenuItem value="One-Way Rental">One-Way Rental</MenuItem>
                <MenuItem value="Others">Others</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Custom Purpose */}
          {formData.purpose === 'Others' && (
            <Grid size={12}>
              <TextField
                fullWidth
                label="Specify Purpose"
                value={formData.customPurpose}
                onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
                required
                error={missingFields.includes('customPurpose')}
                helperText="Please provide details about your rental purpose"
                sx={{
                  '& .MuiInputLabel-root': { fontSize: '1rem' },
                  '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#c10007',
                    },
                  },
                }}
              />
            </Grid>
          )}

          {/* Dates - START SPLIT / END SPLIT */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: getMinimumDate() }}
              required
              error={missingFields.includes('startDate')}
              sx={{
                '& .MuiInputLabel-root': { fontSize: '1rem' },
                '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#c10007',
                  },
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: formData.startDate || getMinimumDate() }}
              required
              error={missingFields.includes('endDate')}
              sx={{
                '& .MuiInputLabel-root': { fontSize: '1rem' },
                '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#c10007',
                  },
                },
              }}
            />
          </Grid>

          {/* Times - START SPLIT / END SPLIT */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="time"
              label="Pickup Time (7 AM - 7 PM)"
              value={formData.pickupTime}
              onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              error={missingFields.includes('pickupTime')}
              helperText="Office hours: 7:00 AM - 7:00 PM"
              inputProps={{
                min: "07:00",
                max: "19:00",
                step: 300 // 5 minute intervals
              }}
              sx={{
                '& .MuiInputLabel-root': { fontSize: '1rem' },
                '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#c10007',
                  },
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              type="time"
              label="Drop-off Time (7 AM - 7 PM)"
              value={formData.dropoffTime}
              onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
              InputLabelProps={{ shrink: true }}
              required
              error={missingFields.includes('dropoffTime')}
              helperText="Office hours: 7:00 AM - 7:00 PM"
              inputProps={{
                min: "07:00",
                max: "19:00",
                step: 300 // 5 minute intervals
              }}
              sx={{
                '& .MuiInputLabel-root': { fontSize: '1rem' },
                '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': {
                    borderColor: '#c10007',
                  },
                },
              }}
            />
          </Grid>

          {/* Location Fields - START SPLIT / END SPLIT */}
          {serviceType === 'delivery' ? (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Pickup Location (Delivery Address)"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                  required
                  error={missingFields.includes('deliveryLocation')}
                  multiline
                  rows={2}
                  placeholder="Enter the address where you want the car delivered"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '1rem' },
                    '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#c10007',
                      },
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Drop-off Location (Return Address)"
                  value={formData.dropoffLocation}
                  onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                  required
                  error={missingFields.includes('dropoffLocation')}
                  multiline
                  rows={2}
                  placeholder="Enter the address where you want to return the car"
                  sx={{
                    '& .MuiInputLabel-root': { fontSize: '1rem' },
                    '& .MuiInputBase-input': { fontSize: '1rem', py: 1.5 },
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#c10007',
                      },
                    },
                  }}
                />
              </Grid>
            </>
          ) : (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Pickup Location:</strong><br />
                    J&A Car Rental Office
                  </Typography>
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Drop-off Location:</strong><br />
                    J&A Car Rental Office
                  </Typography>
                </Alert>
              </Grid>
            </>
          )}

          {/* Driver Selection - Self Drive Service */}
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isSelfService}
                  onChange={(e) => setIsSelfService(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    Self-Drive Service
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isSelfService ? 'You will drive the vehicle yourself' : 'A driver will be assigned'}
                  </Typography>
                </Box>
              }
            />

            {!isSelfService && (
              <FormControl fullWidth sx={{ mt: 2 }} required error={missingFields.includes('selectedDriver')}>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={formData.selectedDriver}
                  label="Select Driver"
                  onChange={(e) => setFormData({ ...formData, selectedDriver: e.target.value })}
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
                              License: {driver.license_number}
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
          disabled={loading}
          fullWidth
          startIcon={loading ? <CircularProgress size={20} /> : <HiCheck />}
          sx={{ 
            backgroundColor: '#c10007',
            '&:hover': { backgroundColor: '#a50006' }
          }}
        >
          {loading ? 'Updating...' : 'Update Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}