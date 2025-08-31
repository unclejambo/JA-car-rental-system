import React, { useState } from "react";

export default function AddStaffModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "staff",
    status: "Active"
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add staff submission logic here
    console.log("Form submitted:", formData);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h1 className="font-pathway" style={{ margin: "0 0 20px 0" }}>
          ADD STAFF MEMBER
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field-label font-pathway">First Name</label>
            <input
              className="font-pathway"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="First Name"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Last Name</label>
            <input
              className="font-pathway"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="Last Name"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Email</label>
            <input
              className="font-pathway"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Phone</label>
            <input
              className="font-pathway"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Phone Number"
              required
            />
          </div>

          <div className="field-row">
            <label className="field-label font-pathway">Role</label>
            <select
              className="font-pathway"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              required
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
          </div>

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
