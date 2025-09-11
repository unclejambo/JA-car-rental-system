import React, { useState } from 'react';
import axios from 'axios';
import { useCarStore } from '../../../store/cars';

export default function AddCarModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    no_of_seat: '',
    rent_price: '',
    license_plate: '',
    car_img_url: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addCar } = useCarStore();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const carData = {
        make: formData.make,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        license_plate: formData.license_plate,
        no_of_seat: parseInt(formData.no_of_seat) || 5, // Default to 5 seats if not provided
        rent_price: parseInt(formData.rent_price) || 0,
        car_status: 'Available', // Capitalized to match schema
        car_img_url: formData.car_img_url || 'default-car-image.jpg',
        mileage: formData.mileage !== '' ? parseInt(formData.mileage) : 0,
      };

      await addCar(carData);
      onClose();
    } catch (err) {
      console.error('Error adding car:', err);
      setError(
        err.response?.data?.error || 'Failed to add car. Please try again.'
      );
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

            {error && <div className="error-message">{error}</div>}

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
            <div className="field-row">
              <label className="field-label font-pathway">Image URL</label>
              <input
                className="font-pathway"
                name="car_img_url"
                type="url"
                value={formData.car_img_url}
                onChange={handleChange}
                placeholder="Image URL"
              />
            </div>
            <div className="btn-container">
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
