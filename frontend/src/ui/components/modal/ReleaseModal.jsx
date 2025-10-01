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
} from '@mui/material';

export default function ReleaseModal({ show, onClose }) {
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
    equipmentStatus: 'complete',
    equipmentDetails: '',
    paymentMethod: 'Cash',
    paymentAmount: '',
    paymentReference: '',
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: integrate with backend submission
    // Submit release form data
    onClose?.();
  };

  return (
    <Dialog open={!!show} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Release</DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="releaseForm"
          onSubmit={handleSubmit}
          spacing={3}
        >
          {/* Valid IDs */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Valid IDs
            </Typography>
            <Grid container spacing={1}>
              {['id1', 'id2'].map((id) => (
                <Grid item xs={6} key={id}>
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
                <Grid item xs={6} sm={3} key={key}>
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
              />
              <FormControlLabel
                value="damaged"
                control={<Radio />}
                label="Damaged"
              />
            </RadioGroup>
            {formData.equipmentStatus === 'damaged' && (
              <TextField
                name="equipmentDetails"
                label="Equipment Details"
                value={formData.equipmentDetails}
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
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
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
            <Grid item xs={12} sm={4}>
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
              <Grid item xs={12} sm={4}>
                <TextField
                  name="paymentReference"
                  label="Reference No."
                  value={formData.paymentReference}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  required
                />
              </Grid>
            )}
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          color="success"
          type="submit"
          form="releaseForm"
        >
          Release
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={onClose}
          sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
