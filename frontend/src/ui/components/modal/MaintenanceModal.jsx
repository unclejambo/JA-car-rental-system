import React, { useState, useEffect } from 'react';

export default function MaintenanceModal({ show, onClose, car, onSave }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const plus7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [formData, setFormData] = useState({
    start_date: todayStr,
    end_date: plus7,
    description: '',
    shop_assigned: '',
    maintenance_fee: '',
  });

  useEffect(() => {
    if (car) {
      setFormData({
        start_date: todayStr,
        end_date: plus7,
        description: '',
        shop_assigned: '',
        maintenance_fee: '',
      });
    }
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      alert('Please select start and end dates.');
      return;
    }
    onSave(formData);
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1 className="font-pathway">Set Maintenance Details</h1>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label font-pathway">Model</label>
            <input
              type="text"
              value={car?.model || car?.raw?.model || ''}
              readOnly
              className="font-pathway"
            />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              min={todayStr}
              onChange={(e) => {
                // update start date and enforce end_date >= new start
                const newStart = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  start_date: newStart,
                  end_date:
                    prev.end_date && prev.end_date >= newStart
                      ? prev.end_date
                      : newStart,
                }));
              }}
              className="font-pathway"
            />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              min={formData.start_date || todayStr}
              onChange={handleChange}
              className="font-pathway"
            />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="font-pathway"
            />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Shop Assigned</label>
            <input
              type="text"
              name="shop_assigned"
              value={formData.shop_assigned}
              onChange={handleChange}
              className="font-pathway"
            />
          </div>
          <div className="field-row">
            <label className="field-label font-pathway">Maintenance Fee</label>
            <input
              type="number"
              name="maintenance_fee"
              value={formData.maintenance_fee}
              onChange={handleChange}
              className="font-pathway"
            />
          </div>
          <div className="btn-container">
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
  );
}
