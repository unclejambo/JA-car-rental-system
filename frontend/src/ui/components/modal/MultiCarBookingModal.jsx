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
  const [fees, setFees] = useState({
    reservation_fee: 1000,
    cleaning_fee: 200,
    driver_fee: 500,
  });

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
  });

  // Individual car bookings with ability to override common data
  const [carBookings, setCarBookings] = useState([]);

  const steps = ['Common Details', 'Individual Cars', 'Review & Confirm'];

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
      }));
      setCarBookings(initialBookings);
      fetchDrivers();
      fetchFees();
      setError('');
      setActiveStep(0);
      setExpandedCar(0);
    }
  }, [open, cars]);

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

  const handleCommonDataChange = (field, value) => {
    setCommonData((prev) => ({ ...prev, [field]: value }));
    // Update all cars that use common data
    setCarBookings((prev) =>
      prev.map((booking) =>
        booking.useCommonData ? { ...booking, [field]: value } : booking
      )
    );
  };

  const handleCarDataChange = (index, field, value) => {
    setCarBookings((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
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
        }),
      };
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
    return errors;
  };

  const validateIndividualBookings = () => {
    const errors = [];
    carBookings.forEach((booking, index) => {
      if (!booking.useCommonData) {
        if (!booking.startDate)
          errors.push(`Car ${index + 1}: Start date is required`);
        if (!booking.endDate)
          errors.push(`Car ${index + 1}: End date is required`);
        if (!booking.purpose)
          errors.push(`Car ${index + 1}: Purpose is required`);
      }
      if (!booking.isSelfDrive && !booking.selectedDriver) {
        errors.push(`Car ${index + 1}: Please select a driver`);
      }
    });
    return errors;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const errors = validateCommonData();
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }
    } else if (activeStep === 1) {
      const errors = validateIndividualBookings();
      if (errors.length > 0) {
        setError(errors.join('. '));
        return;
      }
    }
    setError('');
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
          deliveryType: booking.deliveryType,
          deliveryLocation:
            booking.deliveryType === 'delivery'
              ? booking.deliveryLocation
              : null,
          pickupLocation:
            booking.deliveryType === 'pickup'
              ? 'JA Car Rental Office - 123 Main Street, Business District, City'
              : null,
          dropoffLocation: booking.dropoffLocation,
          selectedDriver: booking.isSelfDrive ? null : booking.selectedDriver,
          totalCost: calculateCarCost(booking),
          isSelfDrive: booking.isSelfDrive,
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
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#c10007' }}>
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
                    {booking.useCommonData && (
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                    {!booking.useCommonData && (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                          <TextField
                            fullWidth
                            type="date"
                            label="Start Date"
                            value={booking.startDate}
                            onChange={(e) =>
                              handleCarDataChange(index, 'startDate', e.target.value)
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
                              handleCarDataChange(index, 'endDate', e.target.value)
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
                              handleCarDataChange(index, 'pickupTime', e.target.value)
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
                              handleCarDataChange(index, 'dropoffTime', e.target.value)
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
                                handleCarDataChange(index, 'purpose', e.target.value)
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
                      </Grid>
                    )}

                    <Divider />

                    {/* Driver Selection */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={booking.isSelfDrive}
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
                      label="Self-Drive"
                    />

                    {!booking.isSelfDrive && (
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
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Step 2: Review & Confirm */}
        {activeStep === 2 && (
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
                <Card key={booking.car.car_id} sx={{ border: '1px solid #e0e0e0' }}>
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
                          {booking.isSelfDrive ? '🚗 Self-Drive' : '👨‍💼 With Driver'}
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
                          Base: ₱{(days * booking.car.rent_price).toLocaleString()}
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

            <Card sx={{ backgroundColor: '#f0f8ff', border: '2px solid #c10007' }}>
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
        ) : activeStep === 1 ? (
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
              Review
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
              {loading ? 'Submitting...' : `Confirm ${carBookings.length} Bookings`}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
