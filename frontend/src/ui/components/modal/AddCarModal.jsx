import React, { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  Alert,
  InputAdornment,
} from '@mui/material';
import { useAuth } from '../../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../../utils/api.js';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

export default function AddCarModal({ show, onClose }) {
  const { logout } = useAuth();
  const authenticatedFetch = createAuthenticatedFetch(logout);
  const API_BASE = getApiBase();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    no_of_seat: '',
    rent_price: '',
    license_plate: '',
  });
  const [carImageFile, setCarImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Special handling for numeric fields
    if (
      name === 'no_of_seat' ||
      name === 'year' ||
      name === 'rent_price' ||
      name === 'mileage'
    ) {
      // If the input is empty, set it to empty string (to allow clearing the field)
      // Otherwise, convert to number
      const numericValue = value === '' ? '' : Number(value);
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setCarImageFile(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(
        'Unsupported file type. Please select a PNG, JPEG, or JPG image.'
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File exceeds 5MB limit.');
      return;
    }

    // Only store the File object
    setCarImageFile(file);
    setError('');
  };

  const removeFile = () => {
    setCarImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadCarImage = async (imageFile) => {
    const uploadFormData = new FormData();
    uploadFormData.append('image', imageFile);
    uploadFormData.append('make', formData.make);
    uploadFormData.append('model', formData.model);
    uploadFormData.append('licensePlate', formData.license_plate);

    console.log(
      'Uploading car image to:',
      `${API_BASE}/api/storage/car-images`
    );

    const response = await authenticatedFetch(
      `${API_BASE}/api/storage/car-images`,
      {
        method: 'POST',
        body: uploadFormData,
      }
    );

    const result = await response.json();
    console.log('Car image upload response:', result);

    if (!response.ok) {
      throw new Error(
        result.error || result.message || 'Failed to upload car image'
      );
    }

    return result.filePath || result.path || result.url || result.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let carImageUrl = 'default-car-image.jpg';

      // Upload car image first if one is selected
      if (carImageFile) {
        console.log('Uploading car image...');
        carImageUrl = await uploadCarImage(carImageFile);
        console.log('Car image uploaded, URL:', carImageUrl);
      }

      const carData = {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        license_plate: formData.license_plate,
        no_of_seat: parseInt(formData.no_of_seat) || 5, // Default to 5 seats if not provided
        rent_price: parseInt(formData.rent_price) || 0,
        car_status: 'Available', // Capitalized to match schema
        car_img_url: carImageUrl,
        mileage: formData.mileage !== '' ? parseInt(formData.mileage) : 0,
      };

      console.log('Creating car with data:', carData);

      const response = await authenticatedFetch(`${API_BASE}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create car');
      }

      console.log('Car created successfully');

      // Reset form and close modal
      setFormData({
        make: '',
        model: '',
        year: '',
        mileage: '',
        no_of_seat: '',
        rent_price: '',
        license_plate: '',
      });
      setCarImageFile(null);
      onClose();

      // Refresh the page to show the new car
      window.location.reload();
    } catch (err) {
      console.error('Error adding car:', err);
      setError(err.message || 'Failed to add car. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={!!show} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Car</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box
          component="form"
          id="addCarForm"
          onSubmit={handleSubmit}
          noValidate
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="make"
                label="Make"
                value={formData.make}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="model"
                label="Model"
                value={formData.model}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="year"
                label="Year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="mileage"
                label="Mileage"
                type="number"
                value={formData.mileage}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                fullWidth
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                name="no_of_seat"
                label="Seats"
                type="number"
                value={formData.no_of_seat}
                onChange={handleChange}
                inputProps={{ min: 1, max: 20 }}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="rent_price"
                label="Rent Price"
                type="number"
                value={formData.rent_price}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                fullWidth
                required
                size="small"
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
                value={formData.license_plate}
                onChange={handleChange}
                fullWidth
                required
                size="small"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Car Image
              </Typography>
              <input
                ref={fileInputRef}
                id="carImageUpload"
                type="file"
                accept={ALLOWED_FILE_TYPES.join(',')}
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<FaUpload />}
                onClick={() => fileInputRef.current?.click()}
                size="small"
              >
                {carImageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {carImageFile && (
                <Box
                  sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {carImageFile.name}
                  </Typography>
                  <Button
                    type="button"
                    onClick={removeFile}
                    color="error"
                    size="small"
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          type="submit"
          form="addCarForm"
          variant="contained"
          color="success"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="error"
          disabled={isLoading}
          sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
