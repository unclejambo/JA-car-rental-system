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
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider
} from '@mui/material';
import { HiX, HiArrowLeft, HiArrowRight, HiCheck } from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

const API_BASE = getApiBase();

export default function EditBookingModal({ open, onClose, booking, onBookingUpdated }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  const [activeStep, setActiveStep] = useState(1); // Start at step 1 (skip service type)
  const [activeTab, setActiveTab] = useState(0); // 0 = delivery, 1 = pickup
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
    specialRequests: '',
  });

  const steps = ['Service Type', 'Booking Details', 'Confirmation'];

  // Initialize form with booking data
  useEffect(() => {
    if (booking && open) {
      const isDelivery = booking.delivery_location && booking.delivery_location.trim() !== '';
      
      setFormData({
        purpose: booking.purpose || '',
        customPurpose: booking.purpose === 'Others' ? (booking.purpose_details || '') : '',
        startDate: booking.start_date ? new Date(booking.start_date).toISOString().split('T')[0] : '',
        endDate: booking.end_date ? new Date(booking.end_date).toISOString().split('T')[0] : '',
        pickupTime: booking.pickup_time || '',
        dropoffTime: booking.dropoff_time || '',
        deliveryLocation: booking.delivery_location || '',
        dropoffLocation: booking.dropoff_location || '',
        selectedDriver: booking.drivers_id ? booking.drivers_id.toString() : '',
        specialRequests: booking.special_requests || '',
      });
      
      setActiveTab(isDelivery ? 0 : 1);
      setIsSelfService(booking.is_self_drive !== false);
      setActiveStep(1); // Start at booking details
      
      fetchDrivers();
    }
  }, [booking, open]);

  const fetchDrivers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/drivers`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data || []);
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
    
    if (activeTab === 0) { // Delivery
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

    setError('');
    setMissingFields([]);
    return true;
  };

  const handleNext = () => {
    if (activeStep === 1 && validateForm()) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const updateData = {
        purpose: formData.purpose === 'Others' ? formData.customPurpose : formData.purpose,
        start_date: formData.startDate,
        end_date: formData.endDate,
        pickup_time: formData.pickupTime,
        dropoff_time: formData.dropoffTime,
        pickup_location: activeTab === 1 ? 'J&A Car Rental Office' : '',
        dropoff_location: formData.dropoffLocation,
        delivery_location: activeTab === 0 ? formData.deliveryLocation : '',
        is_self_drive: isSelfService,
        drivers_id: isSelfService ? null : parseInt(formData.selectedDriver),
        special_requests: formData.specialRequests,
      };

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
      
      if (onBookingUpdated) {
        onBookingUpdated(result);
      }
      
      handleClose();
    } catch (error) {
      console.error('Update booking error:', error);
      setError(error.message || 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveStep(1);
    setError('');
    setMissingFields([]);
    onClose();
  };

  const renderServiceTypeStep = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Service Type
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              border: activeTab === 0 ? '2px solid #c10007' : '1px solid #e0e0e0',
              '&:hover': { borderColor: '#c10007' }
            }}
            onClick={() => setActiveTab(0)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                🚚 Delivery Service
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We deliver the car to your location
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              border: activeTab === 1 ? '2px solid #c10007' : '1px solid #e0e0e0',
              '&:hover': { borderColor: '#c10007' }
            }}
            onClick={() => setActiveTab(1)}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
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
  );

  const renderBookingDetailsStep = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Edit Booking Details
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Purpose */}
        <Grid item xs={12}>
          <FormControl fullWidth required error={missingFields.includes('purpose')}>
            <InputLabel>Purpose of Rental</InputLabel>
            <Select
              value={formData.purpose}
              label="Purpose of Rental"
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value, customPurpose: '' })}
            >
              <MenuItem value="Personal">Personal</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="Family Trip">Family Trip</MenuItem>
              <MenuItem value="Wedding">Wedding</MenuItem>
              <MenuItem value="Others">Others</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Custom Purpose */}
        {formData.purpose === 'Others' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Specify Purpose"
              value={formData.customPurpose}
              onChange={(e) => setFormData({ ...formData, customPurpose: e.target.value })}
              required
              error={missingFields.includes('customPurpose')}
            />
          </Grid>
        )}

        {/* Dates */}
        <Grid item xs={12} md={6}>
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
          />
        </Grid>

        <Grid item xs={12} md={6}>
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
          />
        </Grid>

        {/* Times */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="time"
            label="Pickup Time"
            value={formData.pickupTime}
            onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            error={missingFields.includes('pickupTime')}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="time"
            label="Drop-off Time"
            value={formData.dropoffTime}
            onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            error={missingFields.includes('dropoffTime')}
          />
        </Grid>

        {/* Location Fields */}
        {activeTab === 0 ? (
          // Delivery Service Fields
          <>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Delivery Address"
                value={formData.deliveryLocation}
                onChange={(e) => setFormData({ ...formData, deliveryLocation: e.target.value })}
                required
                error={missingFields.includes('deliveryLocation')}
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Drop-off Address"
                value={formData.dropoffLocation}
                onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                required
                error={missingFields.includes('dropoffLocation')}
                multiline
                rows={2}
              />
            </Grid>
          </>
        ) : (
          // Office Pickup Info
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Pickup & Return:</strong> J&A Car Rental Office
              </Typography>
            </Alert>
          </Grid>
        )}

        {/* Driver Selection */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={isSelfService}
                onChange={(e) => setIsSelfService(e.target.checked)}
                color="primary"
              />
            }
            label="Self-Drive Service"
          />

          {!isSelfService && (
            <FormControl fullWidth sx={{ mt: 2 }} required error={missingFields.includes('selectedDriver')}>
              <InputLabel>Select Driver</InputLabel>
              <Select
                value={formData.selectedDriver}
                label="Select Driver"
                onChange={(e) => setFormData({ ...formData, selectedDriver: e.target.value })}
              >
                {drivers.map((driver) => (
                  <MenuItem key={driver.drivers_id} value={driver.drivers_id.toString()}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {driver.first_name?.[0]}{driver.last_name?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {driver.first_name} {driver.last_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          License: {driver.license_number}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Grid>

        {/* Special Requests */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Special Requests (Optional)"
            value={formData.specialRequests}
            onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
            multiline
            rows={3}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const renderConfirmationStep = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
        Confirm Changes
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#c10007' }}>
              Updated Booking Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Purpose:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {formData.purpose === 'Others' ? formData.customPurpose : formData.purpose}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Service:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {activeTab === 0 ? 'Delivery' : 'Office Pickup'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Start:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {new Date(formData.startDate).toLocaleDateString()} {formData.pickupTime}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">End:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {new Date(formData.endDate).toLocaleDateString()} {formData.dropoffTime}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Driver:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {isSelfService ? 'Self-Drive' : 
                    drivers.find(d => d.drivers_id.toString() === formData.selectedDriver)?.first_name + ' ' +
                    drivers.find(d => d.drivers_id.toString() === formData.selectedDriver)?.last_name || 'Selected Driver'
                  }
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#c10007' }}>
              Vehicle
            </Typography>
            
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {booking?.car_details?.make} {booking?.car_details?.model}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking?.car_details?.year} • {booking?.car_details?.license_plate}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary">Total:</Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#c10007' }}>
              ₱{booking?.total_amount?.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#c10007',
        color: 'white'
      }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Edit Booking #{booking?.booking_id}
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Stepper */}
        <Box sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Content */}
        <Box sx={{ minHeight: '400px' }}>
          {activeStep === 0 && renderServiceTypeStep()}
          {activeStep === 1 && renderBookingDetailsStep()}
          {activeStep === 2 && renderConfirmationStep()}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0 || loading}
          startIcon={<HiArrowLeft />}
        >
          Back
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={loading}
            endIcon={<HiArrowRight />}
            sx={{ 
              backgroundColor: '#c10007',
              '&:hover': { backgroundColor: '#a50006' }
            }}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <HiCheck />}
            sx={{ 
              backgroundColor: '#c10007',
              '&:hover': { backgroundColor: '#a50006' }
            }}
          >
            {loading ? 'Updating...' : 'Update Booking'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}