import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  FormLabel,
  Stack,
  Grid,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api';

export default function ReleaseModal({
  show,
  onClose,
  reservation,
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    images: {
      id1: { file: null, preview: '' },
      id2: { file: null, preview: '' },
      front: { file: null, preview: '' },
      back: { file: null, preview: '' },
      right: { file: null, preview: '' },
      left: { file: null, preview: '' },
    },
    license: false,
    gasLevel: 'High',
    equipmentStatus: 'complete',
    equip_others: '',
    paymentMethod: 'Cash',
    paymentAmount: '',
    gcash_no: '',
    reference_no: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get car name from reservation
  const carName = reservation?.car_model || 'Vehicle';

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, paymentAmount: digits }));
  };

  const blockNonNumericKeys = (e) => {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (e.ctrlKey || e.metaKey) return;
    if (!/^[0-9]$/.test(e.key) && !allowed.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleImageChange = (e, key) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData((prev) => ({
        ...prev,
        images: {
          ...prev.images,
          [key]: { file, preview: ev.target.result },
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!reservation) {
      setError('No reservation data available');
      setLoading(false);
      return;
    }

    // Basic validation
    if (formData.paymentAmount && Number(formData.paymentAmount) <= 0) {
      setError('Payment amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (formData.paymentMethod === 'GCash' && formData.paymentAmount) {
      if (!formData.gcash_no || !formData.reference_no) {
        setError(
          'GCash number and reference number are required for GCash payments'
        );
        setLoading(false);
        return;
      }
    }

    try {
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
      const API_BASE = getApiBase().replace(/\/$/, '');

      // Step 1: Create release record
      const releaseData = {
        booking_id: reservation.booking_id || reservation.id,
        drivers_id: reservation.drivers_id || 1, // Use driver ID from reservation or fallback to 1
        equipment: formData.equipmentStatus,
        equip_others:
          formData.equipmentStatus === 'no' ? formData.equip_others : null,
        gas_level: formData.gasLevel,
        license_presented: formData.license,
      };

      const releaseResponse = await authFetch(`${API_BASE}/releases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(releaseData),
      });

      if (!releaseResponse.ok) {
        throw new Error('Failed to create release record');
      }

      const releaseResult = await releaseResponse.json();
      const releaseId = releaseResult.release.release_id;

      // Step 2: Upload images
      const imageTypes = ['id1', 'id2', 'front', 'back', 'right', 'left'];
      const uploadPromises = [];

      console.log('Starting image uploads for release_id:', releaseId);

      for (const imageType of imageTypes) {
        const imageData = formData.images[imageType];
        if (imageData.file) {
          console.log(`Preparing to upload ${imageType} image:`, {
            fileName: imageData.file.name,
            fileSize: imageData.file.size,
            fileType: imageData.file.type,
          });

          const formDataUpload = new FormData();
          formDataUpload.append('image', imageData.file);
          formDataUpload.append('image_type', imageType);
          formDataUpload.append(
            'start_date',
            reservation.start_date || reservation.startDate
          );
          // Extract customer first name with better fallback handling
          let customerFirstName = 'customer'; // default fallback

          if (reservation.customer?.first_name) {
            customerFirstName = reservation.customer.first_name;
          } else if (reservation.customer_name) {
            // Extract first name from full name string
            const nameParts = reservation.customer_name.trim().split(' ');
            customerFirstName = nameParts[0] || 'customer';
          }

          // Sanitize filename (remove special characters, keep only alphanumeric)
          customerFirstName = customerFirstName.replace(/[^a-zA-Z0-9]/g, '');

          formDataUpload.append('customer_first_name', customerFirstName);

          console.log(
            `Uploading ${imageType} to: ${API_BASE}/releases/${releaseId}/images`
          );

          const uploadPromise = authFetch(
            `${API_BASE}/releases/${releaseId}/images`,
            {
              method: 'POST',
              body: formDataUpload,
            }
          );

          uploadPromises.push(uploadPromise);
        }
      }

      // Wait for all image uploads to complete
      console.log(
        `Waiting for ${uploadPromises.length} image uploads to complete...`
      );
      const uploadResults = await Promise.all(uploadPromises);
      console.log('All image uploads completed:', uploadResults.length);

      // Check if any uploads failed
      for (const result of uploadResults) {
        if (!result.ok) {
          const errorText = await result.text();
          console.error('Image upload failed:', errorText);
          throw new Error(`Failed to upload some images: ${errorText}`);
        } else {
          const uploadResult = await result.json();
          console.log('Image uploaded successfully:', uploadResult);
        }
      }

      // Step 3: Process payment
      if (formData.paymentAmount && Number(formData.paymentAmount) > 0) {
        const paymentData = {
          booking_id: reservation.booking_id || reservation.id,
          customer_id: reservation.customer_id || reservation.customerId,
          amount: Number(formData.paymentAmount),
          payment_method: formData.paymentMethod,
          gcash_no:
            formData.paymentMethod === 'GCash' ? formData.gcash_no : null,
          reference_no:
            formData.paymentMethod === 'GCash' ? formData.reference_no : null,
        };

        const paymentResponse = await authFetch(
          `${API_BASE}/release-payments`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymentData),
          }
        );

        if (!paymentResponse.ok) {
          throw new Error('Failed to process payment');
        }

        const paymentResult = await paymentResponse.json();
        console.log('Payment processed:', paymentResult);
      }

      setSuccess('Release processed successfully!');

      // Close modal after a short delay to show success message
      setTimeout(async () => {
        setLoading(false);
        onClose?.();
        // Refresh the table data instead of reloading the whole page
        if (onSuccess) {
          await onSuccess();
        }
      }, 1500);
    } catch (error) {
      console.error('Error processing release:', error);
      setError(error.message || 'Failed to process release');
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      disableScrollLock
    >
      <DialogTitle>
        Releasing of {carName}: {reservation?.plate_number || 'N/A'}
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <Stack
          component="form"
          id="releaseForm"
          onSubmit={handleSubmit}
          spacing={2}
        >
          {/* Valid IDs */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Valid IDs
            </Typography>
            <Grid container spacing={1}>
              {['id1', 'id2'].map((id) => (
                <Grid key={id}>
                  <Button
                    component="label"
                    variant={
                      formData.images[id].preview ? 'contained' : 'outlined'
                    }
                    color={formData.images[id].preview ? 'success' : 'primary'}
                    fullWidth
                    size="small"
                  >
                    {id.toUpperCase()}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, id)}
                    />
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* License */}
          <FormControlLabel
            control={
              <Checkbox
                name="license"
                checked={formData.license}
                onChange={handleInputChange}
              />
            }
            label="License Presented"
          />

          {/* Gas Level */}
          <Box>
            <FormLabel sx={{ fontWeight: 600 }}>Gas Level</FormLabel>
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
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      userSelect: 'none',
                      pointerEvents: 'none',
                    },
                  }}
                />
              ))}
            </RadioGroup>
          </Box>

          {/* Car Images */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Car Images
            </Typography>
            <Grid container spacing={1}>
              {[
                ['front', 'Front'],
                ['back', 'Back'],
                ['right', 'Right'],
                ['left', 'Left'],
              ].map(([key, label]) => (
                <Grid key={key}>
                  <Button
                    component="label"
                    variant={
                      formData.images[key].preview ? 'contained' : 'outlined'
                    }
                    color={formData.images[key].preview ? 'success' : 'primary'}
                    fullWidth
                    size="small"
                  >
                    {label}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, key)}
                    />
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Equipment Status */}
          <Box>
            <FormLabel sx={{ fontWeight: 600 }}>Equipment</FormLabel>
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

          {/* Payment */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Remaining Balance: ₱
              {(reservation?.balance || 0).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid>
              <TextField
                select
                name="paymentMethod"
                label="Payment Method"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                fullWidth
                size="small"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="GCash">GCash</MenuItem>
              </TextField>
            </Grid>
            <Grid>
              <TextField
                name="paymentAmount"
                label="Amount"
                value={formData.paymentAmount}
                onChange={handleAmountChange}
                onKeyDown={blockNonNumericKeys}
                fullWidth
                size="small"
                inputMode="numeric"
                placeholder="Amount"
                required
              />
            </Grid>
            {formData.paymentMethod === 'GCash' && (
              <Box display={'flex'} flexDirection="column" width="100%" gap={1}>
                <TextField
                  name="gcash_no"
                  label="GCash No."
                  value={formData.gcash_no}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  required
                />
                <TextField
                  name="reference_no"
                  label="Reference No."
                  value={formData.reference_no}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  required
                />
              </Box>
            )}
          </Grid>
        </Stack>
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
            variant="contained"
            color="success"
            type="submit"
            form="releaseForm"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Processing...' : 'Release'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onClose}
            disabled={loading}
            sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
