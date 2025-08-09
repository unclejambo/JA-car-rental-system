import React from "react";

export default function EditCarModal({ show, onClose }) {
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
