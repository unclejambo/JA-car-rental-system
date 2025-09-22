import React, { useState } from 'react';

export default function AddPaymentModal({ show, onClose }) {
  // make a const that handles the customer name (first and last name)

  const [formData, setFormData] = useState({
    startDate: '',
    customerName: '',
    description: '',
    paymentMethod: 'Cash',
    paymentReference: '',
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
    // TODO: Add return submission logic here
    console.log('Added Payment:', formData);
    onClose();
  };

  if (!show) return null;

  return (
    <>
      {show && (
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              Add Payment
            </h1>

            <form onSubmit={handleSubmit}>
              <div className="field-row">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label className="field-label font-pathway">Start Date</label>
                  <input
                    className="font-pathway"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    type="date"
                    required
                  />
                </div>
              </div>
              <div className="field-row">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label className="field-label font-pathway">
                    Customer Name:
                  </label>
                  <input
                    className="font-pathway"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="Customer Name"
                    required
                  />
                </div>
              </div>
              <div className="field-row">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label className="field-label font-pathway">
                    Description:
                  </label>
                  <input
                    className="font-pathway"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="Description"
                    required
                  />
                </div>
              </div>
              <div className="field-row">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label className="field-label font-pathway">Payment:</label>
                  <select
                    className="select-add-payment-refund font-pathway"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <label className="field-label font-pathway">Amount:</label>
                  <input
                    className="font-pathway"
                    name="paymentAmount"
                    value={formData.paymentAmount}
                    onChange={handleInputChange}
                    type="number"
                    placeholder="Amount"
                    required
                  />
                </div>
              </div>
              {formData.paymentMethod === 'GCash' && (
                <div className="field-row">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <label className="field-label font-pathway">
                      Reference No.:
                    </label>
                    <input
                      type="text"
                      name="paymentReference"
                      value={formData.paymentReference}
                      onChange={handleInputChange}
                      className="font-pathway"
                      placeholder="Reference Number"
                      required={formData.paymentMethod === 'GCash'}
                    />
                  </div>
                </div>
              )}
            </form>
            <div
              className="btn-container"
              style={{
                display: 'flex',
                gap: '10px',
                marginTop: '15px',
              }}
            >
              <button className="font-pathway save-btn">Add</button>
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
