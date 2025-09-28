import React, { useState, useEffect } from 'react';

export default function ExtendMaintenanceModal({ show, onClose, maintenance, onSave }) {
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (maintenance) {
      const originalDate = new Date(maintenance.maintenance_end_date);
      const formattedDate = originalDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
    }
  }, [maintenance]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(maintenance.maintenance_id, { end_date: endDate });
  };

  if (!show) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1 className="font-pathway">Extend Maintenance</h1>
        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label font-pathway">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
