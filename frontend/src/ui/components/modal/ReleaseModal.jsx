import React, { useState } from 'react';
import { HiPhoto } from 'react-icons/hi2';

export default function ReleaseModal({ show, onClose }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
    seats: '',
    rentPrice: '',
    licensePlate: '',
    images: {
      id1: { file: null, preview: '' },
      id2: { file: null, preview: '' },
      carImage1: { file: null, preview: '' },
      carImage2: { file: null, preview: '' },
      carImage3: { file: null, preview: '' },
      carImage4: { file: null, preview: '' },
    },
    equipmentStatus: 'complete',
    equipmentDetails: '',
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

  const handleImageChange = (e, id) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          images: {
            ...prev.images,
            [id]: {
              file: file,
              preview: event.target.result,
            },
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

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
        <div className="modal-overlay" onClick={onClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h1 className="font-pathway" style={{ margin: '0 0 10px 0' }}>
              RELEASE
            </h1>

            <form onSubmit={handleSubmit}>
              <div className="field-row" style={{ gap: '10px' }}>
                <label className="field-label font-pathway">Valid IDs</label>
                <div
                  className="flex items-center gap-2"
                  style={{ marginLeft: '-40px' }}
                >
                  <label className="file-upload-button font-pathway">
                    {/* <HiPhoto className="mr-2" /> */} ID 1
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'id1')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.id1.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="file-upload-button font-pathway">
                    {/* <HiPhoto className="mr-2" /> */} ID 2
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'id2')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.id2.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
              </div>
              <hr />
              <div className="field-row" style={{ gap: '10px' }}>
                <label className="field-label font-pathway">Car Images</label>
                <div
                  className="flex items-center gap-2"
                  style={{ marginLeft: '-42px' }}
                >
                  <label className="file-upload-button font-pathway">
                    Front
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'carImage1')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.carImage1.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="file-upload-button font-pathway">
                    Back
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'carImage2')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.carImage2.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
              </div>
              <div
                className="field-row"
                style={{ gap: '10px', marginTop: '10px' }}
              >
                <div
                  className="flex items-center gap-2"
                  style={{ marginLeft: '118px' }}
                >
                  <label className="file-upload-button font-pathway">
                    Right
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'carImage3')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.carImage3.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="file-upload-button font-pathway">
                    Left
                    <input
                      type="file"
                      onChange={(e) => handleImageChange(e, 'carImage4')}
                      accept="image/*"
                      className="hidden"
                    />
                  </label>
                  {formData.images.carImage4.preview && (
                    <span
                      className="text-sm text-green-600 font-pathway"
                      style={{ marginLeft: '5px' }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </div>
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">License</label>
                <input
                  className="font-pathway"
                  name="license"
                  value={formData.license}
                  onChange={handleInputChange}
                  type="checkbox"
                  required
                />
              </div>
              <div className="field-row">
                <label className="field-label font-pathway">Equipment:</label>
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
                      value="damaged"
                      checked={formData.equipmentStatus === 'damaged'}
                      onChange={handleInputChange}
                      className="h-4 w-4"
                    />
                    Damaged
                  </label>
                </div>
              </div>
              {formData.equipmentStatus === 'damaged' && (
                <div className="field-row">
                  <input
                    type="text"
                    name="equipmentDetails"
                    value={formData.equipmentDetails || ''}
                    onChange={handleInputChange}
                    className="font-pathway"
                    placeholder="Please damaged equipment..."
                    required
                    style={{ marginLeft: '115px' }}
                  />
                </div>
              )}
              <div className="field-row" style={{ gap: '10px' }}>
                <label className="field-label font-pathway">Payment</label>
                <select
                  className="select-payment-release font-pathway"
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="GCash">GCash</option>
                </select>
                <input
                  className="font-pathway"
                  name="paymentAmount"
                  value={formData.paymentAmount}
                  onChange={handleInputChange}
                  placeholder="Amount"
                  required
                />
              </div>
              {formData.paymentMethod === 'GCash' && (
                <div
                  className="field-row"
                  style={{ marginLeft: '215px', width: '185px' }}
                >
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
              )}
            </form>
            <div className="btn-container">
              <button className="font-pathway save-btn">Release</button>
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
