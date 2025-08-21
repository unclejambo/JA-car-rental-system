import React, { useState, useEffect } from 'react';
import { useCarStore } from '../../store/cars';

export default function EditCarModal({ show, onClose, car }) {
  const [formData, setFormData] = useState({});
  const { updateCar } = useCarStore();

  useEffect(() => {
    if (car) {
      setFormData({
        make: car.make || '',
        model: car.model || '',
        year: car.year || '',
        mileage: car.mileage || '',
        no_of_seat: car.no_of_seat || '',
        rent_price: car.rent_price || '',
        license_plate: car.license_plate || '',
        car_img_url: car.car_img_url || '',
        car_status: car.car_status || 'Available',
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!car) return;

    const payload = {
      ...formData,
      year: parseInt(formData.year, 10) || null,
      mileage: parseInt(formData.mileage, 10) || 0,
      no_of_seat: parseInt(formData.no_of_seat, 10) || 0,
      rent_price: parseFloat(formData.rent_price) || 0,
    };

    try {
      await updateCar(car.car_id, payload);
      onClose();
    } catch (error) {
      console.error('Failed to update car:', error);
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>EDIT CAR</h1>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label font-pathway">Make</label>
            <input name="make" value={formData.make} onChange={handleChange} className="font-pathway" placeholder="Make" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Model</label>
            <input name="model" value={formData.model} onChange={handleChange} className="font-pathway" placeholder="Model" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Year</label>
            <input name="year" value={formData.year} onChange={handleChange} className="font-pathway" placeholder="Year" type="number" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Mileage</label>
            <input name="mileage" value={formData.mileage} onChange={handleChange} className="font-pathway" placeholder="Mileage" type="number" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Seats</label>
            <input name="no_of_seat" value={formData.no_of_seat} onChange={handleChange} className="font-pathway" placeholder="Seats" type="number" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Rent Price</label>
            <input name="rent_price" value={formData.rent_price} onChange={handleChange} className="font-pathway" placeholder="Rent Price" type="number" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">License Plate</label>
            <input name="license_plate" value={formData.license_plate} onChange={handleChange} className="font-pathway" placeholder="License Plate" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Image URL</label>
            <input name="car_img_url" value={formData.car_img_url} onChange={handleChange} className="font-pathway" placeholder="Image URL" type="text" />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Status</label>
            <select name="car_status" value={formData.car_status} onChange={handleChange} className="font-pathway">
              <option value="Available">Available</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Rented">Rented</option>
            </select>
          </div>
          <div className="btn-container">
            <button type="submit" className="font-pathway save-btn">Save</button>
            <button type="button" className="font-pathway cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
