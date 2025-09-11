import React, { useState } from 'react';

export default function AddDriverModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    driverFirstName: '',
    driverLastName: '',
    driverAddress: '',
    contactNumber: '',
    driverEmail: '',
    driverLicense: '',
    restriction: '',
    expirationDate: '',
    // username: "",
    // password: "",
    status: 'Active',
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
    // TODO: Add driver submission logic here
    console.log('Driver form submitted:', formData);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1 className="font-pathway" style={{ margin: '0 0 20px 0' }}>
          ADD NEW DRIVER
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label font-pathway">First Name</label>
            <input
              className="font-pathway"
              name="driverFirstName"
              value={formData.driverFirstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Last Name</label>
            <input
              className="font-pathway"
              name="driverLastName"
              value={formData.driverLastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Address</label>
            <input
              className="font-pathway"
              name="driverAddress"
              value={formData.driverAddress}
              onChange={handleInputChange}
              placeholder="Complete Address"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Contact Number</label>
            <input
              className="font-pathway"
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Contact Number"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Email</label>
            <input
              className="font-pathway"
              type="email"
              name="driverEmail"
              value={formData.driverEmail}
              onChange={handleInputChange}
              placeholder="Email Address"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Driver's License</label>
            <input
              className="font-pathway"
              name="driverLicense"
              value={formData.driverLicense}
              onChange={handleInputChange}
              placeholder="Driver's License Number"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Restriction</label>
            <input
              className="font-pathway"
              name="restriction"
              value={formData.restriction}
              onChange={handleInputChange}
              placeholder="e.g., 1,2"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Expiration Date</label>
            <input
              className="font-pathway"
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* <div className="field-row">
            <label className="field-label font-pathway">Username</label>
            <input
              className="font-pathway"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Password</label>
            <input
              className="font-pathway"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              required
            />
          </div> */}

          <div className="field-row">
            <label className="field-label font-pathway">Status</label>
            <select
              className="font-pathway"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              required
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
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
