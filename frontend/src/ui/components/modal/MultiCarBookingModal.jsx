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
  Chip,
  Card,
  CardContent,
  CardMedia,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from '@mui/material';
import {
  HiX,
  HiArrowLeft,
  HiArrowRight,
  HiCheck,
  HiExclamationCircle,
  HiClock,
  HiChevronDown,
  HiTrash,
} from 'react-icons/hi';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';
import { useAuth } from '../../../hooks/useAuth';
import RegisterTermsAndConditionsModal from '../../modals/RegisterTermsAndConditionsModal';

const API_BASE = getApiBase();

export default function MultiCarBookingModal({
  open,
  onClose,
  cars,
  onBookingSuccess,
}) {
  const { logout } = useAuth();
  const authenticatedFetch = React.useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [expandedCar, setExpandedCar] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [hasViewedTerms, setHasViewedTerms] = useState(false);
  const [fees, setFees] = useState({
    reservation_fee: 1000,
    cleaning_fee: 200,
    driver_fee: 500,
  });
  const [unavailablePeriods, setUnavailablePeriods] = useState({});
  const [dateConflicts, setDateConflicts] = useState([]);
  const [driverWarning, setDriverWarning] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [hasDriverLicense, setHasDriverLicense] = useState(true);

  // Common form data applied to all cars by default
  const [commonData, setCommonData] = useState({
    startDate: '',
    endDate: '',
    pickupTime: '09:00',
    dropoffTime: '17:00',
    purpose: '',
    customPurpose: '',
    isSelfDrive: true,
    deliveryType: 'pickup', // 'pickup' or 'delivery'
    pickupLocation: 'JA Car Rental Office',
    dropoffLocation: 'JA Car Rental Office',
    deliveryLocation: '',
  });

  // Individual car bookings with ability to override common data
  const [carBookings, setCarBookings] = useState([]);

  const steps = [
    'Common Details',
    'Individual Cars',
    'Car Use Notice',
    'Review & Confirm',
  ];

  useEffect(() => {
    if (open && cars && cars.length > 0) {
      // Initialize car bookings with common data
      const initialBookings = cars.map((car) => ({
        car,
        useCommonData: true,
        startDate: '',
        endDate: '',
        pickupTime: '09:00',
        dropoffTime: '17:00',
        purpose: '',
        customPurpose: '',
        isSelfDrive: true,
        selectedDriver: '',
        deliveryType: 'pickup',
        deliveryLocation: '',
        dropoffLocation: 'JA Car Rental Office',
        pickupLocation: 'JA Car Rental Office',
        hasConflict: false,
        conflictMessage: '',
      }));
      setCarBookings(initialBookings);
      fetchDrivers();
      fetchFees();
      fetchCustomerData();
      fetchAllUnavailablePeriods();
      setError('');
      setActiveStep(0);
      setExpandedCar(0);
      setTermsAccepted(false);
      setShowTermsModal(false);
      setHasViewedTerms(false);
      setDateConflicts([]);
      setDriverWarning('');
    }
  }, [open, cars]);

  // Check for conflicts when common data dates change
  useEffect(() => {
    if (commonData.startDate && commonData.endDate) {
      setCarBookings((prev) =>
        prev.map((booking) => {
          if (booking.useCommonData) {
            const conflict = checkDateConflict(
              booking.car.car_id,
              commonData.startDate,
              commonData.endDate
            );
            return {
              ...booking,
              startDate: commonData.startDate,
              endDate: commonData.endDate,
              hasConflict: conflict.hasConflict,
              conflictMessage: conflict.message,
            };
          }
          return booking;
        })
      );
    }
  }, [commonData.startDate, commonData.endDate, unavailablePeriods]);

  // Auto-expand first conflicted car in Step 1
  useEffect(() => {
    if (activeStep === 1 && dateConflicts.length > 0) {
      const firstConflictIndex = dateConflicts[0].carIndex;
      setExpandedCar(firstConflictIndex);
    }
  }, [activeStep, dateConflicts]);

  const fetchDrivers = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/drivers`);
      if (response.ok) {
        const response_data = await response.json();
        const data = Array.isArray(response_data)
          ? response_data
          : response_data.data || [];
        const filteredDrivers = data.filter(
          (driver) => driver.drivers_id !== 1 && driver.driver_id !== 1
        );
        setDrivers(filteredDrivers);
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchFees = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/fees`);
      if (response.ok) {
        const data = await response.json();
        setFees({
          reservation_fee: data.reservation_fee || 1000,
          cleaning_fee: data.cleaning_fee || 200,
          driver_fee: data.driver_fee || 500,
        });
      }
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  const fetchCustomerData = async () => {
    try {
      const response = await authenticatedFetch(`${API_BASE}/api/customers/me`);
      if (response.ok) {
        const data = await response.json();
        setCustomerData(data);

        const hasLicense =
          data.driver_license?.driver_license_no &&
          data.driver_license.driver_license_no.trim() !== '';
        setHasDriverLicense(hasLicense);

        if (!hasLicense) {
          setCommonData((prev) => ({ ...prev, isSelfDrive: false }));
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const fetchAllUnavailablePeriods = async () => {
    if (!cars || cars.length === 0) return;

    try {
      const periods = {};
      for (const car of cars) {
        const response = await fetch(
          `${API_BASE}/cars/${car.car_id}/unavailable-periods`
        );
        if (response.ok) {
          const data = await response.json();
          periods[car.car_id] = data.unavailable_periods || [];
        } else {
          periods[car.car_id] = [];
        }
      }
      setUnavailablePeriods(periods);
    } catch (error) {
      console.error('Error fetching unavailable periods:', error);
    }
  };

  const checkDateConflict = (carId, startDate, endDate) => {
    if (!startDate || !endDate || !unavailablePeriods[carId]) {
      return { hasConflict: false, message: '' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const periods = unavailablePeriods[carId];
    for (const period of periods) {
      const periodStart = new Date(period.start_date);
      const periodEnd = new Date(period.end_date);

      if (start <= periodEnd && end >= periodStart) {
        const conflictType = period.reason === 'maintenance' ? 'maintenance' : 'another booking';
        return {
          hasConflict: true,
          message: `This car is unavailable from ${periodStart.toLocaleDateString()} to ${periodEnd.toLocaleDateString()} due to ${conflictType}.`,
        };
      }
    }

    return { hasConflict: false, message: '' };
  };

  const checkDriverAvailability = () => {
    const carsNeedingDrivers = carBookings.filter(
      (booking) => !booking.isSelfDrive && booking.useCommonData ? !commonData.isSelfDrive : true
    );

    if (carsNeedingDrivers.length > drivers.length) {
      return `Warning: You are booking ${carsNeedingDrivers.length} car(s) that require driver(s), but only ${drivers.length} driver(s) are available. Please ensure drivers are available or consider self-drive for some vehicles.`;
    }

    return '';
  };

  const handleCommonDataChange = (field, value) => {
    setCommonData((prev) => ({ ...prev, [field]: value }));
    
    // Special handling for deliveryType
    if (field === 'deliveryType') {
      if (value === 'pickup') {
        setCommonData((prev) => ({
          ...prev,
          deliveryType: value,
          pickupLocation: 'JA Car Rental Office',
          dropoffLocation: 'JA Car Rental Office',
          deliveryLocation: '',
        }));
      } else {
        setCommonData((prev) => ({
          ...prev,
          deliveryType: value,
          deliveryLocation: '',
        }));
      }
    }
    
    // Update all cars that use common data
    setCarBookings((prev) =>
      prev.map((booking) => {
        if (booking.useCommonData) {
          const updates = { ...booking, [field]: value };
          // Clear selectedDriver when switching to self-drive in common data
          if (field === 'isSelfDrive' && value === true) {
            updates.selectedDriver = '';
          }
          return updates;
        }
        return booking;
      })
    );
  };

  const handleCarDataChange = (index, field, value) => {
    setCarBookings((prev) => {
      const updated = [...prev];
      
      // If changing isSelfDrive while using common data, toggle off useCommonData first
      if (field === 'isSelfDrive' && updated[index].useCommonData) {
        updated[index] = {
          ...updated[index],
          useCommonData: false,
          // Copy all common data values except isSelfDrive which we're changing
          startDate: commonData.startDate,
          endDate: commonData.endDate,
          pickupTime: commonData.pickupTime,
          dropoffTime: commonData.dropoffTime,
          purpose: commonData.purpose,
          customPurpose: commonData.customPurpose,
          deliveryType: commonData.deliveryType,
          deliveryLocation: commonData.deliveryLocation,
          pickupLocation: commonData.pickupLocation,
          dropoffLocation: commonData.dropoffLocation,
          isSelfDrive: value, // Use the new value
          selectedDriver: value ? '' : updated[index].selectedDriver, // Clear driver if self-drive
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };

        // Clear selected driver when switching to self-drive
        if (field === 'isSelfDrive' && value === true) {
          updated[index].selectedDriver = '';
        }
      }

      // Check for date conflicts when dates change
      if (field === 'startDate' || field === 'endDate') {
        const booking = updated[index];
        const conflict = checkDateConflict(
          booking.car.car_id,
          booking.startDate,
          booking.endDate
        );
        updated[index].hasConflict = conflict.hasConflict;
        updated[index].conflictMessage = conflict.message;

        // Update dateConflicts array in real-time
        setTimeout(() => {
          const newConflicts = [];
          updated.forEach((b, idx) => {
            const startDate = b.useCommonData ? commonData.startDate : b.startDate;
            const endDate = b.useCommonData ? commonData.endDate : b.endDate;
            if (startDate && endDate) {
              const c = checkDateConflict(b.car.car_id, startDate, endDate);
              if (c.hasConflict) {
                newConflicts.push({
                  carIndex: idx,
                  carName: `${b.car.make} ${b.car.model}`,
                  message: c.message,
                });
              }
            }
          });
          setDateConflicts(newConflicts);
        }, 0);
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

  const toggleUseCommonData = (index) => {
    setCarBookings((prev) => {
      const updated = [...prev];
      const useCommon = !updated[index].useCommonData;
      updated[index] = {
        ...updated[index],
        useCommonData: useCommon,
        // If switching to common data, copy common values
        ...(useCommon && {
          startDate: commonData.startDate,
          endDate: commonData.endDate,
          pickupTime: commonData.pickupTime,
          dropoffTime: commonData.dropoffTime,
          purpose: commonData.purpose,
          customPurpose: commonData.customPurpose,
          isSelfDrive: commonData.isSelfDrive,
          deliveryType: commonData.deliveryType,
          deliveryLocation: commonData.deliveryLocation,
          pickupLocation: commonData.pickupLocation,
          dropoffLocation: commonData.dropoffLocation,
          // Clear driver if common data is self-drive
          selectedDriver: commonData.isSelfDrive ? '' : updated[index].selectedDriver,
        }),
      };

      // Check for conflicts when toggling to common data
      if (useCommon && commonData.startDate && commonData.endDate) {
        const conflict = checkDateConflict(
          updated[index].car.car_id,
          commonData.startDate,
          commonData.endDate
        );
        updated[index].hasConflict = conflict.hasConflict;
        updated[index].conflictMessage = conflict.message;
      } else if (!useCommon) {
        // Clear conflict when switching to custom data
        updated[index].hasConflict = false;
        updated[index].conflictMessage = '';
      }

      // Update dateConflicts array
      setTimeout(() => {
        const newConflicts = [];
        updated.forEach((b, idx) => {
          const startDate = b.useCommonData ? commonData.startDate : b.startDate;
          const endDate = b.useCommonData ? commonData.endDate : b.endDate;
          if (startDate && endDate) {
            const c = checkDateConflict(b.car.car_id, startDate, endDate);
            if (c.hasConflict) {
              newConflicts.push({
                carIndex: idx,
                carName: `${b.car.make} ${b.car.model}`,
                message: c.message,
              });
            }
          }
        });
        setDateConflicts(newConflicts);
      }, 0);

      return updated;
    });
  };

  const removeCar = (index) => {
    setCarBookings((prev) => prev.filter((_, i) => i !== index));
    if (carBookings.length === 1) {
      onClose(); // Close if removing last car
    }
  };

  const calculateCarCost = (booking) => {
    if (!booking.startDate || !booking.endDate) return 0;

    const days =
      Math.floor(
        (new Date(booking.endDate) - new Date(booking.startDate)) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const baseCost = days * (booking.car.rent_price || 0);
    const driverCost = booking.isSelfDrive ? 0 : fees.driver_fee * days;
    const totalCost =
      baseCost + fees.reservation_fee + fees.cleaning_fee + driverCost;

    return totalCost;
  };

  const calculateTotalCost = () => {
    return carBookings.reduce(
      (total, booking) => total + calculateCarCost(booking),
      0
    );
  };

  const validateCommonData = () => {
    const errors = [];
    if (!commonData.startDate) errors.push('Start date is required');
    if (!commonData.endDate) errors.push('End date is required');
    if (new Date(commonData.startDate) > new Date(commonData.endDate)) {
      errors.push('End date must be after start date');
    }
    if (!commonData.purpose) errors.push('Purpose is required');
    if (commonData.purpose === 'Others' && !commonData.customPurpose) {
      errors.push('Please specify your purpose');
    }
    if (commonData.deliveryType === 'delivery' && !commonData.deliveryLocation) {
      errors.push('Delivery location is required');
    }

    // Check for date conflicts in cars using common data
    const conflicts = [];
    carBookings.forEach((booking, index) => {
      if (booking.useCommonData) {
        const conflict = checkDateConflict(
          booking.car.car_id,
          commonData.startDate,
          commonData.endDate
        );
        if (conflict.hasConflict) {
          const carDisplayName = `${booking.car.make} ${booking.car.model}`;
          conflicts.push({
            carIndex: index,
            carName: carDisplayName,
            message: conflict.message,
          });
        }
      }
    });

    setDateConflicts(conflicts);

    return errors;
  };

  const validateIndividualBookings = () => {
    const errors = [];
    const conflicts = [];
    
    carBookings.forEach((booking, index) => {
      if (!booking.useCommonData) {
        if (!booking.startDate)
          errors.push(`Car ${index + 1}: Start date is required`);
        if (!booking.endDate)
          errors.push(`Car ${index + 1}: End date is required`);
        if (!booking.purpose)
          errors.push(`Car ${index + 1}: Purpose is required`);
        if (booking.deliveryType === 'delivery' && !booking.deliveryLocation) {
          errors.push(`Car ${index + 1}: Delivery location is required`);
        }
      }
      
      // Check for date conflicts for ALL cars (both common and custom data)
      const startDate = booking.useCommonData ? commonData.startDate : booking.startDate;
      const endDate = booking.useCommonData ? commonData.endDate : booking.endDate;
      
      if (startDate && endDate) {
        const conflict = checkDateConflict(
          booking.car.car_id,
          startDate,
          endDate
        );
        if (conflict.hasConflict) {
          const carDisplayName = `${booking.car.make} ${booking.car.model}`;
          conflicts.push({
            carIndex: index,
            carName: carDisplayName,
            message: conflict.message,
          });
        }
      }
      
      // Check if driver is required but not selected
      const isSelfDrive = booking.useCommonData ? commonData.isSelfDrive : booking.isSelfDrive;
      if (!isSelfDrive && !booking.selectedDriver) {
        const carDisplayName = `${booking.car.make} ${booking.car.model}`;
        errors.push(`${carDisplayName}: Please select a driver`);
      }
    });

    // Check for duplicate driver assignments
    const driverAssignments = {};
    carBookings.forEach((booking, index) => {
      const isSelfDrive = booking.useCommonData ? commonData.isSelfDrive : booking.isSelfDrive;
      const driverKey = booking.selectedDriver ? String(booking.selectedDriver) : null;
      
      if (!isSelfDrive && driverKey) {
        if (!driverAssignments[driverKey]) {
          driverAssignments[driverKey] = [];
        }
        driverAssignments[driverKey].push({
          index,
          carName: `${booking.car.make} ${booking.car.model}`,
        });
      }
    });

    // Report duplicate driver assignments
    Object.entries(driverAssignments).forEach(([driverId, assignments]) => {
      if (assignments.length > 1) {
        const carNames = assignments.map(a => a.carName).join(' and ');
        const driver = drivers.find(d => String(d.drivers_id) === driverId);
        const driverName = driver ? `${driver.first_name} ${driver.last_name}` : 'This driver';
        errors.push(`⚠️ ${driverName} is assigned to multiple cars (${carNames}). Each driver can only drive one car at a time.`);
      }
    });

    // Check driver availability
    const driverWarningMsg = checkDriverAvailability();
    if (driverWarningMsg) {
      setDriverWarning(driverWarningMsg);
    }

    setDateConflicts(conflicts);
    
    return errors;
  };

  const handleShowTerms = () => {
    setShowTermsModal(true);
  };

  const handleAgreeTerms = () => {
    setShowTermsModal(false);
    setHasViewedTerms(true);
    setTermsAccepted(true);
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const handleCheckboxClick = (e) => {
    if (!hasViewedTerms) {
      e.preventDefault();
      setError('⚠️ Please read the Terms and Conditions first');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const errors = validateCommonData();
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }
      // Always proceed to Step 1, conflicts will be shown and resolved there
      setError('');
      setActiveStep(1);
      return;
    } else if (activeStep === 1) {
      const errors = validateIndividualBookings();
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }
      // Check if there are still conflicts
      if (dateConflicts.length > 0) {
        setError('Please resolve all date conflicts before proceeding.');
        return;
      }
    } else if (activeStep === 2) {
      // Car Use Notice step - validate terms acceptance
      if (!termsAccepted) {
        setError('Please agree to the Car Use Notice terms to proceed.');
        return;
      }
    }
    setError('');
    setDriverWarning(''); // Clear driver warning when moving forward
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Prepare booking data for all cars
      const bookingsData = carBookings.map((booking) => {
        const finalPurpose =
          (booking.useCommonData ? commonData.purpose : booking.purpose) ===
          'Others'
            ? booking.useCommonData
              ? commonData.customPurpose
              : booking.customPurpose
            : booking.useCommonData
              ? commonData.purpose
              : booking.purpose;

        return {
          car_id: booking.car.car_id,
          purpose: finalPurpose,
          startDate: booking.useCommonData
            ? commonData.startDate
            : booking.startDate,
          endDate: booking.useCommonData ? commonData.endDate : booking.endDate,
          pickupTime: booking.useCommonData
            ? commonData.pickupTime
            : booking.pickupTime,
          dropoffTime: booking.useCommonData
            ? commonData.dropoffTime
            : booking.dropoffTime,
          deliveryType: booking.useCommonData
            ? commonData.deliveryType
            : booking.deliveryType,
          deliveryLocation:
            (booking.useCommonData
              ? commonData.deliveryType
              : booking.deliveryType) === 'delivery'
              ? (booking.useCommonData
                  ? commonData.deliveryLocation
                  : booking.deliveryLocation)
              : null,
          pickupLocation:
            (booking.useCommonData
              ? commonData.deliveryType
              : booking.deliveryType) === 'pickup'
              ? (booking.useCommonData
                  ? commonData.pickupLocation
                  : booking.pickupLocation)
              : null,
          dropoffLocation: booking.useCommonData
            ? commonData.dropoffLocation
            : booking.dropoffLocation,
          selectedDriver: (booking.useCommonData
            ? commonData.isSelfDrive
            : booking.isSelfDrive)
            ? null
            : booking.selectedDriver,
          totalCost: calculateCarCost(booking),
          isSelfDrive: booking.useCommonData
            ? commonData.isSelfDrive
            : booking.isSelfDrive,
          total_amount: calculateCarCost(booking),
          balance: calculateCarCost(booking),
          booking_status: 'Pending',
        };
      });

      // Call bulk booking endpoint
      const response = await authenticatedFetch(`${API_BASE}/bookings/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookings: bookingsData }),
      });

      if (response.ok) {
        const result = await response.json();
        if (onBookingSuccess) {
          onBookingSuccess(result);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setError(
          errorData.error ||
            errorData.message ||
            'Failed to create bookings. Please try again.'
        );
      }
    } catch (error) {
      setError('Failed to submit bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cars || cars.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 'bold', color: '#c10007' }}
          >
            Book Multiple Cars ({carBookings.length})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete booking for all selected vehicles
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Common Details */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info">
              Set common details that will apply to all cars. You can customize
              individual cars in the next step.
            </Alert>

            {dateConflicts.length > 0 && (
              <Alert severity="warning">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Date Conflicts Detected ({dateConflicts.length} car{dateConflicts.length > 1 ? 's' : ''}):
                </Typography>
                {dateConflicts.map((conflict, idx) => (
                  <Box key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#c10007' }}>
                      • {conflict.carName}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
                      {conflict.message}
                    </Typography>
                  </Box>
                ))}
                <Typography variant="body2" sx={{ mt: 1.5, fontStyle: 'italic', color: '#666' }}>
                  ⓘ Click NEXT to adjust dates for individual cars in the next step.
                </Typography>
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={commonData.startDate}
                  onChange={(e) =>
                    handleCommonDataChange('startDate', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={commonData.endDate}
                  onChange={(e) =>
                    handleCommonDataChange('endDate', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: commonData.startDate }}
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Pickup Time"
                  value={commonData.pickupTime}
                  onChange={(e) =>
                    handleCommonDataChange('pickupTime', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="time"
                  label="Drop-off Time"
                  value={commonData.dropoffTime}
                  onChange={(e) =>
                    handleCommonDataChange('dropoffTime', e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth required>
                  <InputLabel>Purpose of Rental</InputLabel>
                  <Select
                    value={commonData.purpose}
                    label="Purpose of Rental"
                    onChange={(e) =>
                      handleCommonDataChange('purpose', e.target.value)
                    }
                  >
                    <MenuItem value="Travel">Travel</MenuItem>
                    <MenuItem value="Vehicle Replacement">
                      Vehicle Replacement
                    </MenuItem>
                    <MenuItem value="Local Transportation">
                      Local Transportation
                    </MenuItem>
                    <MenuItem value="Specialize Needs">
                      Specialize Needs
                    </MenuItem>
                    <MenuItem value="One-Way Rental">One-Way Rental</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {commonData.purpose === 'Others' && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Please specify your purpose"
                    value={commonData.customPurpose}
                    onChange={(e) =>
                      handleCommonDataChange('customPurpose', e.target.value)
                    }
                    multiline
                    rows={3}
                    required
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Service Type</FormLabel>
                  <RadioGroup
                    row
                    value={commonData.deliveryType}
                    onChange={(e) =>
                      handleCommonDataChange('deliveryType', e.target.value)
                    }
                  >
                    <FormControlLabel
                      value="pickup"
                      control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                      label="Pick-up at Office"
                    />
                    <FormControlLabel
                      value="delivery"
                      control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                      label="Delivery Service"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {commonData.deliveryType === 'delivery' && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Delivery Location"
                    value={commonData.deliveryLocation}
                    onChange={(e) =>
                      handleCommonDataChange('deliveryLocation', e.target.value)
                    }
                    placeholder="Enter your delivery address"
                    required
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Driving Option</FormLabel>
                  <RadioGroup
                    row
                    value={commonData.isSelfDrive ? 'self' : 'driver'}
                    onChange={(e) =>
                      handleCommonDataChange('isSelfDrive', e.target.value === 'self')
                    }
                  >
                    <FormControlLabel
                      value="self"
                      control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                      label="Self-Drive"
                      disabled={!hasDriverLicense}
                    />
                    <FormControlLabel
                      value="driver"
                      control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                      label="With Driver"
                    />
                  </RadioGroup>
                  {!hasDriverLicense && (
                    <Typography variant="caption" color="error">
                      Self-drive not available (no driver's license on file)
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 1: Individual Car Details */}
        {activeStep === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info">
              Review and customize each car's booking. Toggle "Use Common Data"
              to customize individual settings.
            </Alert>

            {driverWarning && (
              <Alert severity="warning">
                {driverWarning}
              </Alert>
            )}

            {dateConflicts.length > 0 && (
              <Alert severity="error">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  ⚠️ Please resolve the following date conflicts ({dateConflicts.length} car{dateConflicts.length > 1 ? 's' : ''}):
                </Typography>
                {dateConflicts.map((conflict, idx) => (
                  <Box key={idx} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      • {conflict.carName}
                    </Typography>
                    <Typography variant="caption" sx={{ ml: 2, display: 'block' }}>
                      {conflict.message}
                    </Typography>
                  </Box>
                ))}
                <Typography variant="body2" sx={{ mt: 1.5, fontWeight: 'bold' }}>
                  Toggle "Use Common Data" off and adjust dates for each conflicted car below.
                </Typography>
              </Alert>
            )}

            {carBookings.map((booking, index) => (
              <Accordion
                key={booking.car.car_id}
                expanded={expandedCar === index}
                onChange={() =>
                  setExpandedCar(expandedCar === index ? -1 : index)
                }
              >
                <AccordionSummary expandIcon={<HiChevronDown />}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    <Box
                      component="img"
                      src={booking.car.car_img_url}
                      alt={`${booking.car.make} ${booking.car.model}`}
                      sx={{
                        width: 60,
                        height: 60,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {booking.car.make} {booking.car.model}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ₱{calculateCarCost(booking).toLocaleString()} total
                      </Typography>
                    </Box>
                    {booking.hasConflict && (
                      <Chip
                        label="Date Conflict"
                        size="small"
                        color="error"
                        icon={<HiExclamationCircle />}
                      />
                    )}
                    {booking.useCommonData && !booking.hasConflict && (
                      <Chip
                        label="Using Common Data"
                        size="small"
                        color="primary"
                      />
                    )}
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCar(index);
                      }}
                      size="small"
                      sx={{ color: '#f44336' }}
                    >
                      <HiTrash />
                    </IconButton>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    {/* Show unavailable periods for this car */}
                    {unavailablePeriods[booking.car.car_id] && unavailablePeriods[booking.car.car_id].length > 0 ? (
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          ⚠️ Unavailable Dates for this Car:
                        </Typography>
                        {unavailablePeriods[booking.car.car_id].map((period, idx) => (
                          <Typography key={idx} variant="body2" display="block" sx={{ mb: 0.5 }}>
                            • {new Date(period.start_date).toLocaleDateString()} to {new Date(period.end_date).toLocaleDateString()}
                            {period.reason && ` - ${period.reason === 'maintenance' ? 'Maintenance' : 'Booked by another customer'}`}
                          </Typography>
                        ))}
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ mb: 1 }}>
                        <Typography variant="body2">
                          ✓ This car has no booking conflicts or scheduled maintenance
                        </Typography>
                      </Alert>
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={booking.useCommonData}
                          onChange={() => toggleUseCommonData(index)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#c10007',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#c10007',
                              },
                          }}
                        />
                      }
                      label="Use Common Data"
                    />

                    {booking.hasConflict && (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body2">
                          {booking.conflictMessage}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                          Please adjust the dates below or toggle "Use Common Data" off to set custom dates.
                        </Typography>
                      </Alert>
                    )}

                    {!booking.useCommonData && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            value={booking.startDate}
                            onChange={(e) =>
                              handleCarDataChange(
                                index,
                                'startDate',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                              min: new Date().toISOString().split('T')[0],
                            }}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="End Date"
                            value={booking.endDate}
                            onChange={(e) =>
                              handleCarDataChange(
                                index,
                                'endDate',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: booking.startDate }}
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            type="time"
                            label="Pickup Time"
                            value={booking.pickupTime}
                            onChange={(e) =>
                              handleCarDataChange(
                                index,
                                'pickupTime',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            type="time"
                            label="Drop-off Time"
                            value={booking.dropoffTime}
                            onChange={(e) =>
                              handleCarDataChange(
                                index,
                                'dropoffTime',
                                e.target.value
                              )
                            }
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <FormControl fullWidth required>
                            <InputLabel>Purpose</InputLabel>
                            <Select
                              value={booking.purpose}
                              label="Purpose"
                              onChange={(e) =>
                                handleCarDataChange(
                                  index,
                                  'purpose',
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value="Travel">Travel</MenuItem>
                              <MenuItem value="Vehicle Replacement">
                                Vehicle Replacement
                              </MenuItem>
                              <MenuItem value="Local Transportation">
                                Local Transportation
                              </MenuItem>
                              <MenuItem value="Others">Others</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <FormControl component="fieldset">
                            <FormLabel component="legend">Service Type</FormLabel>
                            <RadioGroup
                              row
                              value={booking.deliveryType}
                              onChange={(e) =>
                                handleCarDataChange(index, 'deliveryType', e.target.value)
                              }
                            >
                              <FormControlLabel
                                value="pickup"
                                control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                                label="Pick-up at Office"
                              />
                              <FormControlLabel
                                value="delivery"
                                control={<Radio sx={{ color: '#c10007', '&.Mui-checked': { color: '#c10007' } }} />}
                                label="Delivery Service"
                              />
                            </RadioGroup>
                          </FormControl>
                        </Grid>

                        {booking.deliveryType === 'delivery' && (
                          <Grid size={{ xs: 12 }}>
                            <TextField
                              fullWidth
                              label="Delivery Location"
                              value={booking.deliveryLocation}
                              onChange={(e) =>
                                handleCarDataChange(index, 'deliveryLocation', e.target.value)
                              }
                              placeholder="Enter your delivery address"
                              required
                            />
                          </Grid>
                        )}
                      </Grid>
                    )}

                    <Divider />

                    {/* Driver Selection */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={booking.useCommonData ? commonData.isSelfDrive : booking.isSelfDrive}
                          onChange={(e) =>
                            handleCarDataChange(
                              index,
                              'isSelfDrive',
                              e.target.checked
                            )
                          }
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#c10007',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':
                              {
                                backgroundColor: '#c10007',
                              },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>Self-Drive</span>
                          {booking.useCommonData && (
                            <Typography variant="caption" color="text.secondary">
                              (changing this will use custom settings)
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    {!(booking.useCommonData ? commonData.isSelfDrive : booking.isSelfDrive) && (
                      <>
                        <FormControl fullWidth required>
                          <InputLabel>Select Driver</InputLabel>
                          <Select
                            value={booking.selectedDriver}
                            label="Select Driver"
                            onChange={(e) =>
                              handleCarDataChange(
                                index,
                                'selectedDriver',
                                e.target.value
                              )
                            }
                          >
                            {drivers.map((driver) => (
                              <MenuItem
                                key={driver.drivers_id}
                                value={driver.drivers_id}
                              >
                                {driver.first_name} {driver.last_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        
                        {/* Check if this driver is already assigned to another car */}
                        {booking.selectedDriver && carBookings.some((b, idx) => 
                          idx !== index && 
                          b.selectedDriver && 
                          String(b.selectedDriver) === String(booking.selectedDriver) &&
                          !(b.useCommonData ? commonData.isSelfDrive : b.isSelfDrive)
                        ) && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              ⚠️ This driver is already assigned to another car. Each driver can only drive one car at a time.
                            </Typography>
                          </Alert>
                        )}
                      </>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Step 2: Car Use Notice */}
        {activeStep === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Card
              sx={{
                border: '2px solid #c10007',
                mb: 2,
              }}
            >
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
                  J & A Car Rental – Car Use Notice
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ mb: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}
                >
                  By renting our vehicles, you agree to the following:
                </Typography>

                <Box sx={{ pl: { xs: 1, sm: 2 }, mb: 3 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    • Use the cars for legal purposes only
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    • Do not sublease or allow unauthorized drivers
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    • Return the vehicles on or before the agreed date and time
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      lineHeight: 1.6,
                    }}
                  >
                    • Customer is responsible for traffic violations, damages,
                    or losses during the rental period
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid #e0e0e0',
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 1.5,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    For detailed terms, please review our full{' '}
                    <button
                      type="button"
                      onClick={handleShowTerms}
                      style={{
                        color: '#c10007',
                        textDecoration: 'underline',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.target.style.color = '#a00006')}
                      onMouseLeave={(e) => (e.target.style.color = '#c10007')}
                    >
                      Terms and Conditions
                    </button>
                  </Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={termsAccepted}
                        disabled={!hasViewedTerms}
                        onClick={handleCheckboxClick}
                        onChange={(e) => {
                          setTermsAccepted(e.target.checked);
                          if (e.target.checked) {
                            setError('');
                          }
                        }}
                        sx={{
                          color: '#c10007',
                          '&.Mui-checked': {
                            color: '#c10007',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.6,
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 'bold',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }}
                      >
                        I agree to these terms
                      </Typography>
                    }
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Step 3: Review & Confirm */}
        {activeStep === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="success">
              Review your bookings before confirming. Total: ₱
              {calculateTotalCost().toLocaleString()}
            </Alert>

            {carBookings.map((booking, index) => {
              const finalStartDate = booking.useCommonData
                ? commonData.startDate
                : booking.startDate;
              const finalEndDate = booking.useCommonData
                ? commonData.endDate
                : booking.endDate;
              const days =
                Math.floor(
                  (new Date(finalEndDate) - new Date(finalStartDate)) /
                    (1000 * 60 * 60 * 24)
                ) + 1;

              return (
                <Card
                  key={booking.car.car_id}
                  sx={{ border: '1px solid #e0e0e0' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box
                        component="img"
                        src={booking.car.car_img_url}
                        alt={`${booking.car.make} ${booking.car.model}`}
                        sx={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 1,
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {booking.car.make} {booking.car.model}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.car.year} • {booking.car.no_of_seat} seats •{' '}
                          {booking.car.license_plate}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {finalStartDate} to {finalEndDate} ({days} day
                          {days !== 1 ? 's' : ''})
                        </Typography>
                        <Typography variant="body2">
                          {booking.isSelfDrive
                            ? '🚗 Self-Drive'
                            : '👨‍💼 With Driver'}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          variant="h6"
                          sx={{ color: '#c10007', fontWeight: 'bold' }}
                        >
                          ₱{calculateCarCost(booking).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Base: ₱
                          {(days * booking.car.rent_price).toLocaleString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          Fees: ₱
                          {(
                            fees.reservation_fee +
                            fees.cleaning_fee +
                            (booking.isSelfDrive ? 0 : fees.driver_fee * days)
                          ).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}

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
                    Grand Total
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ color: '#c10007', fontWeight: 'bold' }}
                  >
                    ₱{calculateTotalCost().toLocaleString()}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        {activeStep === 0 ? (
          <>
            <Button onClick={onClose} sx={{ color: '#666' }}>
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<HiArrowRight />}
              sx={{
                backgroundColor: '#c10007',
                '&:hover': { backgroundColor: '#a50006' },
              }}
            >
              Next
            </Button>
          </>
        ) : activeStep === 1 || activeStep === 2 ? (
          <>
            <Button onClick={handleBack} startIcon={<HiArrowLeft />}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              variant="contained"
              endIcon={<HiArrowRight />}
              sx={{
                backgroundColor: '#c10007',
                '&:hover': { backgroundColor: '#a50006' },
              }}
            >
              {activeStep === 1 ? 'Continue' : 'Review'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleBack} startIcon={<HiArrowLeft />}>
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={loading}
              endIcon={loading ? <CircularProgress size={20} /> : <HiCheck />}
              sx={{
                backgroundColor: '#c10007',
                '&:hover': { backgroundColor: '#a50006' },
              }}
            >
              {loading
                ? 'Submitting...'
                : `Confirm ${carBookings.length} Bookings`}
            </Button>
          </>
        )}
      </DialogActions>

      <RegisterTermsAndConditionsModal
        open={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAgree={handleAgreeTerms}
        hidePersonalInfoSection={true}
      />
    </Dialog>
  );
}
