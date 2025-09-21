import React, { useState, useRef } from "react";
import { FaUpload } from "react-icons/fa";
import Header from "../ui/components/Header";
import carImage from "/carImage.png";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";
import SuccessModal from '../ui/components/modal/SuccessModal.jsx';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

// Philippine phone number formatting function
const formatPhoneNumber = (value) => {
  // Remove all non-numeric characters
  const numbers = value.replace(/\D/g, '');

  // Handle different input scenarios
  if (numbers.length === 0) return '';

  // If starts with 63, format as +63 9XX XXX XXXX
  if (numbers.startsWith('63')) {
    const withoutCountryCode = numbers.slice(2);
    if (withoutCountryCode.length <= 3) {
      return `+63 ${withoutCountryCode}`;
    } else if (withoutCountryCode.length <= 6) {
      return `+63 ${withoutCountryCode.slice(0, 3)} ${withoutCountryCode.slice(3)}`;
    } else {
      return `+63 ${withoutCountryCode.slice(0, 3)} ${withoutCountryCode.slice(3, 6)} ${withoutCountryCode.slice(6, 10)}`;
    }
  }

  // If starts with 9 (mobile number), format as +63 9XX XXX XXXX
  if (numbers.startsWith('9')) {
    if (numbers.length <= 3) {
      return `+63 ${numbers}`;
    } else if (numbers.length <= 6) {
      return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else {
      return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
    }
  }

  // For other numbers, just format with +63 prefix
  if (numbers.length <= 3) {
    return `+63 ${numbers}`;
  } else if (numbers.length <= 6) {
    return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
  } else {
    return `+63 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 10)}`;
  }
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: '',
    contactNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    restrictions: '',
    licenseFile: null,
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsContent, setTermsContent] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch terms and conditions from backend
  const fetchTerms = async () => {
    if (termsContent) return; // Already loaded

    try {
      const response = await fetch("/api/registration/terms");
      if (response.ok) {
        const data = await response.json();
        setTermsContent(data.content || "");
      } else {
        console.warn("Failed to fetch terms, using fallback");
        setTermsContent("Terms and conditions not available. Please contact support.");
      }
    } catch (error) {
      console.warn("Error fetching terms:", error);
      setTermsContent("Terms and conditions not available. Please contact support.");
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    // Apply phone number formatting for contactNumber field
    if (name === 'contactNumber' && type !== 'checkbox') {
      processedValue = formatPhoneNumber(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
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
      setErrors((prev) => ({ ...prev, licenseFile: 'Unsupported file type.' }));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        licenseFile: 'File exceeds 5MB limit.',
      }));
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFormData((prev) => ({ ...prev, licenseFile: file }));
    setErrors((prev) => ({ ...prev, licenseFile: undefined }));
  };

  const removeFile = () => {
    setFormData((p) => ({ ...p, licenseFile: null }));
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    navigate('/login');

  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);

    // Clear previous errors
    setErrors({});
    setServerError(null);
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API_BASE}/api/registration/register`, {
        method: 'POST',
        body: fd
      });

      const text = await res.text();
      let body;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }

      if (!res.ok) {
        // Handle validation or server errors
        if (body && body.errors) {
          setErrors(body.errors);
        } else {
          setServerError(body && body.message ? body.message : 'Registration failed. Please try again.');
        }
        return;
      }

      // Success
      form.reset();
      setFormData({
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
      setPreviewUrl(null);
      setSuccessMessage(body && body.message ? body.message : 'Account created successfully.');
      setShowSuccess(true);
    } catch {
      setServerError('Network error. Please check your connection and try again.');

    } finally {
      setLoading(false);
    }
  };

  const handleShowTerms = () => {
    setShowTerms(true);
    fetchTerms();
  };

  return (
    <>
      <Header />
      <Box
        sx={{
          minHeight: '100vh',
          backgroundImage: `url(${carImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          pt: 12,
          pb: { xs: 2, md: 1, lg: 1 },
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-md p-6 overflow-y-auto max-h-[90vh] register-card">
          {/* add `register-card` class so custom CSS can target the card */}
          <form className="register-form flex flex-col space-y-4" id="regForm" onSubmit={handleSubmit} noValidate encType="multipart/form-data">
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
              <div className="two-col flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <div className="w-full">
                  <input
                    id="firstName"

                    name="firstName"
                    value={formData.firstName}
                    onChange={onChange}
                    placeholder="First name"
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={onChange}
                    placeholder="Last name"
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={onChange}
                    placeholder="Enter your address"
                    error={!!errors.address}
                    helperText={errors.address}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Contact number"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={onChange}
                    placeholder="Enter your contact number (e.g., 09XX XXX XXXX)"
                    error={!!errors.contactNumber}
                    helperText={errors.contactNumber}
                    inputMode="numeric"
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Driver's license number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={onChange}
                    placeholder="License number"
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="License expiry date"
                    name="licenseExpiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={onChange}
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.licenseExpiry}
                    helperText={errors.licenseExpiry}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Restrictions (optional)"
                    name="restrictions"
                    value={formData.restrictions}
                    onChange={onChange}
                    placeholder="CODE (optional)"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, fontWeight: 600 }}
                  >
                    License image
                  </Typography>
                  <Button variant="outlined" component="label" sx={{ mr: 1 }}>
                    <FaUpload style={{ marginRight: 6 }} />
                    {formData.licenseFile ? 'Change file' : 'Upload License ID'}
                    <input
                      ref={fileInputRef}
                      id="licenseUpload"
                      name="licenseFile"
                      type="file"
                      accept={ALLOWED_FILE_TYPES.join(',')}
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                  {formData.licenseFile && (
                    <>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{ mr: 1 }}
                      >
                        {formData.licenseFile.name} (
                        {(formData.licenseFile.size / 1024).toFixed(0)} KB)
                      </Typography>
                      <Button size="small" color="error" onClick={removeFile}>
                        Remove
                      </Button>
                    </>
                  )}
                  {previewUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Box
                        component="img"
                        src={previewUrl}
                        alt="License preview"
                        sx={{
                          width: 128,
                          height: 80,
                          objectFit: 'contain',
                          borderRadius: 1,
                          border: '1px solid #e5e7eb',
                        }}
                      />
                    </Box>
                  )}
                  {errors.licenseFile && (
                    <Typography
                      variant="caption"
                      color="error"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.licenseFile}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={onChange}
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the{' '}
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => setShowTerms(true)}
                          sx={{ p: 0, minWidth: 0 }}
                        >
                          Terms and Conditions
                        </Button>
                      </Typography>
                    }
                  />
                  {errors.agreeTerms && (
                    <Typography variant="caption" color="error" display="block">
                      {errors.agreeTerms}
                    </Typography>
                  )}
                </Grid>

                {serverError && (
                  <Grid item xs={12}>
                    <Typography color="error" variant="body2">
                      {serverError}
                    </Typography>
                  </Grid>
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
                  onClick={handleShowTerms}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
            {errors.agreeTerms && <p className="text-xs text-red-600 mt-1">{errors.agreeTerms}</p>}

            {/* Server error */}
            {serverError && <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{serverError}</div>}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-3 ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white rounded font-bold transition-colors w-full flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Registering...
                  </>
                ) : "REGISTER"}
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
              {termsContent ? (
                <div dangerouslySetInnerHTML={{ __html: termsContent.replace(/\n/g, '<br />') }} />
              ) : (
                <p>Loading terms and conditions...</p>
              )}
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
              disabled={!termsContent}
            >
              I Agree
            </button>
          </div>
        </div>
      )}

      <SuccessModal
        open={showSuccess}
        message={successMessage}
        onNavigate={handleCloseSuccess}
        buttonText="Back to Login"
      />
    </>
  );
};

export default RegisterPage;
