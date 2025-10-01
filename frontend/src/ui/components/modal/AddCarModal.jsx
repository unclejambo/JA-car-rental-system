import { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
      setError('Unsupported file type. Please select a PNG, JPEG, or JPG image.');
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

    console.log('Uploading car image to:', `${API_BASE}/api/storage/car-images`);

    const response = await authenticatedFetch(`${API_BASE}/api/storage/car-images`, {
      method: 'POST',
      body: uploadFormData,
    });

    const result = await response.json();
    console.log('Car image upload response:', result);

    if (!response.ok) {
      throw new Error(result.error || result.message || 'Failed to upload car image');
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
    <>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              ADD CAR
            </h1>

            {error && <div className="error-message" style={{
              fontSize: '0.875rem', 
              color: '#DC2626', 
              backgroundColor: '#FEF2F2', 
              padding: '12px', 
              borderRadius: '4px', 
              border: '1px solid #FECACA',
              marginBottom: '16px'
            }}>{error}</div>}

            <div className="field-row">
              <label className="field-label font-pathway">Make</label>
              <input
                className="font-pathway"
                name="make"
                value={formData.make}
                onChange={handleChange}
                placeholder="Make"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Model</label>
              <input
                className="font-pathway"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Model"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Year</label>
              <input
                className="font-pathway"
                name="year"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={handleChange}
                placeholder="Year"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Mileage</label>
              <input
                className="font-pathway"
                name="mileage"
                type="number"
                min="0"
                value={formData.mileage}
                onChange={handleChange}
                placeholder="Mileage"
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Seats</label>
              <input
                className="font-pathway"
                name="no_of_seat"
                type="number"
                min="1"
                max="20"
                value={formData.no_of_seat}
                onChange={handleChange}
                placeholder="Seats"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Rent Price</label>
              <input
                className="font-pathway"
                name="rent_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.rent_price}
                onChange={handleChange}
                placeholder="Rent Price"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">License Plate</label>
              <input
                className="font-pathway"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="License Plate"
                required
              />
            </div>
            
            {/* Car Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: '600', mb: 1 }}>
                CAR IMAGE
              </Typography>
              <Box>
                <input
                  ref={fileInputRef}
                  id="carImageUpload"
                  name="file"
                  type="file"
                  onChange={handleFileChange}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  component="label"
                  htmlFor="carImageUpload"
                  startIcon={<FaUpload />}
                  sx={{
                    backgroundColor: 'rgba(229, 231, 235, 0.8)',
                    borderColor: 'rgba(156, 163, 175, 0.5)',
                    color: 'rgba(75, 85, 99, 1)',
                    '&:hover': {
                      backgroundColor: 'rgba(209, 213, 219, 0.8)',
                      borderColor: 'rgba(156, 163, 175, 0.8)',
                    },
                  }}>
                  {carImageFile ? 'Change Image' : 'Upload Car Image'}
                </Button>
                
                {carImageFile && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'rgba(75, 85, 99, 1)', flex: 1 }}>
                      {carImageFile.name}
                    </Typography>
                    <Button
                      type="button"
                      onClick={removeFile}
                      variant="text"
                      color="error"
                      size="small"
                      sx={{ fontSize: '0.875rem', textDecoration: 'underline', minWidth: 'auto' }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            <div
              className="btn-container"
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
              }}
            >
              <button
                type="submit"
                className="font-pathway save-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                className="font-pathway cancel-btn"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}