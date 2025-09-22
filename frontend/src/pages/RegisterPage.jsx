import React, { useState, useRef } from 'react';
import { FaUpload } from 'react-icons/fa';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../ui/components/Header';
import carImage from '/carImage.png';
import { useNavigate } from 'react-router-dom';
import '../styles/register.css';
import SuccessModal from '../ui/components/modal/SuccessModal.jsx';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

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
  const [termsContent, setTermsContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch terms and conditions from backend
  const fetchTerms = async () => {
    if (termsContent) return; // Already loaded

    try {
      const response = await fetch('/api/registration/terms');
      if (response.ok) {
        const data = await response.json();
        setTermsContent(data.content || '');
      } else {
        setTermsContent(
          'Terms and conditions not available. Please contact support.'
        );
      }
    } catch (error) {
      setTermsContent(
        'Terms and conditions not available. Please contact support.'
      );
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    try {
      const {
        email,
        username,
        password,
        confirmPassword,
        firstName,
        lastName,
        address,
        contactNumber,
        licenseNumber,
        licenseExpiry,
        restrictions,
        licenseFile,
        agreeTerms,
      } = formData;

      // Basic required validation (use trim to avoid whitespace-only)
      const missingInitial =
        !email?.trim() ||
        !username?.trim() ||
        !password ||
        !confirmPassword ||
        !firstName?.trim() ||
        !lastName?.trim() ||
        !address?.trim() ||
        !contactNumber?.trim() ||
        !licenseNumber?.trim() ||
        !licenseExpiry?.trim() ||
        !licenseFile ||
        !agreeTerms;

      if (missingInitial) {
        throw new Error('All required fields must be provided');
      }

      if (password !== confirmPassword) {
        throw new Error('All required fields must be provided');
      }

      setLoading(true);

      // 1) Upload license image first to storage endpoint
      const BASE = (
        import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL
      ).replace(/\/+$/, '');
      const uploadUrl = new URL('/api/storage/licenses', BASE).toString();

      const uploadFd = new FormData();
      uploadFd.append('file', licenseFile, licenseFile.name);
      // optional filename hint (server will rename to licenseNumber_customerId later if needed)
      uploadFd.append(
        'filename',
        `${licenseNumber}_${Date.now()}_${licenseFile.name}`
      );

      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFd,
      });

      const uploadJson = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        throw new Error(
          uploadJson?.message || uploadJson?.error || 'File upload failed'
        );
      }

      // try to extract a public URL or stored path from response
      let dl_img_url =
        uploadJson?.publicURL ||
        uploadJson?.publicUrl ||
        uploadJson?.publicUrl ||
        uploadJson?.publicURL ||
        uploadJson?.data?.publicUrl ||
        uploadJson?.data?.publicURL ||
        uploadJson?.data?.path ||
        uploadJson?.data?.Key ||
        uploadJson?.path ||
        uploadJson?.key ||
        null;

      // if no URL but upload returned data with path/key, use that as dl_img_url
      if (!dl_img_url && uploadJson?.data) {
        dl_img_url = uploadJson.data.path || uploadJson.data.key || null;
      }

      // 2) Build registration payload including dl_img_url
      const payload = {
        email: email.trim(),
        username: username.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        licenseExpiry: licenseExpiry.trim(),
        restrictions: restrictions?.trim() || '',
        dl_img_url: dl_img_url,
        agreeTerms: !!agreeTerms,
      };

      // Validate final required fields (including dl_img_url)
      const missingFinal =
        !payload.email ||
        !payload.username ||
        !payload.password ||
        !payload.firstName ||
        !payload.lastName ||
        !payload.address ||
        !payload.contactNumber ||
        !payload.licenseNumber ||
        !payload.licenseExpiry ||
        !payload.dl_img_url ||
        !payload.agreeTerms;

      if (missingFinal) {
        throw new Error('All required fields must be provided');
      }

      // 3) Send registration (JSON) to backend register route
      const regUrl = new URL('/api/auth/register', BASE).toString();
      const regRes = await fetch(regUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const regJson = await regRes.json().catch(() => ({}));
      if (!regRes.ok) {
        throw new Error(
          regJson?.message || regJson?.error || 'Registration failed'
        );
      }

      setSuccessMessage(regJson?.message || 'Registered successfully');
      setShowSuccess(true);
      // optionally navigate on success
      // navigate('/login');
    } catch (err) {
      setServerError(err.message || 'All required fields must be provided');
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
      <div
        className="min-h-screen bg-cover bg-center flex justify-center items-center p-4 relative"
        style={{ backgroundImage: `url(${carImage})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-md p-6 register-card"
          style={{ backgroundImage: `url(${carImage})` }}
        >
          {/* add `register-card` class so custom CSS can target the card */}
          <form
            className="register-form flex flex-col space-y-4"
            id="regForm"
            onSubmit={handleRegisterSubmit}
            noValidate
            encType="multipart/form-data"
          >
            {/* Back to Login (MUI) */}
            <div>
              <Button
                variant="text"
                color="primary"
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/login')}
                aria-label="Back to login"
              >
                Back to Login
              </Button>
            </div>
            <br />
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1"
              >
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
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold mb-1"
              >
                USERNAME
              </label>
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
              {errors.username && (
                <p className="text-xs text-red-600 mt-1">{errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-1"
              >
                PASSWORD
              </label>
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
              {errors.password && (
                <p className="text-xs text-red-600 mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold mb-1"
              >
                CONFIRM PASSWORD
              </label>
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
              {errors.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
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
                    type="text"
                    placeholder="First name"
                    className="w-full p-2 rounded bg-gray-200 placeholder-gray-600 focus:outline-none"
                    required
                    aria-invalid={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.firstName}
                    </p>
                  )}
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
                  {errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-semibold mb-1"
              >
                ADDRESS
              </label>
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
              {errors.address && (
                <p className="text-xs text-red-600 mt-1">{errors.address}</p>
              )}
            </div>

            {/* Contact Number */}
            <div>
              <label
                htmlFor="contactNumber"
                className="block text-sm font-semibold mb-1"
              >
                CONTACT NUMBER
              </label>
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
              {errors.contactNumber && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.contactNumber}
                </p>
              )}
            </div>

            {/* Driver’s License Number */}
            <div>
              <label
                htmlFor="licenseNumber"
                className="block text-sm font-semibold mb-1"
              >
                DRIVER'S LICENSE NUMBER
              </label>
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
              {errors.licenseNumber && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.licenseNumber}
                </p>
              )}
            </div>

            {/* Driver’s License Expiry Date */}
            <div>
              <label
                htmlFor="licenseExpiry"
                className="block text-sm font-semibold mb-1"
              >
                DRIVER'S LICENSE EXPIRY DATE
              </label>
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
              {errors.licenseExpiry && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.licenseExpiry}
                </p>
              )}
            </div>

            {/* Restrictions */}
            <div>
              <label
                htmlFor="restrictions"
                className="block text-sm font-semibold mb-1"
              >
                RESTRICTIONS
              </label>
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
              <label className="block text-sm font-semibold mb-1">
                LICENSE IMAGE
              </label>
              <div className="flex items-center space-x-2">
                <input
                  ref={fileInputRef}
                  id="licenseUpload"
                  name="file" // <- match multer upload.single('file')
                  type="file"
                  onChange={handleFileChange}
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  className="hidden"
                />
                <label
                  htmlFor="licenseUpload"
                  className="flex items-center space-x-2 p-2 bg-gray-200 rounded cursor-pointer hover:bg-gray-300"
                >
                  <FaUpload />
                  <span>
                    {formData.licenseFile ? 'Change file' : 'Upload License ID'}
                  </span>
                </label>
                {formData.licenseFile && (
                  <div className="flex items-center space-x-2">
                    <div className="text-sm">
                      <div className="font-medium">
                        {formData.licenseFile.name}
                      </div>
                      <div className="text-xs text-gray-600">
                        {(formData.licenseFile.size / 1024).toFixed(0)} KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              {previewUrl && (
                <div className="mt-2">
                  <img
                    src={previewUrl}
                    alt="License preview"
                    className="w-32 h-20 object-contain rounded border"
                  />
                </div>
              )}
              {errors.licenseFile && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.licenseFile}
                </p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <input
                id="agreeTerms"
                name="agreeTerms"
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={onChange}
              />
              <label htmlFor="agreeTerms" className="text-sm">
                I agree to the{' '}
                <button
                  type="button"
                  onClick={handleShowTerms}
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-red-600 mt-1">{errors.agreeTerms}</p>
            )}

            {/* Server error */}
            {serverError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className={`mt-4 p-3 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded font-bold transition-colors w-full flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Registering...
                  </>
                ) : (
                  'REGISTER'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      {showTerms && (
        <div
          className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto relative">
            <h2 className="text-xl font-bold mb-4 text-center">
              Terms and Conditions
            </h2>
            <div className="text-sm space-y-4 text-justify">
              {termsContent ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: termsContent.replace(/\n/g, '<br />'),
                  }}
                />
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
