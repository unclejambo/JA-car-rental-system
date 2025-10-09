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

  // Debug: Log when releaseData changes
  useEffect(() => {
    console.log('releaseData updated:', releaseData);
  }, [releaseData]);
  const [calculatedFees, setCalculatedFees] = useState({
    gasLevelFee: 0,
    equipmentLossFee: 0,
    damageFee: 0,
    cleaningFee: 0,
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
            console.log('Release data found:', release);
            console.log('Image URLs:', {
              front_img: release.front_img,
              back_img: release.back_img,
              right_img: release.right_img,
              left_img: release.left_img,
            });

            setReleaseData({
              gas_level: release.gas_level,
              equip_others: release.equip_others,
              front_img: release.front_img,
              back_img: release.back_img,
              right_img: release.right_img,
              left_img: release.left_img,
            });
          }
        } catch (err) {
          setError('Failed to load return data');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [show, bookingId]);

  // Calculate fees whenever form data changes
  useEffect(() => {
    const calculateFeesAsync = async () => {
      if (bookingId && releaseData) {
        try {
          const response = await returnAPI.calculateFees(bookingId, {
            gasLevel: formData.gasLevel,
            damageStatus: formData.damageStatus,
            equipmentStatus: formData.equipmentStatus,
            equip_others: formData.equip_others,
            isClean: formData.isClean,
            hasStain: formData.hasStain,
          });
          setCalculatedFees(response.fees);
        } catch (err) {
          console.error('Failed to calculate fees:', err);
        }
      }
    };
    calculateFeesAsync();
  }, [
    bookingId,
    formData.gasLevel,
    formData.damageStatus,
    formData.equipmentStatus,
    formData.equip_others,
    formData.isClean,
    formData.hasStain,
    releaseData,
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
      setShowDamageUpload(value === 'major' || value === 'minor');
    }
  };

  const handleImageClick = (imageSrc) => {
    setSelectedImage(imageSrc);
    setShowImageViewer(true);
  };

  const handleDamageImageUpload = async (file) => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('damageImage', file);
      formDataUpload.append('damageType', formData.damageStatus);

      await returnAPI.uploadDamageImage(bookingId, formDataUpload);
      setSuccess('Damage image uploaded successfully');
    } catch (err) {
      setError('Failed to upload damage image');
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (total > 0) {
      setShowPaymentForm(true);
      return;
    }

    await submitReturn();
  };

  const submitReturn = async (directPayment = false) => {
    try {
      setLoading(true);

      const submitData = {
        ...formData,
        totalFees: total,
        paymentData: directPayment ? paymentData : null,
      };

      await returnAPI.submitReturn(bookingId, submitData);

      setSuccess('Return submitted successfully');
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      setError('Failed to submit return');
      console.error(err);
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
    { label: 'Cleaning Fee', amount: calculatedFees.cleaningFee },
    { label: 'Stain Removal Fee', amount: calculatedFees.stainRemovalFee },
  ].filter((fee) => fee.amount > 0);

  const total = calculatedFees.total;

  const currency = (v) =>
    `₱ ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <>
      <Dialog
        open={!!show}
        onClose={onClose}
        fullWidth
        maxWidth={isMobile ? 'sm' : 'md'}
        disableScrollLock
      >
        <DialogTitle>Return</DialogTitle>
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
                      Release level: {releaseData?.gas_level || 'N/A'}
                    </Typography>
                    <RadioGroup
                      row
                      name="gasLevel"
                      value={formData.gasLevel}
                      onChange={handleInputChange}
                    >
                      {['High', 'Mid', 'Low'].map((g) => (
                        <FormControlLabel
                          key={g}
                          value={g}
                          control={<Radio />}
                          label={g}
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
                                cursor: 'pointer',
                                border: '1px solid #ddd',
                                borderRadius: 1,
                                overflow: 'hidden',
                                position: 'relative',
                                bgcolor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              onClick={() =>
                                handleImageClick(releaseData[imgKey])
                              }
                            >
                              {releaseData[imgKey] &&
                              releaseData[imgKey].trim() !== '' ? (
                                <img
                                  src={releaseData[imgKey]}
                                  alt={imgKey.replace('_', ' ')}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                  }}
                                  onLoad={() =>
                                    console.log(
                                      `${imgKey} loaded successfully from:`,
                                      releaseData[imgKey]
                                    )
                                  }
                                  onError={(e) => {
                                    console.error(
                                      `Failed to load ${imgKey}:`,
                                      releaseData[imgKey]
                                    );
                                    console.error('Image error:', e);
                                    // Try to show a broken image indicator
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display =
                                      'block';
                                  }}
                                />
                              ) : null}
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 8,
                                  color: 'text.secondary',
                                  display:
                                    releaseData[imgKey] &&
                                    releaseData[imgKey].trim() !== ''
                                      ? 'none'
                                      : 'block',
                                  textAlign: 'center',
                                }}
                              >
                                {releaseData[imgKey] ? 'Error' : 'No Image'}
                              </Typography>
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
                    >
                      <FormControlLabel
                        value="noDamage"
                        control={<Radio />}
                        label="No Damages"
                      />
                      <FormControlLabel
                        value="major"
                        control={<Radio />}
                        label="Major"
                      />
                      <FormControlLabel
                        value="minor"
                        control={<Radio />}
                        label="Minor"
                      />
                    </RadioGroup>

                    {/* Damage Image Upload */}
                    {showDamageUpload && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{ display: 'block', mb: 1 }}
                        >
                          Upload damage image:
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
                        Release equipment: {releaseData.equip_others}
                      </Typography>
                    )}
                    <RadioGroup
                      row
                      name="equipmentStatus"
                      value={formData.equipmentStatus}
                      onChange={handleInputChange}
                    >
                      <FormControlLabel
                        value="complete"
                        control={<Radio />}
                        label="Complete"
                      />
                      <FormControlLabel
                        value="no"
                        control={<Radio />}
                        label="No"
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
                    >
                      <FormControlLabel
                        value={true}
                        control={<Radio />}
                        label="Yes"
                      />
                      <FormControlLabel
                        value={false}
                        control={<Radio />}
                        label="No"
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
                                />
                              }
                              label="Stain"
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
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {currency(f.amount)}
                        </Typography>
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
            >
              <FormControlLabel value="Cash" control={<Radio />} label="Cash" />
              <FormControlLabel
                value="GCash"
                control={<Radio />}
                label="GCash"
              />
              <FormControlLabel
                value="Bank Transfer"
                control={<Radio />}
                label="Bank Transfer"
              />
            </RadioGroup>

            {(paymentData.payment_method === 'GCash' ||
              paymentData.payment_method === 'Bank Transfer') && (
              <>
                <TextField
                  name="gcash_no"
                  label={
                    paymentData.payment_method === 'GCash'
                      ? 'GCash Number'
                      : 'Account Number'
                  }
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
