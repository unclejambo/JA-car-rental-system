import React, { useState } from 'react';

export default function ReturnModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    seats: '',
    rentPrice: '',
    licensePlate: '',
    image: '',
    damageStatus: 'noDamage',
    damageDetails: '',
    equipmentStatus: 'complete',
    equipmentDetails: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // const handleImageChange = (e) => {
  //     const file = e.target.files[0];
  //     if (file) {
  //         const reader = new FileReader();
  //         reader.onload = (event) => {
  //             setFormData((prev) => ({
  //                 ...prev,
  //                 image: event.target.result,
  //             }));
  //         };
  //         reader.readAsDataURL(file);
  //     }
  // };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add return submission logic here
    console.log('Release form submitted:', formData);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {show && (
        <div
          className="modal-overlay"
          onClick={onClose}
          style={{ gap: '10px' }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              RELEASE
            </h1>
            <hr />
            <form onSubmit={handleSubmit}>
              <div className="field-row" style={{ gap: '10px' }}>
                <label className="field-label font-pathway">Gas Level</label>
                <select className="gas-level-select">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Odometer</label>
                <div className="odometer">
                  <input
                    className="font-pathway"
                    name="odometer"
                    value={formData.odometer}
                    onChange={handleInputChange}
                    type="number"
                    placeholder="Odometer"
                    required
                  />
                </div>
              </div>
              <br />
              <div className="field-row">
                <label className="field-label font-pathway">
                  Damage Check:
                </label>
                <div className="items-center gap-4">
                  <label className="flex items-center gap-2 font-pathway">
                    <input
                      type="radio"
                      name="damageStatus"
                      value="noDamage"
                      checked={formData.damageStatus === 'noDamage'}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    No Damages
                  </label>
                  <label className="flex items-center gap-2 font-pathway">
                    <input
                      type="radio"
                      name="damageStatus"
                      value="specify"
                      checked={formData.damageStatus === 'specify'}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    Specify
                  </label>
                </div>
              </div>
              {formData.damageStatus === 'specify' && (
                <div className="field-row">
                  <input
                    type="text"
                    name="damageDetails"
                    value={formData.damageDetails || ''}
                    onChange={handleInputChange}
                    className="font-pathway"
                    placeholder="Please specify damages..."
                    required
                    style={{ marginLeft: '115px' }}
                  />
                </div>
              )}
              <div className="field-row">
                <label className="field-label font-pathway">
                  Equipment Check:
                </label>
                <div className="items-center gap-4">
                  <label className="flex items-center gap-2 font-pathway">
                    <input
                      type="radio"
                      name="equipmentStatus"
                      value="complete"
                      checked={formData.equipmentStatus === 'complete'}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    Complete
                  </label>
                  <label className="flex items-center gap-2 font-pathway">
                    <input
                      type="radio"
                      name="equipmentStatus"
                      value="specify"
                      checked={formData.equipmentStatus === 'specify'}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    Specify
                  </label>
                </div>
              </div>
              {formData.equipmentStatus === 'specify' && (
                <div className="field-row">
                  <input
                    type="text"
                    name="equipmentDetails"
                    value={formData.equipmentDetails || ''}
                    onChange={handleInputChange}
                    className="font-pathway"
                    placeholder="Please specify damages..."
                    required
                    style={{ marginLeft: '115px' }}
                  />
                </div>
              )}
            </form>
            <div className="btn-container">
              <button className="font-pathway save-btn">Return</button>
              <button className="font-pathway cancel-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              FEES
            </h1>
            <hr />
            <div className="flex justify-between font-pathway fee-row">
              <h3>Overdue Fee</h3>
              <p>₱ 200.00</p>
            </div>
            <div className="flex justify-between font-pathway fee-row">
              <h3>Damage Fee</h3>
              <p>₱ 10,000.00</p>
            </div>
            <div className="flex justify-between font-pathway fee-row">
              <h3>Equipment Loss Fee</h3>
              <p>₱ 1,000.00</p>
            </div>
            <div className="flex justify-between font-pathway fee-row">
              <h3>Gas Level Fee</h3>
              <p>₱ 300.00</p>
            </div>
            <div className="flex justify-between font-pathway fee-row">
              <h3>Cleaning Fee</h3>
              <p>₱ 200.00</p>
            </div>
            <hr />
            <div className="flex justify-between font-pathway fee-row">
              <h3 className="font-pathway">Total</h3>
              <p>₱ 11,200.00</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
