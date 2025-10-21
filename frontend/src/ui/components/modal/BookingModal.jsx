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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Divider,
  IconButton,
  Alert,
  CircularProgress,
  Switch,
  Rating,
  Chip,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
} from '@mui/material';
import { HiX, HiArrowLeft, HiArrowRight, HiCheck, HiExclamationCircle, HiClock, HiCurrencyDollar } from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';

const API_BASE = getApiBase();

export default function BookingModal({ open, onClose, car, onBookingSuccess }) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(() => createAuthenticatedFetch(logout), [logout]);
  const [activeTab, setActiveTab] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [isSelfService, setIsSelfService] = useState(true);
  const [missingFields, setMissingFields] = useState([]);
  const [availableDates, setAvailableDates] = useState(null);
  const [unavailablePeriods, setUnavailablePeriods] = useState([]);
  const [hasDateConflict, setHasDateConflict] = useState(false);
  
  // Fee management state
  const [fees, setFees] = useState({
    reservation_fee: 1000,
    cleaning_fee: 200,
    driver_fee: 500,
    overdue_fee: 250,
    damage_fee: 5000,
    equipment_loss_fee: 500,
    gas_level_fee: 500,
    stain_removal_fee: 500,
    security_deposit_fee: 3000
  });
  
  // Payment deadline state
  const [paymentDeadline, setPaymentDeadline] = useState(null);
  const [paymentDeadlineHours, setPaymentDeadlineHours] = useState(null);
  const [formData, setFormData] = useState({
    purpose: '',
    customPurpose: '',
    startDate: '',
    endDate: '',
    pickupTime: '',
    dropoffTime: '',
    deliveryLocation: '',
    pickupLocation: '',
    dropoffLocation: '',
    selectedDriver: '',
  });

  // Create refs for form fields
  const fieldRefs = {
    startDate: useRef(null),
    endDate: useRef(null),
    pickupTime: useRef(null),
    dropoffTime: useRef(null),
    deliveryLocation: useRef(null),
    dropoffLocation: useRef(null),
    purpose: useRef(null),
    selectedDriver: useRef(null),
  };

  const steps = ['Service Type', 'Booking Details', 'Confirmation'];

  // Get today's date for minimum date validation
  const getMinimumDate = () => {
    const today = new Date().toISOString().split('T')[0];
    return today;
  };

  // Fetch drivers when component mounts
  useEffect(() => {
    if (open && car) {
      fetchDrivers();
      fetchUnavailablePeriods(); // Fetch blocked periods
      fetchFees(); // Fetch current fee structure
      
      // Reset form when modal opens
      setFormData({
        purpose: '',
        customPurpose: '',
        startDate: '',
        endDate: '',
        pickupTime: '',
        dropoffTime: '',
        deliveryLocation: '',
        pickupLocation: '',
        dropoffLocation: '',
        selectedDriver: '',
      });
      setError('');
      setIsSelfService(true);
      setActiveTab(0);
      setActiveStep(0);
      setHasDateConflict(false);
    }
  }, [open, car]);

  const fetchAvailableDates = async () => {
    if (!car?.car_id) return;
    
    try {
      console.log('Fetching available dates for car:', car.car_id);
      const response = await fetch(`${API_BASE}/api/cars/${car.car_id}/available-dates`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Available dates data:', data);
        setAvailableDates(data);
        
        // Set minimum date based on availability
        if (data.next_available_date) {
          const nextDate = new Date(data.next_available_date).toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, startDate: nextDate }));
        }
      } else {
        console.error('Failed to fetch available dates:', response.status);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  const fetchUnavailablePeriods = async () => {
    if (!car?.car_id) return;
    
    try {
      console.log('🔍 Fetching unavailable periods for car:', car.car_id);
      const response = await fetch(`${API_BASE}/cars/${car.car_id}/unavailable-periods`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📅 Unavailable periods data:', data);
        setUnavailablePeriods(data.unavailable_periods || []);
      } else {
        console.error('❌ Failed to fetch unavailable periods:', response.status);
        setUnavailablePeriods([]);
      }
    } catch (error) {
      console.error('❌ Error fetching unavailable periods:', error);
      setUnavailablePeriods([]);
    }
  };

  const fetchDrivers = async () => {
    try {
      console.log('Fetching drivers...');
      const response = await authenticatedFetch(`${API_BASE}/drivers`);
      console.log('Drivers response status:', response.status);
      
      if (response.ok) {
        const response_data = await response.json();
        console.log('Drivers data received:', response_data);
        // Handle paginated response - extract data array
        const data = Array.isArray(response_data) ? response_data : (response_data.data || []);
        // Filter out driver ID 1 (DEFAULT FOR SELFDRIVE) from customer-facing list
        const filteredDrivers = data.filter(driver => driver.drivers_id !== 1 && driver.driver_id !== 1);
        console.log('Filtered drivers (excluding DEFAULT FOR SELFDRIVE):', filteredDrivers.length);
        setDrivers(filteredDrivers);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch drivers:', response.status, errorText);
        setError('Failed to load available drivers. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setError('Failed to load available drivers. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear field from missing fields when user starts typing
    if (missingFields.includes(field) && value) {
      setMissingFields(prev => prev.filter(f => f !== field));
      if (missingFields.length === 1) {
        setError(''); // Clear error when last missing field is filled
      }
    }
    
    // Clear custom purpose error when user types in custom purpose field
    if (field === 'customPurpose' && value?.trim()) {
      setMissingFields(prev => prev.filter(f => f !== 'customPurpose'));
      setError('');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Step 0: Service type selection - always valid
      setActiveStep(1);
    } else if (activeStep === 1) {
      // Step 1: Booking details - validate form
      if (validateForm()) {
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const validateForm = () => {
    const requiredFields = ['purpose', 'startDate', 'endDate', 'pickupTime', 'dropoffTime'];
    
    if (activeTab === 0) { // Delivery
      requiredFields.push('deliveryLocation', 'dropoffLocation');
    }
    // For pickup service, no additional location fields needed - office is default

    if (!isSelfService && !formData.selectedDriver) {
      setError('Please select a driver or enable self-drive service');
      setMissingFields(['selectedDriver']);
      // Scroll to driver selection
      if (fieldRefs.selectedDriver.current) {
        fieldRefs.selectedDriver.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      return false;
    }

    // Check if custom purpose is required and filled
    if (formData.purpose === 'Others' && !formData.customPurpose?.trim()) {
      setError('Please specify your custom purpose of rental');
      setMissingFields(['customPurpose']);
      return false;
    }

    const missing = requiredFields.filter(field => !formData[field]);
    setMissingFields(missing);

    if (missing.length > 0) {
      setError(`Please fill in the following required fields: ${missing.map(field => {
        switch(field) {
          case 'startDate': return 'Start Date';
          case 'endDate': return 'End Date';
          case 'pickupTime': return 'Pickup Time';
          case 'dropoffTime': return 'Drop-off Time';
          case 'deliveryLocation': return 'Delivery Address';
          case 'dropoffLocation': return 'Drop-off Address';
          case 'purpose': return 'Purpose';
          default: return field;
        }
      }).join(', ')}`);
      
      // Auto-scroll to first missing field
      const firstMissingField = missing[0];
      if (fieldRefs[firstMissingField]?.current) {
        setTimeout(() => {
          fieldRefs[firstMissingField].current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Focus the field if it's an input
          if (fieldRefs[firstMissingField].current.querySelector('input')) {
            fieldRefs[firstMissingField].current.querySelector('input').focus();
          }
        }, 100);
      }
      return false;
    }

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    const minDate = new Date(getMinimumDate());

    if (startDate < minDate) {
      setError('Start date cannot be in the past');
      setMissingFields(['startDate']);
      if (fieldRefs.startDate.current) {
        fieldRefs.startDate.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    if (endDate < startDate) {
      setError('End date cannot be before start date');
      setMissingFields(['endDate']);
      if (fieldRefs.endDate.current) {
        fieldRefs.endDate.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
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
        if (fieldRefs.pickupTime.current) {
          fieldRefs.pickupTime.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
        if (fieldRefs.dropoffTime.current) {
          fieldRefs.dropoffTime.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }

    // Validate dropoff time is after pickup time (only for same-day bookings)
    if (formData.pickupTime && formData.dropoffTime) {
      // Check if start date and end date are the same
      const startDateOnly = new Date(formData.startDate);
      startDateOnly.setHours(0, 0, 0, 0);
      const endDateOnly = new Date(formData.endDate);
      endDateOnly.setHours(0, 0, 0, 0);

      // Only validate time order if it's a same-day booking
      if (startDateOnly.getTime() === endDateOnly.getTime()) {
        const [pickupHour, pickupMinute] = formData.pickupTime.split(':').map(Number);
        const [dropoffHour, dropoffMinute] = formData.dropoffTime.split(':').map(Number);
        const pickupTimeInMinutes = pickupHour * 60 + pickupMinute;
        const dropoffTimeInMinutes = dropoffHour * 60 + dropoffMinute;

        if (dropoffTimeInMinutes <= pickupTimeInMinutes) {
          setError('Drop-off time must be after pickup time for same-day bookings');
          setMissingFields(['dropoffTime']);
          if (fieldRefs.dropoffTime.current) {
            fieldRefs.dropoffTime.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
          return false;
        }
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
        if (fieldRefs.pickupTime.current) {
          fieldRefs.pickupTime.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return false;
      }
    }

    setError('');
    setMissingFields([]);
    return true;
  };

  const calculateTotalCost = () => {
    if (!formData.startDate || !formData.endDate || !car?.rent_price) {
      return 0;
    }
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Base cost: daily rate * number of days
    let totalCost = daysDiff * car.rent_price;
    
    // Add reservation fee (always included)
    totalCost += fees.reservation_fee;
    
    // Add cleaning fee (always included)
    totalCost += fees.cleaning_fee;
    
    // Add driver fee if not self-service
    if (!isSelfService) {
      totalCost += fees.driver_fee * daysDiff; // Driver fee per day
    }
    
    return totalCost;
  };

  // Fetch fees from backend
  const fetchFees = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/manage-fees`);
      if (response.ok) {
        const feesData = await response.json();
        setFees(feesData);
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
      // Keep default fees if fetch fails
    }
  };

  // Calculate payment deadline based on booking start date
  const calculatePaymentDeadline = (startDate) => {
    if (!startDate) return { deadline: null, hours: null };
    
    const now = new Date();
    // All bookings must be paid within 3 days (72 hours) from booking time
    const deadline = new Date(now.getTime() + (72 * 60 * 60 * 1000));
    const hours = 72;
    
    return { deadline, hours };
  };

  // Update payment deadline when start date changes
  useEffect(() => {
    if (formData.startDate) {
      const { deadline, hours } = calculatePaymentDeadline(formData.startDate);
      setPaymentDeadline(deadline);
      setPaymentDeadlineHours(hours);
    }
  }, [formData.startDate]);

  // Format payment deadline for display
  const formatPaymentDeadline = () => {
    if (!paymentDeadline || !paymentDeadlineHours) return '';
    
    const message = `💡 Payment required within 3 days (72 hours) to confirm this booking. Unpaid bookings will be automatically cancelled after the deadline.`;
    
    return {
      message,
      urgencyLevel: 'warning',
      deadline: paymentDeadline.toLocaleString()
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const finalPurpose = formData.purpose === 'Others' ? formData.customPurpose : formData.purpose;
      
      const bookingData = {
        car_id: car.car_id,
        purpose: finalPurpose,
        startDate: formData.startDate,
        endDate: formData.endDate,
        pickupTime: formData.pickupTime,
        dropoffTime: formData.dropoffTime,
        deliveryType: activeTab === 0 ? 'delivery' : 'pickup',
        deliveryLocation: activeTab === 0 ? formData.deliveryLocation : null,
        pickupLocation: activeTab === 0 ? null : 'JA Car Rental Office - 123 Main Street, Business District, City',
        dropoffLocation: activeTab === 0 ? formData.dropoffLocation : 'JA Car Rental Office - 123 Main Street, Business District, City',
        selectedDriver: isSelfService ? null : formData.selectedDriver,
        totalCost: calculateTotalCost(),
        isSelfDrive: isSelfService,
        // Enhanced payment and fee information
        total_amount: calculateTotalCost(),
        balance: calculateTotalCost(), // Initially, full amount is due
        payment_deadline: paymentDeadline,
        payment_deadline_hours: paymentDeadlineHours,
        fee_breakdown: {
          base_cost: ((Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1) * car.rent_price),
          reservation_fee: fees.reservation_fee,
          cleaning_fee: fees.cleaning_fee,
          driver_fee: isSelfService ? 0 : fees.driver_fee * (Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1),
          total_days: Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1
        },
        booking_status: 'Pending' // Customer can still edit/cancel
      };

      // Regular booking - always create booking (no more waitlist)
      if (onBookingSuccess) {
        await onBookingSuccess(bookingData);
      }
      
      // Show success message with payment information
      const deadlineInfo = formatPaymentDeadline();
      const successMessage = `🎉 Booking created successfully!\n\n` +
        `🚗 Vehicle: ${car.make} ${car.model}\n` +
        `📅 Rental Period: ${formData.startDate} to ${formData.endDate}\n` +
        `💰 Total Amount: ₱${calculateTotalCost().toLocaleString()}\n\n` +
        `⚠️ IMPORTANT PAYMENT INFORMATION:\n` +
        `${deadlineInfo.message}\n` +
        `⏰ Payment Deadline: ${deadlineInfo.deadline}\n\n` +
        `💡 Your booking is confirmed but requires payment to secure the vehicle.\n` +
        `📱 You can make payment through the booking details in your dashboard.`;
      
      alert(successMessage);
      onClose();
    } catch (error) {
      setError('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedDriver = () => {
    return drivers.find(driver => driver.driver_id === formData.selectedDriver);
  };

  if (!car) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          maxHeight: '90vh',
          minHeight: '60vh',
          margin: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' },
          maxWidth: { xs: '100%', sm: 'md' },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          px: { xs: 2, sm: 3 },
          pt: { xs: 2, sm: 3 },
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 'bold', 
            color: '#c10007',
            fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
            wordBreak: 'break-word',
            pr: 1,
          }}
        >
          Book {car.make} {car.model}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflowY: 'auto', overflowX: 'hidden' }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              m: { xs: 2, sm: 3 }, 
              mb: 2,
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              wordBreak: 'break-word',
            }}
          >
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Box sx={{ px: { xs: 2, sm: 3 }, py: 2 }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel 
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Step 0: Service Type Selection */}
        {activeStep === 0 && (
          <Box sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
            {/* Car Details with Image */}
            <Box sx={{ mb: { xs: 2, sm: 3 }, p: { xs: 2, sm: 3 }, backgroundColor: '#f8f9fa', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Car Image */}
                <Box sx={{ flex: { xs: 'none', md: '0 0 200px' } }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: { xs: '200px', md: '150px' },
                      backgroundColor: '#e0e0e0',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundImage: car.car_img_url ? `url(${car.car_img_url})` : 'none',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {!car.car_img_url && (
                      <Typography variant="body2" color="text.secondary">
                        No Image
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Car Details */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {car.make} {car.model} ({car.year})
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                    {car.no_of_seat} seats • Plate: {car.license_plate}
                  </Typography>
                  <Typography variant="h6" sx={{ color: '#c10007', fontWeight: 'bold', mb: 2 }}>
                    ₱{car.rent_price?.toLocaleString()}/day
                  </Typography>
                  
                  {/* Car Status Chip */}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={car.car_status || 'Available'} 
                      color={
                        String(car.car_status || '').toLowerCase().includes('rent') ? 'error' :
                        String(car.car_status || '').toLowerCase().includes('maint') ? 'warning' :
                        'success'
                      }
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Availability Information - REMOVED WAITLIST */}
            {availableDates && (
              <Box sx={{ mb: 3, p: 3, backgroundColor: '#f0f8ff', borderRadius: 2, border: '2px solid #2196f3' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#2196f3' }}>
                  ✅ Car Booking
                </Typography>
                
                <Box>
                  <Typography variant="body1" color="success.main">
                    You can book this car for dates that don't conflict with existing bookings.
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Unavailable Periods Warning - NEW FEATURE */}
            {unavailablePeriods && unavailablePeriods.length > 0 && (
              <Box sx={{ mb: 3, p: 3, backgroundColor: '#fff9e6', borderRadius: 2, border: '2px solid #ff9800' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#f57c00', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HiExclamationCircle size={24} />
                  ⚠️ Unavailable Periods for This Car
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This car has existing bookings or scheduled maintenance. You can still book this car, but <strong>not during these periods</strong>:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {unavailablePeriods.map((period, index) => {
                    const startDate = new Date(period.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const endDate = new Date(period.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    
                    // Determine card styling based on period type
                    let cardBgColor = '#e3f2fd'; // Default blue for future bookings
                    let cardBorderColor = '#42a5f5';
                    let chipLabel = 'Booked';
                    let chipColor = 'primary';
                    let titleColor = '#1565c0';
                    let icon = '📅';
                    
                    if (period.is_maintenance) {
                      // Maintenance periods
                      cardBgColor = '#ffebee';
                      cardBorderColor = '#ef5350';
                      chipLabel = 'Maintenance';
                      chipColor = 'error';
                      titleColor = '#c62828';
                      icon = '🔧';
                    } else if (period.is_currently_rented) {
                      // Currently rented (active rental)
                      cardBgColor = '#fff3e0';
                      cardBorderColor = '#ff9800';
                      chipLabel = 'Currently Rented';
                      chipColor = 'warning';
                      titleColor = '#e65100';
                      icon = '🚗';
                    }
                    
                    return (
                      <Card key={index} sx={{ backgroundColor: cardBgColor, border: `1px solid ${cardBorderColor}` }}>
                        <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: titleColor }}>
                                {icon} {startDate} - {endDate}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {period.reason}
                              </Typography>
                              {period.is_currently_rented && (
                                <Typography variant="caption" sx={{ display: 'block', color: '#e65100', fontWeight: 'medium', mt: 0.5 }}>
                                  🔴 This car is currently out on rental
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label={chipLabel} 
                              size="small"
                              color={chipColor}
                              sx={{ fontWeight: 'bold' }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>💡 Tip:</strong> Choose dates that don't overlap with the periods above. The system will notify you if there's a conflict.
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Service Type Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                Choose Your Service Type
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: activeTab === 0 ? '2px solid #c10007' : '1px solid #e0e0e0',
                    backgroundColor: activeTab === 0 ? '#fff5f5' : 'white',
                    '&:hover': {
                      borderColor: '#c10007',
                      backgroundColor: '#fff5f5',
                    },
                  }}
                  onClick={() => setActiveTab(0)}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>🚚</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                          }}
                        >
                          Delivery Service
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          We'll deliver the car to your location and pick it up when you're done
                        </Typography>
                      </Box>
                      {activeTab === 0 && <HiCheck size={24} color="#c10007" />}
                    </Box>
                  </CardContent>
                </Card>

                <Card
                  sx={{
                    cursor: 'pointer',
                    border: activeTab === 1 ? '2px solid #c10007' : '1px solid #e0e0e0',
                    backgroundColor: activeTab === 1 ? '#fff5f5' : 'white',
                    '&:hover': {
                      borderColor: '#c10007',
                      backgroundColor: '#fff5f5',
                    },
                  }}
                  onClick={() => setActiveTab(1)}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>📍</Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            mb: 1,
                            fontSize: { xs: '1rem', sm: '1.25rem' },
                          }}
                        >
                          Pickup Service
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                        >
                          Pick up the car from our office and return it when you're done
                        </Typography>
                      </Box>
                      {activeTab === 1 && <HiCheck size={24} color="#c10007" />}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Box>
        )}

        {/* Step 1: Booking Details */}
        {activeStep === 1 && (
          <Box sx={{ px: { xs: 2, sm: 3 } }}>
            {/* Form Fields */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Date Range Split */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box ref={fieldRefs.startDate} sx={{ flex: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Start Date *"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
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
                  {missingFields.includes('startDate') && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                      <HiExclamationCircle size={20} />
                    </Box>
                  )}
                </Box>

                <Box ref={fieldRefs.endDate} sx={{ flex: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="End Date *"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
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
                  {missingFields.includes('endDate') && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                      <HiExclamationCircle size={20} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Time Range Split */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box ref={fieldRefs.pickupTime} sx={{ flex: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Pickup Time *"
                    value={formData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={missingFields.includes('pickupTime')}
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
                  {missingFields.includes('pickupTime') && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                      <HiExclamationCircle size={20} />
                    </Box>
                  )}
                </Box>

                <Box ref={fieldRefs.dropoffTime} sx={{ flex: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    type="time"
                    label="Drop-off Time *"
                    value={formData.dropoffTime}
                    onChange={(e) => handleInputChange('dropoffTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                    error={missingFields.includes('dropoffTime')}
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
                  {missingFields.includes('dropoffTime') && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                      <HiExclamationCircle size={20} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Location Fields - Different for Delivery vs Pickup */}
              {activeTab === 0 ? (
                <>
                  {/* Delivery Service Locations */}
                  <Box ref={fieldRefs.deliveryLocation} sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      label="Delivery Address *"
                      value={formData.deliveryLocation}
                      onChange={(e) => handleInputChange('deliveryLocation', e.target.value)}
                      required
                      error={missingFields.includes('deliveryLocation')}
                      placeholder="Where should we deliver the car?"
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
                    {missingFields.includes('deliveryLocation') && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                        <HiExclamationCircle size={20} />
                      </Box>
                    )}
                  </Box>

                  <Box ref={fieldRefs.dropoffLocation} sx={{ position: 'relative' }}>
                    <TextField
                      fullWidth
                      label="Drop-off Address *"
                      value={formData.dropoffLocation}
                      onChange={(e) => handleInputChange('dropoffLocation', e.target.value)}
                      required
                      error={missingFields.includes('dropoffLocation')}
                      placeholder="Where should we pick up the car when you're done?"
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
                    {missingFields.includes('dropoffLocation') && (
                      <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                        <HiExclamationCircle size={20} />
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  {/* Pickup Service - No location field needed, office is default */}
                  <Box sx={{ p: 3, backgroundColor: '#f0f8ff', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#c10007' }}>
                      📍 Pickup Location
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      JA Car Rental Office
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      123 Main Street, Business District, City
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Please arrive 15 minutes before your scheduled pickup time.
                    </Typography>
                  </Box>
                </>
              )}

              {/* Purpose - Moved below addresses */}
              <Box ref={fieldRefs.purpose} sx={{ position: 'relative' }}>
                <FormControl fullWidth required error={missingFields.includes('purpose')}>
                  <InputLabel id="purpose-label">Purpose of Rental *</InputLabel>
                  <Select
                    labelId="purpose-label"
                    value={formData.purpose}
                    label="Purpose of Rental *"
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#c10007',
                        },
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
                {missingFields.includes('purpose') && (
                  <Box sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}>
                    <HiExclamationCircle size={20} />
                  </Box>
                )}
              </Box>

              {/* Custom Purpose Field - Only show if "Others" is selected */}
              {formData.purpose === 'Others' && (
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    label="Please specify your purpose *"
                    value={formData.customPurpose || ''}
                    onChange={(e) => handleInputChange('customPurpose', e.target.value)}
                    multiline
                    rows={3}
                    required
                    error={formData.purpose === 'Others' && !formData.customPurpose}
                    placeholder="Please describe your specific rental purpose..."
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: '1rem' },
                      '& .MuiInputBase-input': { fontSize: '1rem' },
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#c10007',
                        },
                      },
                    }}
                  />
                </Box>
              )}

              {/* Self-Drive Service Button */}
              <Box sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, border: '2px solid #e0e0e0' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isSelfService}
                      onChange={(e) => setIsSelfService(e.target.checked)}
                      size="large"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#c10007',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#c10007',
                        },
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        Self-Drive Service
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                        {isSelfService ? 'You will drive the car yourself' : 'A professional driver will be assigned'}
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start', width: '100%', m: 0 }}
                />
              </Box>

              {/* Driver Selection - Only show if not self-service */}
              {!isSelfService && drivers.length > 0 && (
                <Box ref={fieldRefs.selectedDriver}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      Select Driver *
                    </Typography>
                    {missingFields.includes('selectedDriver') && (
                      <HiExclamationCircle size={20} color="#d32f2f" />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {drivers.map((driver) => (
                      <Card 
                        key={driver.driver_id}
                        sx={{ 
                          cursor: 'pointer',
                          border: formData.selectedDriver === driver.driver_id ? '2px solid #c10007' : 
                                 missingFields.includes('selectedDriver') ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                          backgroundColor: formData.selectedDriver === driver.driver_id ? '#fff5f5' : 'white',
                          '&:hover': {
                            borderColor: '#c10007',
                            backgroundColor: '#fff5f5',
                          },
                        }}
                        onClick={() => handleInputChange('selectedDriver', driver.driver_id)}
                      >
                        <CardContent sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: '#c10007', width: 48, height: 48 }}>
                              {driver.first_name[0]}{driver.last_name[0]}
                            </Avatar>
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                                {driver.first_name} {driver.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                                License: {driver.license_number}
                              </Typography>
                            </Box>
                            {formData.selectedDriver === driver.driver_id && (
                              <HiCheck size={24} color="#c10007" />
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}

              {/* No drivers available message */}
              {!isSelfService && drivers.length === 0 && (
                <Alert severity="info">
                  No drivers are currently available. Please try self-drive service or contact support.
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {/* Step 2: Confirmation Step */}
        {activeStep === 2 && (
          <Box sx={{ px: { xs: 2, sm: 3 } }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: { xs: 2, sm: 3 }, 
                fontWeight: 'bold', 
                color: '#c10007',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              Please confirm your booking details:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
              {/* Car Summary */}
              <Card sx={{ border: '2px solid #c10007' }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold', 
                      color: '#c10007',
                      fontSize: { xs: '1rem', sm: '1.25rem' },
                    }}
                  >
                    🚗 Vehicle Details
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {car.make} {car.model} ({car.year})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {car.no_of_seat} seats • Plate: {car.license_plate}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="h6" sx={{ color: '#c10007', fontWeight: 'bold' }}>
                        ₱{car.rent_price?.toLocaleString()}/day
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Service & Duration */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      🛎️ Service Type
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {activeTab === 0 ? '🚚 Delivery Service' : '📍 Pickup Service'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {isSelfService ? '🚗 Self-Drive' : `👨‍💼 With Driver: ${getSelectedDriver()?.first_name} ${getSelectedDriver()?.last_name}`}
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📅 Duration
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      {formData.startDate} to {formData.endDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days total
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Times & Purpose */}
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      ⏰ Schedule
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Pickup:</strong> {formData.pickupTime}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Drop-off:</strong> {formData.dropoffTime}
                    </Typography>
                  </CardContent>
                </Card>

                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      📝 Purpose
                    </Typography>
                    <Typography variant="body1">
                      {formData.purpose === 'Others' ? formData.customPurpose : formData.purpose}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Location Details */}
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                    📍 Location Details
                  </Typography>
                  {activeTab === 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c10007', mb: 0.5 }}>
                          Delivery Address:
                        </Typography>
                        <Typography variant="body1">{formData.deliveryLocation}</Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c10007', mb: 0.5 }}>
                          Return Address:
                        </Typography>
                        <Typography variant="body1">{formData.dropoffLocation}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c10007', mb: 0.5 }}>
                        Pickup & Return Location:
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        JA Car Rental Office
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        123 Main Street, Business District, City
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Driver Info - Only show if driver selected */}
              {!isSelfService && getSelectedDriver() && (
                <Card sx={{ backgroundColor: '#f8f9fa', border: '2px solid #e0e0e0' }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                      👨‍💼 Assigned Driver
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#c10007', width: 56, height: 56 }}>
                        {getSelectedDriver().first_name[0]}{getSelectedDriver().last_name[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {getSelectedDriver().first_name} {getSelectedDriver().last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          License: {getSelectedDriver().license_number}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              {/* Cost Summary */}
              <Card sx={{ backgroundColor: '#f0f8ff', border: '3px solid #c10007' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: '#c10007' }}>
                    💰 Cost Breakdown
                  </Typography>
                  
                  {/* Detailed Fee Breakdown */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        {Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days × ₱{car.rent_price?.toLocaleString()}/day
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₱{((Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1) * car.rent_price).toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Reservation Fee</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₱{fees.reservation_fee.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Cleaning Fee</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        ₱{fees.cleaning_fee.toLocaleString()}
                      </Typography>
                    </Box>
                    
                    {!isSelfService && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">
                          Driver Fee ({Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1} days)
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ₱{(fees.driver_fee * (Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1)).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        Total Amount
                      </Typography>
                      <Typography variant="h4" sx={{ color: '#c10007', fontWeight: 'bold' }}>
                        ₱{calculateTotalCost().toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Payment Deadline Notice */}
              {formData.startDate && paymentDeadlineHours && (
                <Card sx={{ 
                  backgroundColor: formatPaymentDeadline().urgencyLevel === 'error' ? '#ffebee' :
                                 formatPaymentDeadline().urgencyLevel === 'warning' ? '#fff8e1' : '#e3f2fd',
                  border: `2px solid ${formatPaymentDeadline().urgencyLevel === 'error' ? '#f44336' :
                                     formatPaymentDeadline().urgencyLevel === 'warning' ? '#ff9800' : '#2196f3'}`
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <HiClock size={24} color={
                        formatPaymentDeadline().urgencyLevel === 'error' ? '#f44336' :
                        formatPaymentDeadline().urgencyLevel === 'warning' ? '#ff9800' : '#2196f3'
                      } />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        color: formatPaymentDeadline().urgencyLevel === 'error' ? '#f44336' :
                               formatPaymentDeadline().urgencyLevel === 'warning' ? '#ff9800' : '#2196f3'
                      }}>
                        Payment Deadline
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {formatPaymentDeadline().message}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ 
                      fontWeight: 'bold',
                      color: formatPaymentDeadline().urgencyLevel === 'error' ? '#f44336' :
                             formatPaymentDeadline().urgencyLevel === 'warning' ? '#ff9800' : '#2196f3'
                    }}>
                      Deadline: {formatPaymentDeadline().deadline}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Special Notice for Same-Day Bookings */}
              {formData.startDate && new Date(formData.startDate).toDateString() === new Date().toDateString() && (
                <Card sx={{ backgroundColor: '#fff3e0', border: '2px solid #ff9800' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        ⚡ Same-Day Booking Notice
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      <strong>Service Availability:</strong> For same-day bookings, the vehicle service will be available 3 hours after payment confirmation.
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      This allows time for vehicle preparation, cleaning, and delivery coordination.
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions 
        sx={{ 
          p: { xs: 2, sm: 3 }, 
          borderTop: '1px solid #e0e0e0', 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          '& > button': {
            width: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.85rem', sm: '0.875rem' },
          },
        }}
      >
        {activeStep === 0 ? (
          <>
            <Button
              onClick={onClose}
              sx={{ color: '#666', textTransform: 'none' }}

            >
              Cancel
            </Button>
            <Button

              onClick={handleNext}
              variant="contained"
              endIcon={<HiArrowRight />}
              sx={{
                backgroundColor: '#c10007',
                textTransform: 'none',
                px: 4,
                '&:hover': {
                  backgroundColor: '#a50006',
                },
              }}
            >
              Next
            </Button>
          </>
        ) : activeStep === 1 ? (
          <>
            <Button
              onClick={handleBack}
              startIcon={<HiArrowLeft />}
              sx={{ color: '#666', textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<HiArrowRight />}
              sx={{
                backgroundColor: '#c10007',
                textTransform: 'none',
                px: 4,
                '&:hover': {
                  backgroundColor: '#a50006',
                },
              }}
            >
              Next
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleBack}
              startIcon={<HiArrowLeft />}
              sx={{ color: '#666', textTransform: 'none' }}
            >
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <HiCheck />}
              sx={{
                backgroundColor: '#c10007',
                textTransform: 'none',
                px: 4,
                '&:hover': {
                  backgroundColor: '#a50006',
                },
                '&:disabled': {
                  backgroundColor: '#ccc',
                },
              }}
            >
              {loading ? 'Submitting...' : 'Confirm Booking'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
