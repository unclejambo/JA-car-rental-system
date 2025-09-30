import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Tabs,
  Tab,
  FormControlLabel,
  Switch,
  Grid,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api.js';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`booking-tabpanel-${index}`}
      aria-labelledby={`booking-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function BookingModal({ open, onClose, car, onSubmit }) {
  const [currentTab, setCurrentTab] = useState(0); // 0 = Deliver, 1 = Pickup
  const [currentStep, setCurrentStep] = useState(0); // 0 = Form, 1 = Confirmation
  const { logout } = useAuth();
  const API_BASE = getApiBase();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  
  // Form state
  const [formData, setFormData] = useState({
    bookingType: 'deliver', // 'deliver' or 'pickup'
    startDate: null,
    endDate: null,
    pickupLocation: '', // Only for pickup
    deliveryLocation: '', // Only for deliver
    dropoffLocation: '',
    purpose: '',
    isSelfDrive: true,
    selectedDriver: '',
  });

  // Drivers data (loaded from API)
  const [drivers, setDrivers] = useState([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);

  // Load drivers when component mounts
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setLoadingDrivers(true);
        const response = await authenticatedFetch(`${API_BASE}/drivers`);
        if (response.ok) {
          const driversData = await response.json();
          setDrivers(driversData);
        } else {
          console.error('Failed to load drivers');
          // Fallback to sample data
          setDrivers([
            { id: 1, name: 'John Doe', license: 'ABC123', rating: 4.8 },
            { id: 2, name: 'Jane Smith', license: 'XYZ789', rating: 4.9 },
            { id: 3, name: 'Mike Johnson', license: 'DEF456', rating: 4.7 },
          ]);
        }
      } catch (error) {
        console.error('Error loading drivers:', error);
        // Fallback to sample data
        setDrivers([
          { id: 1, name: 'John Doe', license: 'ABC123', rating: 4.8 },
          { id: 2, name: 'Jane Smith', license: 'XYZ789', rating: 4.9 },
          { id: 3, name: 'Mike Johnson', license: 'DEF456', rating: 4.7 },
        ]);
      } finally {
        setLoadingDrivers(false);
      }
    };

    if (open && !formData.isSelfDrive) {
      loadDrivers();
    }
  }, [open, formData.isSelfDrive, API_BASE, authenticatedFetch]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setCurrentTab(0);
      setFormData({
        bookingType: 'deliver',
        startDate: null,
        endDate: null,
        pickupLocation: '',
        deliveryLocation: '',
        dropoffLocation: '',
        purpose: '',
        isSelfDrive: true,
        selectedDriver: '',
      });
    }
  }, [open]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    setFormData(prev => ({
      ...prev,
      bookingType: newValue === 0 ? 'deliver' : 'pickup',
      deliveryLocation: newValue === 1 ? '' : prev.deliveryLocation,
      pickupLocation: newValue === 0 ? '' : prev.pickupLocation,
    }));
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const isFormValid = () => {
    const required = ['startDate', 'endDate', 'dropoffLocation', 'purpose'];
    
    if (formData.bookingType === 'deliver') {
      required.push('deliveryLocation');
    }
    // Note: pickup location not required for pickup service as customer comes to office

    if (!formData.isSelfDrive) {
      required.push('selectedDriver');
    }

    return required.every(field => {
      const value = formData[field];
      return value !== null && value !== undefined && value !== '';
    });
  };

  // Handle proceed to confirmation
  const handleProceedToConfirmation = () => {
    if (isFormValid()) {
      setCurrentStep(1);
    }
  };

  // Handle back to form
  const handleBackToForm = () => {
    setCurrentStep(0);
  };

  // Handle final submission
  const handleConfirmBooking = () => {
    const bookingData = {
      car_id: car.car_id,
      ...formData,
      car_details: {
        make: car.make,
        model: car.model,
        year: car.year,
        license_plate: car.license_plate,
        rent_price: car.rent_price,
      }
    };
    onSubmit(bookingData);
  };

  // Calculate total days and cost
  const calculateBookingDetails = () => {
    if (!formData.startDate || !formData.endDate) return { days: 0, totalCost: 0 };
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    const totalCost = days * (car.rent_price || 0);
    
    return { days, totalCost };
  };

  const { days, totalCost } = calculateBookingDetails();

  // Render form content
  const renderFormContent = () => (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          centered
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 600,
              fontSize: '0.95rem',
              textTransform: 'none',
              minHeight: '48px'
            },
            '& .Mui-selected': {
              color: '#c10007 !important'
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#c10007'
            }
          }}
        >
          <Tab label="🚗 Delivery Service" />
          <Tab label="🏢 Office Pickup" />
        </Tabs>
      </Box>

      {/* Deliver Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Date Fields */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Rental Period *
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: 'outlined',
                        size: 'small'
                      },
                    }}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: 'outlined',
                        size: 'small'
                      },
                    }}
                    minDate={formData.startDate || new Date()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>

          {/* Location Fields */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Location Details *
            </Typography>
            <TextField
              fullWidth
              label="Delivery Address"
              value={formData.deliveryLocation}
              onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
              required
              variant="outlined"
              size="small"
              placeholder="Enter complete delivery address"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Return Location"
              value={formData.dropoffLocation}
              onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
              required
              variant="outlined"
              size="small"
              placeholder="Where should the vehicle be returned?"
            />
          </Box>

          {/* Purpose Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Booking Purpose *
            </Typography>
            <TextField
              fullWidth
              label="Purpose of Rental"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              required
              variant="outlined"
              size="small"
              multiline
              rows={2}
              placeholder="Please describe the purpose of your rental (business, personal, etc.)"
            />
          </Box>

          {/* Self-Drive Toggle */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 1,
            border: '1px solid #dee2e6'
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isSelfDrive}
                  onChange={(e) => handleInputChange('isSelfDrive', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#c10007'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#c10007'
                    }
                  }}
                />
              }
              label={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Self-Drive Rental
                </Typography>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Toggle on if you will drive the vehicle yourself
            </Typography>
          </Box>
          {/* Driver Selection */}
          {!formData.isSelfDrive && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                Professional Driver Selection *
              </Typography>
              <TextField
                fullWidth
                select
                label="Choose Your Driver"
                value={formData.selectedDriver}
                onChange={(e) => handleInputChange('selectedDriver', e.target.value)}
                required
                variant="outlined"
                size="small"
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }
                }}
                helperText="Our professional drivers are licensed and experienced"
              >
                <MenuItem value="">
                  <em>Please select a driver</em>
                </MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    <Box sx={{ width: '100%', py: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                        {driver.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        License: {driver.license} • ⭐ {driver.rating.toFixed(2)} Rating
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* Pickup Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Date Fields */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Rental Period *
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={formData.startDate}
                    onChange={(date) => handleInputChange('startDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: 'outlined',
                        size: 'small'
                      },
                    }}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={formData.endDate}
                    onChange={(date) => handleInputChange('endDate', date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        variant: 'outlined',
                        size: 'small'
                      },
                    }}
                    minDate={formData.startDate || new Date()}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </Box>

          {/* Pickup Information */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#e3f2fd', 
            borderRadius: 1,
            border: '1px solid #bbdefb',
            textAlign: 'center'
          }}>
            <Typography variant="body1" sx={{ fontWeight: 500, color: '#1976d2' }}>
              🏢 Office Pickup Service
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Vehicle will be ready for collection at our office location
            </Typography>
          </Box>

          {/* Return Location */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Return Information *
            </Typography>
            <TextField
              fullWidth
              label="Return Location"
              value={formData.dropoffLocation}
              onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
              required
              variant="outlined"
              size="small"
              placeholder="Where should the vehicle be returned?"
            />
          </Box>

          {/* Purpose Field */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
              Booking Purpose *
            </Typography>
            <TextField
              fullWidth
              label="Purpose of Rental"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              required
              variant="outlined"
              size="small"
              multiline
              rows={2}
              placeholder="Please describe the purpose of your rental (business, personal, etc.)"
            />
          </Box>

          {/* Self-Drive Toggle */}
          <Box sx={{ 
            p: 2, 
            backgroundColor: '#f8f9fa', 
            borderRadius: 1,
            border: '1px solid #dee2e6'
          }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isSelfDrive}
                  onChange={(e) => handleInputChange('isSelfDrive', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#c10007'
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#c10007'
                    }
                  }}
                />
              }
              label={
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Self-Drive Rental
                </Typography>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Toggle on if you will drive the vehicle yourself
            </Typography>
          </Box>

          {/* Driver Selection */}
          {!formData.isSelfDrive && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#495057' }}>
                Professional Driver Selection *
              </Typography>
              <TextField
                fullWidth
                select
                label="Choose Your Driver"
                value={formData.selectedDriver}
                onChange={(e) => handleInputChange('selectedDriver', e.target.value)}
                required
                variant="outlined"
                size="small"
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 300 }
                    }
                  }
                }}
                helperText="Our professional drivers are licensed and experienced"
              >
                <MenuItem value="">
                  <em>Please select a driver</em>
                </MenuItem>
                {drivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    <Box sx={{ width: '100%', py: 0.5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                        {driver.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        License: {driver.license} • ⭐ {driver.rating.toFixed(2)} Rating
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </Box>
      </TabPanel>
    </Box>
  );

  // Render confirmation content
  const renderConfirmationContent = () => (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
        Booking Confirmation
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Car Details</Typography>
          <Typography variant="body2"><strong>Vehicle:</strong> {car.make} {car.model}</Typography>
          <Typography variant="body2"><strong>Year:</strong> {car.year}</Typography>
          <Typography variant="body2"><strong>License Plate:</strong> {car.license_plate}</Typography>
          <Typography variant="body2"><strong>Daily Rate:</strong> ₱{car.rent_price?.toLocaleString()}</Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Booking Details</Typography>
          <Typography variant="body2"><strong>Service Type:</strong> {formData.bookingType === 'deliver' ? 'Delivery Service' : 'Pickup Service'}</Typography>
          <Typography variant="body2"><strong>Start Date:</strong> {formData.startDate?.toLocaleDateString()}</Typography>
          <Typography variant="body2"><strong>End Date:</strong> {formData.endDate?.toLocaleDateString()}</Typography>
          <Typography variant="body2"><strong>Duration:</strong> {days} day{days > 1 ? 's' : ''}</Typography>
          
          {formData.bookingType === 'deliver' ? (
            <Typography variant="body2"><strong>Delivery Location:</strong> {formData.deliveryLocation}</Typography>
          ) : (
            <Typography variant="body2"><strong>Pickup Location:</strong> {formData.pickupLocation}</Typography>
          )}
          
          <Typography variant="body2"><strong>Drop-off Location:</strong> {formData.dropoffLocation}</Typography>
          <Typography variant="body2"><strong>Purpose:</strong> {formData.purpose}</Typography>
          <Typography variant="body2"><strong>Drive Type:</strong> {formData.isSelfDrive ? 'Self-Drive' : 'With Driver'}</Typography>
          
          {!formData.isSelfDrive && (
            <Typography variant="body2">
              <strong>Driver:</strong> {drivers.find(d => d.id.toString() === formData.selectedDriver.toString())?.name || 'Not selected'}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Cost Summary</Typography>
          <Typography variant="body2">Daily Rate: ₱{car.rent_price?.toLocaleString()}</Typography>
          <Typography variant="body2">Duration: {days} day{days > 1 ? 's' : ''}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="h6" color="primary.main">
            <strong>Total Cost: ₱{totalCost.toLocaleString()}</strong>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{
        sx: { 
          minHeight: '500px',
          maxHeight: '85vh',
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #dee2e6',
        color: '#333',
        fontWeight: 'bold',
        fontSize: '1.3rem'
      }}>
        {currentStep === 0 ? 'Vehicle Booking Request' : 'Booking Confirmation'}
      </DialogTitle>
      
      <DialogContent dividers sx={{ p: 3, backgroundColor: '#fff' }}>
        {currentStep === 0 ? renderFormContent() : renderConfirmationContent()}
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 2.5, 
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6',
        gap: 1
      }}>
        {currentStep === 0 ? (
          <>
            <Button 
              onClick={onClose} 
              color="inherit"
              sx={{ 
                color: '#6c757d',
                fontWeight: 500,
                '&:hover': { backgroundColor: '#e9ecef' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleProceedToConfirmation} 
              variant="contained"
              disabled={!isFormValid()}
              sx={{ 
                backgroundColor: '#c10007',
                fontWeight: 'bold',
                px: 3,
                '&:hover': { backgroundColor: '#a00006' },
                '&:disabled': { backgroundColor: '#e0e0e0' }
              }}
            >
              Review Booking
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={handleBackToForm} 
              color="inherit"
              sx={{ 
                color: '#6c757d',
                fontWeight: 500,
                '&:hover': { backgroundColor: '#e9ecef' }
              }}
            >
              Edit Details
            </Button>
            <Button 
              onClick={onClose} 
              color="inherit"
              sx={{ 
                color: '#6c757d',
                fontWeight: 500,
                '&:hover': { backgroundColor: '#e9ecef' }
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmBooking} 
              variant="contained"
              sx={{ 
                backgroundColor: '#28a745',
                fontWeight: 'bold',
                px: 3,
                '&:hover': { backgroundColor: '#218838' }
              }}
            >
              Submit Request
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}