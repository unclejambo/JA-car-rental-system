import React, { useState, useRef } from "react";
import { FaUpload } from "react-icons/fa";
import Header from "../ui/components/Header";
import carImage from "/carImage.png";
import { useNavigate } from "react-router-dom";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export default function RegisterPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    address: "",
    contactNumber: "",
    licenseNumber: "",
    licenseExpiry: "",
    restrictions: "",
    licenseFile: null,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showTerms, setShowTerms] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFormData((p) => ({ ...p, licenseFile: null }));
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, licenseFile: "Unsupported file type." }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({ ...prev, licenseFile: "File exceeds 5MB limit." }));
      return;
    }

    // create an object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData((prev) => ({ ...prev, licenseFile: file }));
    setErrors((prev) => ({ ...prev, licenseFile: undefined }));
  };

  const removeFile = () => {
    setFormData((p) => ({ ...p, licenseFile: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (data) => {
    const errs = {};
    if (!data.email) errs.email = "Email is required.";
    else {
      // simple email regex
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(data.email)) errs.email = "Invalid email address.";
    }
    if (!data.username) errs.username = "Username is required.";
    if (!data.password) errs.password = "Password is required.";
    if (data.password && data.password.length < 6)
      errs.password = "Password must be at least 6 characters.";
    if (data.password !== data.confirmPassword)
      errs.confirmPassword = "Passwords do not match.";
    if (!data.firstName) errs.firstName = "First name is required.";
    if (!data.lastName) errs.lastName = "Last name is required.";
    if (!data.address) errs.address = "Address is required.";
    if (!data.contactNumber) errs.contactNumber = "Contact number is required.";
    else {
      const phoneRe = /^[0-9+\-\s()]{7,20}$/;
      if (!phoneRe.test(data.contactNumber))
        errs.contactNumber = "Invalid contact number.";
    }
    if (!data.licenseNumber) errs.licenseNumber = "License number is required.";
    if (!data.licenseExpiry) errs.licenseExpiry = "Expiry date is required.";
    else {
      const expiry = new Date(data.licenseExpiry);
      const now = new Date();
      if (expiry <= now) errs.licenseExpiry = "Expiry date must be in the future.";
    }
    if (!data.licenseFile) errs.licenseFile = "License image is required.";
    if (!data.agreeTerms) errs.agreeTerms = "You must accept the terms.";
    return errs;
  };

  const prepareFormData = (data) => {
    const fd = new FormData();
    fd.append("email", data.email);
    fd.append("username", data.username);
    fd.append("password", data.password);
    fd.append("firstName", data.firstName);
    fd.append("lastName", data.lastName);
    fd.append("address", data.address);
    fd.append("contactNumber", data.contactNumber);
    fd.append("licenseNumber", data.licenseNumber);
    fd.append("licenseExpiry", data.licenseExpiry);
    fd.append("restrictions", data.restrictions);
    // rename file to make unique: license_<licenseNumber>_<timestamp>.<ext>
    if (data.licenseFile) {
      const original = data.licenseFile;
      const ext = original.name.split(".").pop();
      const safeLicense = data.licenseNumber.replace(/[^a-z0-9_-]/gi, "_");
      const newName = `license_${safeLicense}_${Date.now()}.${ext}`;
      const renamedFile = new File([original], newName, { type: original.type });
      fd.append("licenseFile", renamedFile);
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const validation = validateForm(formData);
    if (Object.keys(validation).length) {
      setErrors(validation);
      // focus first error field could be added
      return;
    }

    setLoading(true);
    try {
      const fd = prepareFormData(formData);
      // Replace with your production endpoint
      const res = await fetch("/api/register", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.message || "Server error during registration.");
      }

      // success
      // optionally read response for details
      alert("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      setServerError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="min-h-screen bg-cover bg-center flex justify-center items-center p-4 relative"
        style={{ backgroundImage: `url(${carImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-md p-6 overflow-y-auto max-h-[90vh]">
          <h1 className="text-center text-2xl font-bold mb-4">CREATE A NEW ACCOUNT</h1>

          <form className="flex flex-col space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-1">
                EMAIL ADDRESS
              </label>
              <input
                id="email"
                name="email"
                value={formData.email}
                onChange={onChange}
                type="email"
                placeholder="Enter your email address"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                aria-invalid={!!errors.email}
                required
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold mb-1">USERNAME</label>
              <input
                id="username"
                name="username"
                value={formData.username}
                onChange={onChange}
                type="text"
                placeholder="Enter your username"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.username}
              />
              {errors.username && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold mb-1">PASSWORD</label>
              <input
                id="password"
                name="password"
                value={formData.password}
                onChange={onChange}
                type="password"
                placeholder="Enter a strong password"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.password}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-1">CONFIRM PASSWORD</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
                type="password"
                placeholder="Confirm your password"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-1">NAME</label>
              <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <div className="w-full">
                  <input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={onChange}
                    type="text"
                    placeholder="First name"
                    className="w-full p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none"
                    required
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>}
                </div>
                <div className="w-full">
                  <input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onChange}
                    type="text"
                    placeholder="Last name"
                    className="w-full p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none"
                    required
                    aria-invalid={!!errors.lastName}
                  />
                  {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold mb-1">ADDRESS</label>
              <input
                id="address"
                name="address"
                value={formData.address}
                onChange={onChange}
                type="text"
                placeholder="Enter your address"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.address}
              />
              {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
            </div>

            {/* Contact Number */}
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-semibold mb-1">CONTACT NUMBER</label>
              <input
                id="contactNumber"
                name="contactNumber"
                value={formData.contactNumber}
                onChange={onChange}
                type="text"
                placeholder="Enter your contact number"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.contactNumber}
              />
              {errors.contactNumber && <p className="text-xs text-red-600 mt-1">{errors.contactNumber}</p>}
            </div>

            {/* Driver’s License Number */}
            <div>
              <label htmlFor="licenseNumber" className="block text-sm font-semibold mb-1">DRIVER'S LICENSE NUMBER</label>
              <input
                id="licenseNumber"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={onChange}
                type="text"
                placeholder="License number"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.licenseNumber}
              />
              {errors.licenseNumber && <p className="text-xs text-red-600 mt-1">{errors.licenseNumber}</p>}
            </div>

            {/* Driver’s License Expiry Date */}
            <div>
              <label htmlFor="licenseExpiry" className="block text-sm font-semibold mb-1">DRIVER'S LICENSE EXPIRY DATE</label>
              <input
                id="licenseExpiry"
                name="licenseExpiry"
                value={formData.licenseExpiry}
                onChange={onChange}
                type="date"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
                required
                aria-invalid={!!errors.licenseExpiry}
              />
              {errors.licenseExpiry && <p className="text-xs text-red-600 mt-1">{errors.licenseExpiry}</p>}
            </div>

            {/* Restrictions */}
            <div>
              <label htmlFor="restrictions" className="block text-sm font-semibold mb-1">RESTRICTIONS</label>
              <input
                id="restrictions"
                name="restrictions"
                value={formData.restrictions}
                onChange={onChange}
                type="text"
                placeholder="CODE (optional)"
                className="p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none w-full"
              />
            </div>

            {/* License Image Upload */}
            <div>
              <label className="block text-sm font-semibold mb-1">LICENSE IMAGE</label>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  id="licenseUpload"
                  name="licenseFile"
                  type="file"
                  onChange={handleFileChange}
                  accept={ALLOWED_FILE_TYPES.join(",")}
                  className="hidden"
                />
                <label
                  htmlFor="licenseUpload"
                  className="flex items-center space-x-2 p-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
                >
                  <FaUpload />
                  <span>{formData.licenseFile ? "Change file" : "Upload License ID"}</span>
                </label>
                {formData.licenseFile && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">
                      <div className="font-medium">{formData.licenseFile.name}</div>
                      <div className="text-xs text-gray-600">{(formData.licenseFile.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <button type="button" onClick={removeFile} className="text-sm text-red-600 hover:underline">Remove</button>
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img src={previewUrl} alt="License preview" className="w-32 h-20 object-contain rounded border" />
                </div>
              )}
              {errors.licenseFile && <p className="text-xs text-red-600 mt-1">{errors.licenseFile}</p>}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input id="agreeTerms" name="agreeTerms" type="checkbox" checked={formData.agreeTerms} onChange={onChange} />
              <label htmlFor="agreeTerms" className="text-sm">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowTerms(true)}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-xs text-red-600 mt-1">{errors.agreeTerms}</p>}

            {/* Server error */}
            {serverError && <div className="text-sm text-red-700">{serverError}</div>}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-2 ${loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"} text-white rounded font-bold transition-colors w-full`}
              >
                {loading ? "Registering..." : "REGISTER"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4 text-center">Terms and Conditions</h2>
            <div className="text-sm space-y-4 text-justify">
              <div>
                <h3 className="font-semibold">Cancellation Policy</h3>
                <p>
                  For any Cancellation or No-Show, the following fees apply:
                  <br />
                  • 1 month or more ahead of rental: FREE
                  <br />
                  • 30 – 10 days ahead of rental: 1-day rental fee*
                  <br />
                  • 9 – 3 days ahead of rental: 50% of the total rental fee*
                  <br />
                  • 3 days or less & no show: 100% of rental fee*
                  <br />
                  Minimum cancellation fee is 1,000 pesos for any rule, and in
                  any case, if the calculated cancellation fee is below 1,000
                  PHP.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">
                  Identification of the Rental Vehicle & Vehicle Classes
                </h3>
                <p>
                  The customer has the right to reserve and book any class of
                  car, confirmed by Butuan Car Rental, but no right on a
                  specific make, model, car, or color. The right is limited to
                  the booked class of vehicle. BCR can switch between cars of
                  the same class or upgrade the customer to the next higher
                  class as follows:
                  <br />
                  • Compact Manual (KIA RIO)
                  <br />
                  • Compact Automatic (MIRAGE G4)
                  <br />
                  • Pick-up 5-seater Manual (NISSAN NAVARA)
                  <br />
                  • SUV 7-Seater Automatic (NISSAN TERRA)
                  <br />• SUV 7-Seater Automatic (TOYOTA AVANZA)
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Rental Term</h3>
                <p>
                  The term of this Car Rental Agreement runs from the date and
                  hour of vehicle pickup as indicated in the individual Car
                  Rental Agreement until the return of the vehicle to Owner and
                  completion of all terms of this Car Rental Agreement by both
                  Parties. The Parties may shorten or extend the estimated term
                  of rental by mutual consent. A refund for early return is not
                  applicable. In case of delayed return without prior notice of
                  at least 6 hours ahead of the scheduled return time according
                  to this agreement, the owner is eligible to consider the car
                  as stolen. Furthermore, a fee of 250 PHP per hour will be
                  imposed starting from the minute of the latest agreed return
                  time. If the return delay exceeds more than 2 hours, a full
                  daily rate as well as possible compensation for the loss of a
                  following booking, at exactly the value of the lost booking,
                  will be charged.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTerms(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg"
              aria-label="Close"
            >
              ✕
            </button>
            <button
              onClick={() => {
                setFormData((p) => ({ ...p, agreeTerms: true }));
                setShowTerms(false);
              }}
              className="mt-4 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-full"
            >
              I Agree
            </button>
          </div>
        </div>
      )}
    </>
  );
}
