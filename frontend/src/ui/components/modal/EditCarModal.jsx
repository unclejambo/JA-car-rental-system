import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api.js';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { FaUpload } from 'react-icons/fa';

export default function EditCarModal({ show, onClose, car, onStatusChange }) {
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const { logout } = useAuth();
  const authenticatedFetch = useMemo(
    () => createAuthenticatedFetch(logout),
    [logout]
  );
  const API_BASE = getApiBase();

  useEffect(() => {
    if (car) {
      const raw = car.raw || car; // prefer backend data if provided
      setFormData({
        make: raw.make || car.make || '',
        model: raw.model || car.model || '',
        car_type: raw.car_type || car.car_type || '',
        year: raw.year ?? car.year ?? '',
        mileage: raw.mileage ?? car.mileage ?? '',
        no_of_seat: raw.no_of_seat ?? car.no_of_seat ?? '',
        rent_price: raw.rent_price ?? car.rent_price ?? '',
        license_plate: raw.license_plate || car.license_plate || '',
        car_img_url: raw.car_img_url || car.image || '',
        hasGPS: raw.hasGPS ?? car.hasGPS ?? false,
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!car) return;

    setLoading(true);
    setError(null);

    try {
      let payload;
      let headers = {};

      if (imageFile) {
        // Use FormData for file uploads
        payload = new FormData();
        Object.keys(formData).forEach((key) => {
          if (formData[key] !== null && formData[key] !== undefined) {
            payload.append(key, formData[key]);
          }
        });
        payload.append('image', imageFile);
      } else {
        // Use JSON for updates without file uploads
        payload = JSON.stringify(formData);
        headers['Content-Type'] = 'application/json';
      }

      const response = await authenticatedFetch(
        `${API_BASE}/cars/${car.car_id}`,
        {
          method: 'PUT',
          headers,
          body: payload,
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to update car');
      }

      const updatedCar = await response.json();
      onClose();
    } catch (error) {
      setError(
        error.message || 'Failed to update car. Please check your inputs.'
      );
    } finally {
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
      <DialogTitle>Edit Car</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form id="editCarForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              name="make"
              label="Make"
              value={formData.make || ''}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., Toyota"
            />

            <TextField
              name="model"
              label="Model"
              value={formData.model || ''}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., Camry"
            />

            <TextField
              name="car_type"
              label="Car Type"
              value={formData.car_type || ''}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., Sedan, SUV, Hatchback"
            />

            <TextField
              name="year"
              label="Year"
              type="number"
              value={formData.year || ''}
              onChange={handleChange}
              inputProps={{ min: 2000, max: new Date().getFullYear() + 1 }}
              fullWidth
              required
              placeholder="e.g., 2020"
            />

            <TextField
              name="mileage"
              label="Mileage (km)"
              type="number"
              value={formData.mileage || ''}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              fullWidth
              placeholder="e.g., 50000"
            />

            <TextField
              name="no_of_seat"
              label="Number of Seats"
              type="number"
              value={formData.no_of_seat || ''}
              onChange={handleChange}
              inputProps={{ min: 2, max: 20 }}
              fullWidth
              required
              placeholder="e.g., 5"
            />

            <TextField
              name="rent_price"
              label="Rent Price"
              type="number"
              value={formData.rent_price || ''}
              onChange={handleChange}
              inputProps={{ min: 0 }}
              fullWidth
              required
              placeholder="Daily rental price"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">₱</InputAdornment>
                ),
              }}
            />

            <TextField
              name="license_plate"
              label="License Plate"
              value={formData.license_plate || ''}
              onChange={handleChange}
              fullWidth
              required
              placeholder="e.g., ABC-123"
            />

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    name="hasGPS"
                    checked={formData.hasGPS || false}
                    onChange={handleToggle}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      GPS Tracking Enabled
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Enable if this vehicle has GPS tracking installed
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Car Image
              </Typography>
              <input
                ref={fileRef}
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<FaUpload />}
                onClick={() => fileRef.current?.click()}
                fullWidth
              >
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageFile && (
                <Box
                  sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {imageFile.name}
                  </Typography>
                  <Button
                    type="button"
                    onClick={() => setImageFile(null)}
                    color="error"
                    size="small"
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          </Stack>
        </form>
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
            form="editCarForm"
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Car'}
          </Button>
          <Button
            onClick={onClose}
            variant="outlined"
            color="error"
            disabled={loading}
            sx={{
              '&:hover': { backgroundColor: 'error.main', color: 'white' },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
