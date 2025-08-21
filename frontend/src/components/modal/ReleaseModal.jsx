import React, { useState } from "react";
import { HiPhoto } from "react-icons/hi2";


export default function ReleaseModal({ show, onClose }) {
    const [formData, setFormData] = useState({
        make: "",
        model: "",
        year: "",
        mileage: "",
        seats: "",
        rentPrice: "",
        licensePlate: "",
        image: "",
    })

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
                        <div className="field-row">
                            <label className="field-label font-pathway">Valid IDs</label>
                            <div>
                                <input
                                    className="font-pathway"
                                    name="validID1"
                                    value={formData.validID1}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
                                <input
                                    className="font-pathway"
                                    name="validID2"
                                    value={formData.validID2}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
                            </div>
                        </div>
                        <hr />
                        <div className="field-row">
                            <label className="field-label font-pathway">Car Images</label>
                            <div>
                                <input
                                    className="font-pathway car-img-btn"
                                    name="carImage1"
                                    value={formData.carImage1}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
                                <input
                                    className="font-pathway car-img-btn"
                                    name="carImage2"
                                    value={formData.carImage2}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
                                <br />
                                <input
                                    className="font-pathway car-img-btn"
                                    name="carImage3"
                                    value={formData.carImage3}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
                                <input
                                    className="font-pathway car-img-btn"
                                    name="carImage4"
                                    value={formData.carImage4}
                                    // onChange={handleImageChange}
                                    type="file"
                                    required
                                />
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
                            <label className="field-label font-pathway">Equipment</label>
                            <div>
                                <span style={{ display: "flex", alignItems: "center" }}>
                                    <input
                                        name="completeEquipment"
                                        value={formData.completeEquipment}
                                        onChange={handleInputChange}
                                        checked
                                        type="radio"
                                        required
                                    />
                                    <label className="font-pathway">Complete</label>
                                </span>
                                <span style={{ display: "flex", alignItems: "center" }}>
                                    <input
                                        name="damagedEquipment"
                                        value={formData.damagedEquipment}
                                        onChange={handleInputChange}
                                        type="radio"
                                        required
                                    />
                                    <label className="font-pathway">Damaged</label>
                                </span>
                            </div>
                        </div>
                        <div className="field-row" style={{ gap: "10px" }}>
                            <label className="field-label font-pathway">Payment</label>
                            <select className="select-payment-release">
                                <option>Cash</option>
                                <option>GCash</option>
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
    )
}