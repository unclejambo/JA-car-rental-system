import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Stack,
  Box,
  Typography,
  useMediaQuery,
  Divider,
  Checkbox,
  FormGroup,
  Modal,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { returnAPI } from '../../../utils/api';

export default function ReturnModal({ show, onClose, bookingId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFees, setShowFees] = useState(!isMobile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [showDamageUpload, setShowDamageUpload] = useState(false);
  const [damageImageFile, setDamageImageFile] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const [formData, setFormData] = useState({
    gasLevel: 'High',
    odometer: '',
    damageStatus: 'noDamage',
    equipmentStatus: 'complete',
    equip_others: '',
    isClean: true,
    hasStain: false,
  });

  const [releaseData, setReleaseData] = useState(null);
  const [bookingData, setBookingData] = useState(null); // Store full booking data for customer info
  const [overdueHours, setOverdueHours] = useState(0);
  const [showOverdueFeeCancel, setShowOverdueFeeCancel] = useState(false);

  // Debug: Log when releaseData changes
  useEffect(() => {}, [releaseData]);
  const [calculatedFees, setCalculatedFees] = useState({
    gasLevelFee: 0,
    equipmentLossFee: 0,
    damageFee: 0,
    cleaningFee: 0,
    overdueFee: 0,
    total: 0,
  });

  const [paymentData, setPaymentData] = useState({
    payment_method: 'Cash',
    gcash_no: '',
    reference_no: '',
  });

  // Load return data and calculate fees when modal opens
  useEffect(() => {
    const loadData = async () => {
      if (show && bookingId) {
        try {
          setLoading(true);
          const response = await returnAPI.getReturnData(bookingId);
          // Extract release data from the response structure
          if (
            response.booking &&
            response.booking.releases &&
            response.booking.releases.length > 0
          ) {
            const release = response.booking.releases[0];

            // Debug: Log release data and image URLs

            setReleaseData({
              gas_level: release.gas_level,
              equip_others: release.equip_others,
              front_img: release.front_img,
              back_img: release.back_img,
              right_img: release.right_img,
              left_img: release.left_img,
            });

            // Store booking data for customer info
            setBookingData(response.booking);

            // Calculate overdue hours (PH timezone)
            const phTimeZone = 'Asia/Manila';
            const now = new Date().toLocaleString('en-US', {
              timeZone: phTimeZone,
            });
            const currentTimePH = new Date(now);

            const dropoffTime = new Date(
              response.booking.dropoff_time || response.booking.end_date
            );

            // Calculate the difference in milliseconds
            const timeDiff = currentTimePH - dropoffTime;
            const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));

            if (hoursDiff > 0) {
              setOverdueHours(hoursDiff);
            } else {
              setOverdueHours(0);
            }
          }
        } catch (err) {
          setError('Failed to load return data');
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [show, bookingId]);

  // Calculate fees whenever form data changes (with debouncing)
  useEffect(() => {
    // Debounce the API call to prevent excessive requests
    const timeoutId = setTimeout(() => {
      const calculateFeesAsync = async () => {
        if (bookingId && releaseData && bookingData) {
          try {
            const response = await returnAPI.calculateFees(bookingId, {
              gasLevel: formData.gasLevel,
              damageStatus: formData.damageStatus,
              equipmentStatus: formData.equipmentStatus,
              equip_others: formData.equip_others,
              isClean: formData.isClean,
              hasStain: formData.hasStain,
              overdueHours: showOverdueFeeCancel ? 0 : overdueHours,
            });
            setCalculatedFees(response.fees);
          } catch (err) {}
        }
      };
      calculateFeesAsync();
    }, 300); // 300ms debounce

    // Cleanup function to cancel the timeout if dependencies change
    return () => clearTimeout(timeoutId);
  }, [
    bookingId,
    formData.gasLevel,
    formData.damageStatus,
    formData.equipmentStatus,
    formData.equip_others,
    formData.isClean,
    formData.hasStain,
    releaseData,
    bookingData,
    overdueHours,
    showOverdueFeeCancel,
  ]);

  // Handler functions
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    let processedValue = value;

    // Handle different input types
    if (type === 'checkbox') {
      processedValue = checked;
    } else if (name === 'isClean') {
      // Convert string boolean to actual boolean for isClean
      processedValue = value === 'true';
    } else {
      processedValue = value;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Show damage upload when major/minor is selected
    if (name === 'damageStatus') {
      const shouldShowUpload = value === 'major' || value === 'minor';
      setShowDamageUpload(shouldShowUpload);

      // Clear damage image when switching to "No Damages"
      if (value === 'noDamage') {
        setDamageImageFile(null);
      }
    }
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setShowImageViewer(true);
  };

  const handleDamageImageUpload = async (file) => {
    // Just store the file locally, don't upload yet
    setDamageImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate damage image is selected for major/minor damages
    if (
      (formData.damageStatus === 'major' ||
        formData.damageStatus === 'minor') &&
      !damageImageFile
    ) {
      setError('Please upload a damage image before submitting');
      return;
    }

    if (total > 0) {
      setShowPaymentForm(true);
      return;
    }

    await submitReturn();
  };

  const submitReturn = async (directPayment = false) => {
    try {
      setLoading(true);

      // If there's a damage image file, upload it first
      let uploadedImageUrl = null;
      if (damageImageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('damageImage', damageImageFile);
        formDataUpload.append(
          'damageType',
          formData.damageStatus === 'minorDamage' ? 'minor' : 'major'
        );

        const uploadResponse = await returnAPI.uploadDamageImage(
          bookingId,
          formDataUpload
        );
        uploadedImageUrl = uploadResponse.imagePath;
      }

      const submitData = {
        ...formData,
        totalFees: total,
        paymentData: directPayment ? paymentData : null,
        damageImageUrl: uploadedImageUrl || null,
        overdueHours: showOverdueFeeCancel ? 0 : overdueHours,
      };

      await returnAPI.submitReturn(bookingId, submitData);

      setSuccess('Return submitted successfully');
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError('Failed to submit return');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    await submitReturn(true);
    setShowPaymentForm(false);
  };

  // Dynamic fee data based on calculations
  const fees = [
    { label: 'Gas Level Fee', amount: calculatedFees.gasLevelFee },
    { label: 'Equipment Loss Fee', amount: calculatedFees.equipmentLossFee },
    { label: 'Damage Fee', amount: calculatedFees.damageFee },
    {
      label: 'Cleaning Fee (Deduction)',
      amount: calculatedFees.cleaningFee,
      isDeduction: true,
    },
    { label: 'Stain Removal Fee', amount: calculatedFees.stainRemovalFee },
    {
      label: 'Overdue Fee',
      amount: calculatedFees.overdueFee,
      showCancel: true,
      hours: overdueHours,
    },
  ].filter((fee) => fee.amount !== 0); // Show both positive and negative amounts

  const total = calculatedFees.total;

  const currency = (v, isDeduction = false) => {
    const absValue = Math.abs(v);
    const formatted = absValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    // For deductions (negative values), show with minus sign
    if (isDeduction || v < 0) {
      return `- ₱ ${formatted}`;
    }
    return `₱ ${formatted}`;
  };

  // Get car name for title
  const carName = bookingData?.car
    ? `${bookingData.car.make} ${bookingData.car.model}`
    : 'Vehicle';

  const carPlateNumber = bookingData?.car
    ? `${bookingData.car.license_plate}`
    : 'N/A';

  return (
    <>
      <Dialog
        open={!!show}
        onClose={onClose}
        fullWidth
        maxWidth={isMobile ? 'sm' : 'md'}
        disableScrollLock
      >
        <DialogTitle>
          Returning of {carName}: {carPlateNumber}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {error && (
            <Alert severity="error" sx={{ m: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ m: 2 }}>
              {success}
            </Alert>
          )}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack
              direction={isMobile ? 'column' : 'row'}
              sx={{ minHeight: 320 }}
            >
              {/* Form side */}
              <Box sx={{ flex: 1, p: 2 }}>
                <Stack
                  id="returnForm"
                  component="form"
                  spacing={2}
                  onSubmit={handleSubmit}
                >
                  {/* Gas Level */}
                  <Box>
                    <FormLabel sx={{ fontWeight: 600 }}>Gas Level</FormLabel>
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', color: 'text.secondary' }}
                    >
                      Gas level (Before): {releaseData?.gas_level || 'N/A'}
                    </Typography>
                    <RadioGroup
                      row
                      name="gasLevel"
                      value={formData.gasLevel}
                      onChange={handleInputChange}
                      sx={{ display: 'flex', gap: 1 }}
                    >
                      {['High', 'Mid', 'Low'].map((g) => (
                        <FormControlLabel
                          key={g}
                          value={g}
                          control={<Radio />}
                          label={g}
                          sx={{
                            '& .MuiFormControlLabel-label': {
                              userSelect: 'none',
                              pointerEvents: 'none', // Label won't capture clicks
                            },
                          }}
                        />
                      ))}
                    </RadioGroup>
                  </Box>

                  {/* Odometer */}
                  <TextField
                    name="odometer"
                    label="Odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    required
                    size="small"
                    inputMode="numeric"
                  />

                  {/* Damage Check */}
                  <Box>
                    <FormLabel sx={{ fontWeight: 600 }}>Damage Check</FormLabel>

                    {/* Release Images */}
                    {releaseData && (
                      <Box sx={{ mt: 1, mb: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mb: 1 }}
                        >
                          Release Images (click to zoom):
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ flexWrap: 'wrap' }}
                        >
                          {[
                            'front_img',
                            'back_img',
                            'right_img',
                            'left_img',
                          ].map((imgKey) => (
                            <Box
                              key={imgKey}
                              sx={{
                                width: { xs: 50, sm: 80 },
                                height: { xs: 50, sm: 80 },
                                cursor: releaseData[imgKey] && releaseData[imgKey].trim() !== '' ? 'pointer' : 'default',
                                border: '1px solid #ddd',
                                borderRadius: 1,
                                overflow: 'hidden',
                                position: 'relative',
                                bgcolor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onClick={() => {
                                if (releaseData[imgKey] && releaseData[imgKey].trim() !== '') {
                                  handleImageClick(releaseData[imgKey]);
                                }
                              }}
                            >
                              {releaseData[imgKey] && releaseData[imgKey].trim() !== '' ? (
                                <img
                                  src={releaseData[imgKey]}
                                  alt={imgKey.replace('_', ' ')}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                />
                              ) : (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: 8,
                                    color: 'text.secondary',
                                    textAlign: 'center',
                                  }}
                                >
                                  No Image
                                </Typography>
                              )}
                              {releaseData[imgKey] && releaseData[imgKey].trim() !== '' && (
                                <ZoomInIcon
                                  sx={{
                                    position: 'absolute',
                                    top: 2,
                                    right: 2,
                                    fontSize: 12,
                                    color: 'white',
                                    textShadow: '1px 1px 1px black',
                                  }}
                                />
                              )}
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Show message when no release data */}
                    {!releaseData && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mb: 1,
                          color: 'warning.main',
                          fontStyle: 'italic',
                        }}
                      >
                        No release data available. Please ensure the car has
                        been released first.
                      </Typography>
                    )}

                    <RadioGroup
                      row
                      name="damageStatus"
                      value={formData.damageStatus}
                      onChange={handleInputChange}
                      sx={{ display: 'flex', gap: 1 }}
                    >
                      <FormControlLabel
                        value="noDamage"
                        control={<Radio />}
                        label="No Damages"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                      <FormControlLabel
                        value="major"
                        control={<Radio />}
                        label="Major"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                      <FormControlLabel
                        value="minor"
                        control={<Radio />}
                        label="Minor"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                    </RadioGroup>

                    {/* Damage Image Upload */}
                    {showDamageUpload && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mb: 1 }}
                        >
                          Upload damage image:{' '}
                          {damageImageFile && '✅ Selected'}
                        </Typography>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setDamageImageFile(file);
                              handleDamageImageUpload(file);
                            }
                          }}
                        />
                        {damageImageFile && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 0.5,
                              color: 'success.main',
                            }}
                          >
                            Image selected: {damageImageFile.name}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Equipment Check */}
                  <Box>
                    <FormLabel sx={{ fontWeight: 600 }}>
                      Equipment Check
                    </FormLabel>
                    {releaseData?.equip_others && (
                      <Typography
                        variant="caption"
                        sx={{ display: 'block', color: 'text.secondary' }}
                      >
                        Missing/Damaged equipment (Before):{' '}
                        {releaseData.equip_others}
                      </Typography>
                    )}
                    <RadioGroup
                      row
                      name="equipmentStatus"
                      value={formData.equipmentStatus}
                      onChange={handleInputChange}
                      sx={{ display: 'flex', gap: 1 }}
                    >
                      <FormControlLabel
                        value="complete"
                        control={<Radio />}
                        label="Complete"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio />}
                        label="No"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                    </RadioGroup>
                    {formData.equipmentStatus === 'no' && (
                      <TextField
                        name="equip_others"
                        label="Equipment Details"
                        value={formData.equip_others}
                        onChange={handleInputChange}
                        fullWidth
                        multiline
                        minRows={2}
                        required
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>

                  {/* Clean Check */}
                  <Box>
                    <FormLabel sx={{ fontWeight: 600 }}>Clean</FormLabel>
                    <RadioGroup
                      row
                      name="isClean"
                      value={formData.isClean}
                      onChange={handleInputChange}
                      sx={{ display: 'flex', gap: 1 }}
                    >
                      <FormControlLabel
                        value={true}
                        control={<Radio />}
                        label="Yes"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                      <FormControlLabel
                        value={false}
                        control={<Radio />}
                        label="No"
                        sx={{
                          '& .MuiFormControlLabel-label': {
                            userSelect: 'none',
                            pointerEvents: 'none',
                          },
                        }}
                      />
                      {!formData.isClean && (
                        <Box>
                          <FormGroup>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  name="hasStain"
                                  checked={formData.hasStain}
                                  onChange={handleInputChange}
                                  sx={{ display: 'flex', gap: 1 }}
                                />
                              }
                              label="Stain"
                              sx={{
                                '& .MuiFormControlLabel-label': {
                                  userSelect: 'none',
                                  pointerEvents: 'none',
                                },
                              }}
                            />
                          </FormGroup>
                        </Box>
                      )}
                    </RadioGroup>
                  </Box>

                  {isMobile && (
                    <Box sx={{ mt: 1 }}>
                      <Divider sx={{ my: 1 }} />
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 0.5 }}
                      >
                        Fees Total
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowFees(true)}
                        fullWidth
                      >
                        {currency(total)} (tap to view breakdown)
                      </Button>
                    </Box>
                  )}
                </Stack>
              </Box>

              {/* Fees side (persistent on desktop, conditional overlay on mobile) */}
              {(!isMobile || (isMobile && showFees)) && (
                <Box
                  sx={{
                    width: { xs: '100%', sm: 300 },
                    borderLeft: { sm: '1px solid #eee' },
                    borderTop: { xs: '1px solid #eee', sm: 'none' },
                    p: 2,
                    bgcolor: '#fafafa',
                    position: isMobile ? 'absolute' : 'relative',
                    top: 0,
                    left: 0,
                    height: isMobile ? '100%' : 'auto',
                    zIndex: 10,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    boxSizing: 'border-box',
                  }}
                >
                  {isMobile && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setShowFees(false)}
                      sx={{ mb: 1 }}
                    >
                      Close Fees
                    </Button>
                  )}
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Fees
                  </Typography>
                  <Stack spacing={1}>
                    {fees.map((f) => (
                      <Box
                        key={f.label}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: 1,
                          minWidth: 0, // Allow shrinking
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            flex: 1,
                            wordBreak: 'break-word',
                            minWidth: 0,
                          }}
                        >
                          {f.label}
                          {f.showCancel && f.hours > 0 && (
                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                color: 'text.secondary',
                                fontSize: '0.7rem',
                              }}
                            >
                              ({f.hours} hour{f.hours > 1 ? 's' : ''} overdue)
                            </Typography>
                          )}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              flexShrink: 0,
                              whiteSpace: 'nowrap',
                              color:
                                f.isDeduction || f.amount < 0
                                  ? 'success.main'
                                  : 'inherit',
                              fontWeight:
                                f.isDeduction || f.amount < 0 ? 600 : 400,
                            }}
                          >
                            {currency(f.amount, f.isDeduction)}
                          </Typography>
                          {f.showCancel &&
                            f.amount > 0 &&
                            !showOverdueFeeCancel && (
                              <Button
                                size="small"
                                variant="text"
                                color="error"
                                onClick={() => setShowOverdueFeeCancel(true)}
                                sx={{
                                  minWidth: 'auto',
                                  padding: '2px 4px',
                                  fontSize: '0.7rem',
                                }}
                              >
                                Cancel
                              </Button>
                            )}
                          {f.showCancel && showOverdueFeeCancel && (
                            <Button
                              size="small"
                              variant="text"
                              color="success"
                              onClick={() => setShowOverdueFeeCancel(false)}
                              sx={{
                                minWidth: 'auto',
                                padding: '2px 4px',
                                fontSize: '0.7rem',
                              }}
                            >
                              Restore
                            </Button>
                          )}
                        </Box>
                      </Box>
                    ))}
                    <Divider />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        Total
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          flexShrink: 0,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {currency(total)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3 }}>
          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 1,
            }}
          >
            <Button
              type="submit"
              form="returnForm"
              variant="contained"
              color="success"
              disabled={loading}
            >
              Return
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={onClose}
              sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
            >
              Cancel
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Image Viewer Modal */}
      <Modal
        open={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              zIndex: 1,
            }}
            onClick={() => setShowImageViewer(false)}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Damage preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
        </Box>
      </Modal>

      {/* Payment Form Modal */}
      <Dialog
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Payment for Return Fees</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handlePaymentSubmit} sx={{ mt: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Total Amount: {currency(total)}
            </Typography>

            <FormLabel sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Payment Method
            </FormLabel>
            <RadioGroup
              name="payment_method"
              value={paymentData.payment_method}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  payment_method: e.target.value,
                }))
              }
              sx={{ display: 'flex', gap: 1 }}
            >
              <FormControlLabel
                value="Cash"
                control={<Radio />}
                label="Cash"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    userSelect: 'none',
                    pointerEvents: 'none',
                  },
                }}
              />
              <FormControlLabel
                value="GCash"
                control={<Radio />}
                label="GCash"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    userSelect: 'none',
                    pointerEvents: 'none',
                  },
                }}
              />
              {/* <FormControlLabel value="Cash" control={<Radio />}>
                Cash
              </FormControlLabel>
              <FormControlLabel value="GCash" control={<Radio />}>
                GCash
              </FormControlLabel> */}
            </RadioGroup>

            {paymentData.payment_method === 'GCash' && (
              <>
                <TextField
                  name="gcash_no"
                  label={'GCash Number'}
                  value={paymentData.gcash_no}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      gcash_no: e.target.value,
                    }))
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  name="reference_no"
                  label="Reference Number"
                  value={paymentData.reference_no}
                  onChange={(e) =>
                    setPaymentData((prev) => ({
                      ...prev,
                      reference_no: e.target.value,
                    }))
                  }
                  fullWidth
                  margin="normal"
                  required
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPaymentForm(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            disabled={loading}
          >
            Pay & Submit Return
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
