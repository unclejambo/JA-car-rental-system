import React, { useState } from 'react';

export default function ManageFeesModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    overDueFee: '',
    damageFee: '',
    equipmentLossFee: '',
    gasLevelFee: '',
    cleaningFee: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Edit fees submission logic here
    console.log('Manage fees form submitted:', formData);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <h1 className="font-pathway" style={{ margin: '0 0 20px 0' }}>
            MANAGE FEES
          </h1>

          <form onSubmit={handleSubmit}>
            <div className="field-row">
              <label className="field-label font-pathway">Overdue Fee</label>
              <input
                className="font-pathway"
                onChange={handleInputChange}
                name="overDueFee"
                placeholder="P100.00"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Damage Fee</label>
              <input
                className="font-pathway"
                onChange={handleInputChange}
                name="damageFee"
                placeholder="P10000.00"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Equipment Loss Fee</label>
              <input
                className="font-pathway"
                onChange={handleInputChange}
                name="equipmentLossFee"
                placeholder="P1000.00"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Gas Level Fee</label>
              <input
                className="font-pathway"
                onChange={handleInputChange}
                name="gasLevelFee"
                placeholder="P300.00"
                required
              />
            </div>
            <div className="field-row">
              <label className="field-label font-pathway">Cleaning Fee</label>
              <input
                className="font-pathway"
                onChange={handleInputChange}
                name="cleaningFee"
                placeholder="P200.00"
                required
              />
            </div>
            <div className="btn-container">
              <button className="font-pathway save-btn">Save</button>
              <button className="font-pathway cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
