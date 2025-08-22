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
    <>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: "0 0 10px 0" }}>
              EDIT CAR
            </h1>

            <div className="field-row">
              <label className="field-label font-pathway">Make</label>
              <input className="font-pathway" placeholder="Make" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Model</label>
              <input className="font-pathway" placeholder="Model" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Year</label>
              <input className="font-pathway" placeholder="Year" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Mileage</label>
              <input className="font-pathway" placeholder="Mileage" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Seats</label>
              <input
                className="font-pathway"
                placeholder="Seats"
                type="number"
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Rent Price</label>
              <input
                className="font-pathway"
                placeholder="Rent Price"
                type="number"
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">License Plate</label>
              <input className="font-pathway" placeholder="License Plate" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Image</label>
              <input className="font-pathway" type="file" />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Status</label>
              <select className="font-pathway">
                <option>Available</option>
                <option>Maintenance</option>
              </select>
            </div>
            <div className="btn-container">
              <button className="font-pathway save-btn">Save</button>
              <button className="font-pathway cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
