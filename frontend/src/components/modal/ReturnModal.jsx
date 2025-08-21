import React, { useState } from "react";

export default function ReturnModal({ show, onClose }) {
    const [formData, setFormData] = useState({
        
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
        console.log('Return form submitted:', formData);
        onClose();
    };

    if (!show) return null;

    return (
        <>
        </>
    )
}