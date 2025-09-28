import React, { useState, useEffect } from 'react';
import { useCarStore } from '../../../store/cars';

export default function EditCarModal({ show, onClose, car, onStatusChange }) {
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
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
    setImageFile(e.target.files[0]);

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

  if (!show) {
    return null;
  }

  return (
    <>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <form onSubmit={handleSubmit}>
              <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
                EDIT CAR
              </h1>

              <div className="field-row">
                <label className="field-label font-pathway">Make</label>
                <input
                  className="font-pathway"
                  placeholder="Make"
                  name="make"
                  value={formData.make || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Model</label>
                <input
                  className="font-pathway"
                  placeholder="Model"
                  name="model"
                  value={formData.model || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Year</label>
                <input
                  className="font-pathway"
                  placeholder="Year"
                  name="year"
                  type="number"
                  value={formData.year || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Mileage</label>
                <input
                  className="font-pathway"
                  placeholder="Mileage"
                  name="mileage"
                  type="number"
                  value={formData.mileage || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Seats</label>
                <input
                  className="font-pathway"
                  placeholder="Seats"
                  type="number"
                  name="no_of_seat"
                  value={formData.no_of_seat || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Rent Price</label>
                <input
                  className="font-pathway"
                  placeholder="Rent Price"
                  type="number"
                  name="rent_price"
                  value={formData.rent_price || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">License Plate</label>
                <input
                  className="font-pathway"
                  placeholder="License Plate"
                  name="license_plate"
                  value={formData.license_plate || ''}
                  onChange={handleChange}
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Image</label>
                <input
                  className="font-pathway"
                  type="file"
                  name="image"
                  onChange={handleFileChange}
                />
              </div>
              <div
                className="btn-container"
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '15px',
                }}
              >
                <button type="submit" className="font-pathway save-btn">
                  Save
                </button>
                <button
                  type="button"
                  className="font-pathway cancel-btn"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
