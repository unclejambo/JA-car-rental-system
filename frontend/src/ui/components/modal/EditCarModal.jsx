import React, { useState, useEffect, useRef } from 'react';
import { useCarStore } from '../../../store/cars';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material';
import { FaUpload } from 'react-icons/fa';

export default function EditCarModal({ show, onClose, car, onStatusChange }) {
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef(null);
  const { updateCar } = useCarStore();

  useEffect(() => {
    if (car) {
      const raw = car.raw || car; // prefer backend data if provided
      setFormData({
        make: raw.make || car.make || '',
        model: raw.model || car.model || '',
        year: raw.year ?? car.year ?? '',
        mileage: raw.mileage ?? car.mileage ?? '',
        no_of_seat: raw.no_of_seat ?? car.no_of_seat ?? '',
        rent_price: raw.rent_price ?? car.rent_price ?? '',
        license_plate: raw.license_plate || car.license_plate || '',
        car_img_url: raw.car_img_url || car.image || '',
        car_status: raw.car_status || car.status || 'Available',
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'car_status') {
      onStatusChange?.(car, value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setImageFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!car) return;

    const payload = new FormData();
    Object.keys(formData).forEach((key) => {
      payload.append(key, formData[key]);
    });

    if (imageFile) {
      payload.append('image', imageFile);
    }

    try {
      await updateCar(car.car_id, payload);
      onClose();
    } catch (error) {
      console.error('Failed to update car:', error);
      alert('Failed to update car. Please check your inputs.');
    }
  };

  return (
    <Dialog open={!!show} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit Car</DialogTitle>
      <DialogContent dividers>
        <Box
          component="form"
          id="editCarForm"
          onSubmit={handleSubmit}
          noValidate
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="make"
                label="Make"
                value={formData.make || ''}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Model"
                value={formData.model || ''}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="year"
                label="Year"
                type="number"
                value={formData.year || ''}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="mileage"
                label="Mileage"
                type="number"
                value={formData.mileage || ''}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="no_of_seat"
                label="Seats"
                type="number"
                value={formData.no_of_seat || ''}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="rent_price"
                label="Rent Price"
                type="number"
                value={formData.rent_price || ''}
                onChange={handleChange}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₱</InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="license_plate"
                label="License Plate"
                value={formData.license_plate || ''}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Image
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
                size="small"
                startIcon={<FaUpload />}
                onClick={() => fileRef.current?.click()}
              >
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageFile && (
                <Typography variant="caption" sx={{ ml: 1 }}>
                  {imageFile.name}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          type="submit"
          form="editCarForm"
          variant="contained"
          color="success"
        >
          Save
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
