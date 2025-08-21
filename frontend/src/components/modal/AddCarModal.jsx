import React, { useState } from 'react';

export default function AddCarModal({ show, onClose }) {
  const [setFormData, formData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    seats: '',
    rentPrice: '',
    licensePlate: '',
    image: '',
    status: 'Available',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image: event.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add car submission logic here
    console.log('Car form submitted:', formData);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              ADD CAR
            </h1>

            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <label className="field-label font-pathway">Make</label>
                <input
                  className="font-pathway"
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  placeholder="Model"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Year</label>
                <input
                  className="font-pathway"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  placeholder="Year"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Mileage</label>
                <input
                  className="font-pathway"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleInputChange}
                  placeholder="Mileage"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Seats</label>
                <input
                  className="font-pathway"
                  name="seats"
                  value={formData.seats}
                  onChange={handleInputChange}
                  placeholder="Seats"
                  type="number"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Rent Price</label>
                <input
                  className="font-pathway"
                  name="rentPrice"
                  value={formData.rentPrice}
                  onChange={handleInputChange}
                  placeholder="Rent Price"
                  type="number"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">License Plate</label>
                <input
                  className="font-pathway"
                  name="licensePlate"
                  value={formData.licensePlate}
                  onChange={handleInputChange}
                  placeholder="License Plate"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Image</label>
                <input
                  className="font-pathway"
                  name="image"
                  value={formData.image}
                  onChange={handleImageChange}
                  type="file"
                  required
                />
              </div>
            </form>
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
