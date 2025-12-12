import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Modal,
  InputAdornment,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  CircularProgress,
  Card,
  CardContent,
  Stack,
} from '@mui/material';

import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

import Header from '../../ui/components/Header';
import DriverSideBar from '../../ui/components/DriverSideBar';
import Loading from '../../ui/components/Loading';
import ConfirmationModal from '../../ui/components/modal/ConfirmationModal';
import SaveCancelModal from '../../ui/components/modal/SaveCancelModal';
import PhoneVerificationModal from '../../components/PhoneVerificationModal';
import {
  HiCog8Tooth,
  HiUser,
  HiMapPin,
  HiEnvelope,
  HiPhone,
  HiIdentification,
  HiLockClosed,
  HiBell,
} from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import { updateLicense } from '../../store/license'; // same approach as CustomerSettings
import {
  formatPhilippineLicense,
  validatePhilippineLicense,
  getLicenseValidationError,
} from '../../utils/licenseFormatter';

export default function DriverSettings() {
  // Tabs
  const [activeTab, setActiveTab] = useState(
    parseInt(localStorage.getItem('driverSettingsTab') || '0', 10)
  );
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    localStorage.setItem('driverSettingsTab', newValue.toString());
  };

  // Layout / UI
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Save states
  const [saving, setSaving] = useState(false);
  const [savingLicense, setSavingLicense] = useState(false);

  // Success snackbar
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Error snackbar
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);

  // Info tab states
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    contactNo: '',
    email: '',
    username: '',
    userType: '',
    address: '',
  });
  const [draft, setDraft] = useState(profile);

  // Password change block
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // License tab states (moved licenseNumber here)
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [licenseId, setLicenseId] = useState(null); // License ID for API calls
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseRestrictions, setLicenseRestrictions] = useState('');
  const [licenseExpiration, setLicenseExpiration] = useState('');
  const [licenseImage, setLicenseImage] = useState(
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  );

  const [draftLicenseNo, setDraftLicenseNo] = useState('');
  const [draftLicenseRestrictions, setDraftLicenseRestrictions] = useState('');
  const [draftLicenseExpiration, setDraftLicenseExpiration] = useState('');
  const [draftLicenseImage, setDraftLicenseImage] = useState(null);
  const [previewLicenseImage, setPreviewLicenseImage] = useState(null);
  const [licenseImageUploading, setLicenseImageUploading] = useState(false);

  // Modals for license image and save/cancel confirmations
  const [openLicenseModal, setOpenLicenseModal] = useState(false);
  const [openLicenseSaveModal, setOpenLicenseSaveModal] = useState(false);
  const [openLicenseCancelModal, setOpenLicenseCancelModal] = useState(false);

  // Confirmation modals for info
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openInfoCancelModal, setOpenInfoCancelModal] = useState(false);
  const [showLicenseConfirmModal, setShowLicenseConfirmModal] = useState(false);
  const [showLicenseCancelModal, setShowLicenseCancelModal] = useState(false);

  // Avatar modal
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Profile picture state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [pendingProfileChanges, setPendingProfileChanges] = useState(null);

  // Auth + API
  const { logout } = useAuth();
  const authenticatedFetch = createAuthenticatedFetch(logout);
  const API_BASE = getApiBase();

  // Fetch profile
  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-profile`
      );
      if (!response.ok) {
        const t = await response.json().catch(() => ({}));
        throw new Error(t.message || 'Failed to fetch profile');
      }
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to load');

      const data = result.data || {};

      const driverData = {
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        contactNo: data.contact_no || '',
        email: data.email || '',
        username: data.username || '',
        userType: data.user_type || '',
        address: data.address || '',
        profileImageUrl: data.profile_img_url || '', // ✅ Store profile image URL
      };

      setProfile(driverData);
      setDraft(driverData);
      setImagePreview(data.profile_img_url || ''); // ✅ Set profile image preview

      // license fields (defensive)
      setLicenseId(data.license_id || data.license?.license_id || null);
      setLicenseNumber(
        data.license_number ||
          data.driver_license?.driver_license_no ||
          data.license?.driver_license_no ||
          ''
      );
      setLicenseRestrictions(
        data.license_restrictions ||
          data.driver_license?.restrictions ||
          data.license?.restrictions ||
          data.licenseRestrictions ||
          ''
      );
      setLicenseExpiration(
        data.license_expiry || // <-- this is the correct key
          data.license_expiration ||
          data.driver_license?.expiry_date ||
          data.license?.expiry_date ||
          data.license?.expiration_date ||
          data.DriverLicense?.expiry_date ||
          data.driver_license_expiry ||
          data.licenseExpiration ||
          ''
      );
      setLicenseImage(
        data.license_img_url ||
          data.license_image_url ||
          data.driver_license?.dl_img_url ||
          data.license?.dl_img_url ||
          data.DriverLicense?.dl_img_url ||
          data.license_img ||
          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      );
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // keep draft synced when profile changes
  useEffect(() => setDraft(profile), [profile]);

  // Handlers - Info
  const handleEditToggle = () => {
    setIsEditing(true);
    setDraft({ ...profile });
  };

  const handleCancel = () => {
    setDraft({ ...profile });
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((p) => ({ ...p, [name]: value }));
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((p) => ({ ...p, [name]: value }));
    if (error) setError(null);
  };

  const getChanges = () => {
    const changes = [];
    Object.keys(draft).forEach((key) => {
      if (draft[key] !== profile[key]) {
        let label = key;
        switch (key) {
          case 'firstName':
            label = 'First Name';
            break;
          case 'lastName':
            label = 'Last Name';
            break;
          case 'contactNo':
            label = 'Contact Number';
            break;
          case 'email':
            label = 'Email';
            break;
          case 'username':
            label = 'Username';
            break;
          case 'address':
            label = 'Address';
            break;
          default:
            label = key;
        }
        changes.push({ field: label, from: profile[key], to: draft[key] });
      }
    });

    if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
      changes.push({
        field: 'Password',
        from: '(hidden)',
        to: '(new password)',
      });
    }
    return changes;
  };

  const validateForm = () => {
    if (!draft.firstName?.trim()) return 'First name is required';
    if (!draft.lastName?.trim()) return 'Last name is required';
    if (!draft.email?.trim()) return 'Email is required';
    if (!draft.username?.trim()) return 'Username is required';
    // email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(draft.email)) return 'Please enter a valid email';

    // if changing password
    if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
      if (!passwordData.currentPassword)
        return 'Current password is required to change password';
      if (passwordData.newPassword.length < 6)
        return 'New password must be at least 6 characters';
      if (passwordData.newPassword !== passwordData.confirmPassword)
        return 'Password confirmation does not match';
    }
    return null;
  };

  const handleSaveClick = () => {
    const v = validateForm();
    if (v) {
      setError(v);
      return;
    }
    const changes = getChanges();
    if (changes.length === 0) {
      setError('No changes detected');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    setShowConfirmModal(false);

    try {
      // Check if phone number has changed
      const phoneNumberChanged = draft.contactNo !== profile.contactNo;

      if (phoneNumberChanged) {
        // Store pending changes and trigger phone verification
        const updateData = {
          first_name: draft.firstName,
          last_name: draft.lastName,
          contact_no: draft.contactNo,
          email: draft.email,
          username: draft.username,
          address: draft.address,
          license_number: licenseNumber,
        };

        // Include password fields only if user is changing password
        if (
          passwordData.newPassword &&
          passwordData.newPassword.trim() !== ''
        ) {
          updateData.password = passwordData.newPassword;
          updateData.currentPassword = passwordData.currentPassword;
        }

        setPendingProfileChanges({
          updateData,
          profileImage: profileImage,
          driverId: JSON.parse(localStorage.getItem('userInfo'))?.id,
        });
        setPendingPhoneNumber(draft.contactNo);
        setSaving(false);

        // Trigger phone verification
        await sendPhoneOTP(draft.contactNo);
        return;
      }

      // Upload profile image first if changed
      let imageUrl = null;
      if (profileImage) {
        imageUrl = await uploadProfileImage();
      }

      const updateData = {
        first_name: draft.firstName,
        last_name: draft.lastName,
        contact_no: draft.contactNo,
        email: draft.email,
        username: draft.username,
        address: draft.address,
        license_number: licenseNumber, // ✅ backend requires this
      };

      // Add profile image URL - either new upload or preserve existing
      if (imageUrl) {
        updateData.profile_img_url = imageUrl;
      } else if (profile.profileImageUrl) {
        // Preserve existing profile image URL
        updateData.profile_img_url = profile.profileImageUrl;
      }

      // Include password fields only if user is changing password
      if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
        updateData.password = passwordData.newPassword;
        updateData.currentPassword = passwordData.currentPassword;
      }

      // ✅ Use correct API route
      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const updated = result.data || {};

        // Update local states from backend response
        const updatedProfile = {
          firstName: updated.first_name || '',
          lastName: updated.last_name || '',
          contactNo: updated.contact_no || '',
          email: updated.email || '',
          username: updated.username || '',
          userType: updated.user_type || profile.userType || 'driver',
          address: updated.address || '',
          profileImageUrl:
            updated.profile_img_url ||
            imageUrl ||
            profile.profileImageUrl ||
            '',
        };

        setProfile(updatedProfile);
        setDraft(updatedProfile);
        setProfileImage(null); // Clear the file after upload

        // Update image preview to match the saved profile image
        setImagePreview(updatedProfile.profileImageUrl);

        // Update license-related data if returned
        if (updated.license_number) setLicenseNumber(updated.license_number);
        if (updated.license_expiry)
          setLicenseExpiration(updated.license_expiry);
        if (updated.license_restrictions)
          setLicenseRestrictions(updated.license_restrictions);

        // Reset editing + password state
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsEditing(false);

        // Success feedback
        setSuccessMessage('Profile updated successfully!');
        setShowSuccess(true);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handlers - License tab
  const openLicenseEdit = () => {
    setDraftLicenseNo(licenseNumber);
    setDraftLicenseRestrictions(licenseRestrictions);
    setDraftLicenseExpiration(licenseExpiration);
    setPreviewLicenseImage(null);
    setDraftLicenseImage(null);
    setIsEditingLicense(true);
  };

  const handleLicenseFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const validation = validateImageFile(file);
      if (validation) {
        setError(validation);
        return;
      }

      setDraftLicenseImage(file);
      setPreviewLicenseImage(URL.createObjectURL(file));
      setError(null);
    }
  };

  const uploadLicenseImage = async () => {
    if (!draftLicenseImage) return null;

    setLicenseImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', draftLicenseImage);
      formData.append('licenseNumber', licenseNumber);
      formData.append('username', profile.username);

      const response = await authenticatedFetch(
        `${API_BASE}/api/storage/licenses`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Upload failed');
      }

      const result = await response.json();

      if (result.filePath) {
        return result.filePath;
      } else {
        throw new Error('No file path returned from upload');
      }
    } finally {
      setLicenseImageUploading(false);
    }
  };

  const handleLicenseSaveConfirm = async () => {
    // Validate license number format
    const licenseError = getLicenseValidationError(draftLicenseNo);
    if (licenseError) {
      setErrorMessage(licenseError);
      setShowError(true);
      return;
    }

    setSavingLicense(true);
    setError(null); // Clear any previous errors

    if (!licenseId) {
      setErrorMessage('License ID not found. Please refresh and try again.');
      setShowError(true);
      setSavingLicense(false);
      return;
    }

    try {
      // Upload license image first if there's a new image
      let uploadedImageUrl = null;
      if (draftLicenseImage) {
        try {
          uploadedImageUrl = await uploadLicenseImage();
          if (!uploadedImageUrl) {
            throw new Error('Failed to upload license image');
          }
        } catch (_uploadError) {
          setErrorMessage('Failed to upload license image. Please try again.');
          setShowError(true);
          setSavingLicense(false);
          return;
        }
      }

      const updateData = {
        driver_license_no: draftLicenseNo || licenseNumber, // Include license number for editing
        restrictions: draftLicenseRestrictions || licenseRestrictions,
        expiry_date: draftLicenseExpiration || licenseExpiration,
        // Use new image if uploaded, otherwise preserve existing
        dl_img_url: uploadedImageUrl || licenseImage,
      };

      // Use the license_id (numeric ID) instead of license number
      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-license/${licenseId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // ✅ Update local state from backend response
        setLicenseNumber(result.driver_license_no || draftLicenseNo);
        setLicenseRestrictions(result.restrictions || updateData.restrictions);
        setLicenseExpiration(result.expiry_date || updateData.expiry_date);
        // Use the response image URL (which may be a signed URL)
        setLicenseImage(result.dl_img_url || updateData.dl_img_url);

        // ✅ Clear draft image states
        setDraftLicenseImage(null);
        setPreviewLicenseImage(null);

        // ✅ Exit edit mode and close modals
        setIsEditingLicense(false);
        setShowLicenseConfirmModal(false);
        setShowLicenseCancelModal(false);

        // ✅ Show success
        setSuccessMessage('License information updated successfully!');
        setShowSuccess(true);
        setError(null); // Clear any errors
      } else {
        setErrorMessage(result.error || 'Failed to update license');
        setShowError(true);
      }
    } catch (_error) {
      setErrorMessage('Unexpected error updating license');
      setShowError(true);
    } finally {
      setSavingLicense(false);
    }
  };

  const handleLicenseCancelConfirm = () => {
    setDraftLicenseNo(licenseNumber);
    setDraftLicenseRestrictions(licenseRestrictions);
    setDraftLicenseExpiration(licenseExpiration);
    setPreviewLicenseImage(null);
    setDraftLicenseImage(null);
    setIsEditingLicense(false);
    setOpenLicenseCancelModal(false);
  };

  const handleRemoveLicenseImage = async () => {
    if (!licenseNumber) {
      setErrorMessage('License number not found');
      setShowError(true);
      return;
    }

    // Confirm deletion
    if (
      !window.confirm(
        'Are you sure you want to remove the license image? This action cannot be undone.'
      )
    ) {
      return;
    }

    setLicenseImageUploading(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-license/${licenseNumber}/image`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state to default image
        setLicenseImage(
          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
        );
        setPreviewLicenseImage(null);
        setDraftLicenseImage(null);

        setSuccessMessage('License image removed successfully');
        setShowSuccess(true);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to delete license image');
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete license image');
      setShowError(true);
    } finally {
      setLicenseImageUploading(false);
    }
  };

  // Phone verification functions
  const sendPhoneOTP = async (phoneNumber) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const response = await authenticatedFetch(
        `${API_BASE}/api/phone-verification/send-otp`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            purpose: 'phone_change',
            userId: userInfo?.id,
            userType: 'driver',
          }),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setShowPhoneVerification(true);
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      setError(error.message || 'Failed to send OTP');
    }
  };

  const handlePhoneVerificationSuccess = async (_data) => {
    try {
      setSaving(true);

      if (!pendingProfileChanges) {
        throw new Error('No pending changes found');
      }

      const { updateData, profileImage: pendingImage } = pendingProfileChanges;

      // Upload profile image first if changed
      let imageUrl = null;
      if (pendingImage) {
        imageUrl = await uploadProfileImage();
      }

      // Add profile image URL - either new upload or preserve existing
      if (imageUrl) {
        updateData.profile_img_url = imageUrl;
      } else if (profile.profileImageUrl) {
        updateData.profile_img_url = profile.profileImageUrl;
      }

      // Update driver with phone verification included
      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const updated = result.data || {};

        // Update local states from backend response
        const updatedProfile = {
          firstName: updated.first_name || '',
          lastName: updated.last_name || '',
          contactNo: updated.contact_no || '',
          email: updated.email || '',
          username: updated.username || '',
          userType: updated.user_type || profile.userType || 'driver',
          address: updated.address || '',
          profileImageUrl:
            updated.profile_img_url ||
            imageUrl ||
            profile.profileImageUrl ||
            '',
        };

        setProfile(updatedProfile);
        setDraft(updatedProfile);
        setProfileImage(null); // Clear the file after upload

        // Update image preview to match the saved profile image
        setImagePreview(updatedProfile.profileImageUrl);

        // Update license-related data if returned
        if (updated.license_number) setLicenseNumber(updated.license_number);
        if (updated.license_expiry)
          setLicenseExpiration(updated.license_expiry);
        if (updated.license_restrictions)
          setLicenseRestrictions(updated.license_restrictions);

        // Reset editing + password state
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsEditing(false);

        // Clear pending states
        setPendingProfileChanges(null);
        setPendingPhoneNumber('');
        setShowPhoneVerification(false);

        // Success feedback
        setSuccessMessage('Profile and phone number updated successfully!');
        setShowSuccess(true);
      } else {
        throw new Error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhoneVerificationError = (error) => {
    setPendingProfileChanges(null);
    setPendingPhoneNumber('');
    setShowPhoneVerification(false);
  };

  // Profile image validation
  const validateImageFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      return 'Only JPG, PNG, and WEBP files are allowed';
    }

    if (file.size > maxSize) {
      return 'File size must be less than 5MB';
    }

    return null;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const handleRemoveImage = async () => {
    try {
      if (profile.profileImageUrl) {
        setImageUploading(true);
        const response = await authenticatedFetch(
          `${API_BASE}/api/storage/profile-images`,
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: profile.profileImageUrl }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete image from storage');
        }
      }

      setImagePreview('');
      setProfileImage(null);
      setProfile((prev) => ({ ...prev, profileImageUrl: '' }));
      setDraft((prev) => ({ ...prev, profileImageUrl: '' }));

      // Update profile in database to remove image URL
      const updateResponse = await authenticatedFetch(
        `${API_BASE}/api/driver-profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: draft.firstName,
            last_name: draft.lastName,
            contact_no: draft.contactNo,
            email: draft.email,
            username: draft.username,
            address: draft.address,
            license_number: licenseNumber,
            profile_img_url: '', // Explicitly remove the image
          }),
        }
      );

      if (updateResponse.ok) {
        setSuccessMessage('Profile picture removed successfully!');
        setShowSuccess(true);
      }
    } catch (error) {
      setError('Failed to remove profile picture');
    } finally {
      setImageUploading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    try {
      setImageUploading(true);

      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const driverId = userInfo.id || userInfo.drivers_id || 'unknown';

      const formData = new FormData();
      formData.append('profileImage', profileImage);
      formData.append('userId', driverId);
      formData.append('userType', 'driver');

      const response = await authenticatedFetch(
        `${API_BASE}/api/storage/profile-images`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || (!result.ok && !result.success)) {
        throw new Error(result.message || 'Upload failed');
      }

      const imageUrl =
        result.data?.url ||
        result.data?.driver?.profile_img_url ||
        result.publicUrl;

      if (!imageUrl) {
        throw new Error('No image URL returned from upload');
      }

      // Update the preview immediately
      setImagePreview(imageUrl);

      return imageUrl;
    } catch (error) {
      setError('Failed to upload profile picture');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  // Render
  return (
    <Box sx={{ display: 'flex' }}>
      <title>Driver Settings</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <DriverSideBar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: `calc(100% - 18.7dvw)`,
          ml: { xs: '0px', sm: '0px', md: '18.7dvw', lg: '18.7dvw' },
          '@media (max-width: 1024px)': { ml: '0px' },
          mt: { xs: '70px', sm: '70px', md: '56px', lg: '56px' },
          height: '100%',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            width: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f5f5f5',
              p: { xs: 1, sm: 2, md: 3 },
              overflow: 'hidden',
              height: 'auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Loading Indicator - Initial Load */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress sx={{ color: '#c10007' }} />
              </Box>
            )}

            {!loading && (
              <>
                {/* Modern Gradient Header */}
                <Box
                  sx={{
                    background:
                      'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(193, 0, 7, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <HiCog8Tooth size={32} style={{ marginRight: '12px' }} />
                    <Typography
                      variant="h4"
                      sx={{
                        fontSize: {
                          xs: '1.5rem',
                          sm: '2rem',
                          md: '2.125rem',
                        },
                        fontWeight: 'bold',
                      }}
                    >
                      Driver Settings
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Manage your driver profile and license information
                  </Typography>
                </Box>

                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Tabs
                      value={activeTab}
                      onChange={handleTabChange}
                      sx={{
                        '& .MuiTabs-flexContainer': {
                          justifyContent: 'flex-start',
                        },
                        '& .MuiTab-root': {
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          minWidth: 120,
                        },
                        '& .Mui-selected': { color: '#c10007 !important' },
                        '& .MuiTabs-indicator': { backgroundColor: '#c10007' },
                      }}
                    >
                      <Tab
                        label={
                          <span
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <AccountCircleIcon style={{ marginRight: 8 }} />{' '}
                            Info
                          </span>
                        }
                      />
                      <Tab
                        label={
                          <span
                            style={{ display: 'flex', alignItems: 'center' }}
                          >
                            <BadgeIcon style={{ marginRight: 8 }} /> License
                          </span>
                        }
                      />
                    </Tabs>
                  </Box>
                </Box>

                {/* Loading Indicator - Initial Load */}
                {loading && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', py: 3 }}
                  >
                    <CircularProgress sx={{ color: '#c10007' }} />
                  </Box>
                )}

                {/* Error Message */}
                {error && !loading && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {/* Content */}
                {activeTab === 0 && (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        minWidth: '100%',
                        maxWidth: 900,
                        bgcolor: '#ffffff',
                        borderRadius: 3,
                        p: { xs: 2, md: 3 },
                        pb: isEditing ? 2 : 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          borderRadius: '18px',
                          p: 3,
                          pb: isEditing ? 1.5 : 3,
                          position: 'relative',
                          overflow: 'hidden',
                          bgcolor: 'transparent',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            mb: { xs: 1, md: 0 },
                          }}
                        >
                          {!isEditing && (
                            <IconButton
                              onClick={handleEditToggle}
                              sx={{
                                position: 'absolute',
                                top: { xs: -8, md: -10 },
                                right: { xs: 8, md: 40 },
                                backgroundColor: '#fff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                zIndex: 30,
                                '&:hover': { backgroundColor: '#1565c0' },
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            flexDirection: { xs: 'column', md: 'row' },
                          }}
                        >
                          {/* Avatar */}
                          <Box
                            sx={{
                              width: { xs: '100%', md: 160 },
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: { xs: 'center', md: 'flex-start' },
                              mb: { xs: 2, md: 0 },
                            }}
                          >
                            <Avatar
                              src={
                                imagePreview ||
                                'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
                              }
                              sx={{
                                width: { xs: 96, md: 120 },
                                height: { xs: 96, md: 120 },
                                position: { xs: 'static', md: 'absolute' },
                                left: { md: 8 },
                                top: { md: 25 },
                                boxShadow: 2,
                                cursor: 'pointer',
                                border: imagePreview
                                  ? '3px solid #e0e0e0'
                                  : 'none',
                              }}
                              onClick={() => setAvatarOpen(true)}
                            />

                            {isEditing && (
                              <Box
                                sx={{
                                  mt: { xs: 2, md: 0 },
                                  position: { md: 'absolute' },
                                  top: { md: 155 },
                                  left: { md: 20 },
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Button
                                  variant="contained"
                                  component="label"
                                  size="small"
                                  startIcon={<PhotoCamera />}
                                  disabled={imageUploading}
                                  sx={{
                                    fontSize: '0.75rem',
                                    px: 1.5,
                                    minWidth: 'auto',
                                  }}
                                >
                                  {imagePreview ? 'Change' : 'Upload'}
                                  <input
                                    type="file"
                                    hidden
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageChange}
                                  />
                                </Button>

                                {imagePreview && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="error"
                                    startIcon={<PhotoCamera />}
                                    onClick={handleRemoveImage}
                                    disabled={imageUploading}
                                    sx={{
                                      fontSize: '0.75rem',
                                      px: 1.5,
                                      minWidth: 'auto',
                                    }}
                                  >
                                    Remove
                                  </Button>
                                )}

                                {imageUploading && (
                                  <CircularProgress size={20} sx={{ mt: 1 }} />
                                )}
                              </Box>
                            )}
                          </Box>

                          {/* Details */}
                          <Box
                            sx={{
                              flex: 1,
                              pl: { xs: 0, md: 6 },
                              width: '100%',
                            }}
                          >
                            {/* Personal Information Section */}
                            <Box sx={{ mb: 3, mt: 2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                  pb: 1,
                                  borderBottom: '2px solid #f0f0f0',
                                }}
                              >
                                <HiUser
                                  size={24}
                                  color="#c10007"
                                  style={{ marginRight: '8px' }}
                                />
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 600, color: '#c10007' }}
                                >
                                  Personal Information
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 2,
                                }}
                              >
                                {isEditing ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 2,
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                    }}
                                  >
                                    <TextField
                                      label="First Name"
                                      name="firstName"
                                      value={draft.firstName || ''}
                                      onChange={handleChange}
                                      size="small"
                                      fullWidth
                                      required
                                      disabled
                                      sx={{
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: '#666',
                                          cursor: 'not-allowed',
                                        },
                                      }}
                                    />
                                    <TextField
                                      label="Last Name"
                                      name="lastName"
                                      value={draft.lastName || ''}
                                      onChange={handleChange}
                                      size="small"
                                      fullWidth
                                      required
                                      disabled
                                      sx={{
                                        '& .MuiInputBase-input.Mui-disabled': {
                                          WebkitTextFillColor: '#666',
                                          cursor: 'not-allowed',
                                        },
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 3,
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: '#666',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        First Name
                                      </Typography>
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {profile.firstName || 'N/A'}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: '#666',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        Last Name
                                      </Typography>
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {profile.lastName || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                                {isEditing ? (
                                  <TextField
                                    label="Address"
                                    name="address"
                                    value={draft.address || ''}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                      startAdornment: (
                                        <HiMapPin
                                          size={20}
                                          color="#666"
                                          style={{ marginRight: '8px' }}
                                        />
                                      ),
                                    }}
                                  />
                                ) : (
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#666',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Address
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <HiMapPin size={18} color="#666" />
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {profile.address || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </Box>

                            {/* Contact Information Section */}
                            <Box sx={{ mb: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                  pb: 1,
                                  borderBottom: '2px solid #f0f0f0',
                                }}
                              >
                                <HiPhone
                                  size={24}
                                  color="#c10007"
                                  style={{ marginRight: '8px' }}
                                />
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 600, color: '#c10007' }}
                                >
                                  Contact Information
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 2,
                                }}
                              >
                                {isEditing ? (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 2,
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                    }}
                                  >
                                    <TextField
                                      label="Email"
                                      name="email"
                                      type="email"
                                      value={draft.email || ''}
                                      onChange={handleChange}
                                      size="small"
                                      fullWidth
                                      required
                                      InputProps={{
                                        startAdornment: (
                                          <HiEnvelope
                                            size={20}
                                            color="#666"
                                            style={{ marginRight: '8px' }}
                                          />
                                        ),
                                      }}
                                    />
                                    <TextField
                                      label="Contact Number"
                                      name="contactNo"
                                      value={draft.contactNo || ''}
                                      onChange={handleChange}
                                      size="small"
                                      fullWidth
                                      placeholder="e.g., 09123456789"
                                      InputProps={{
                                        startAdornment: (
                                          <HiPhone
                                            size={20}
                                            color="#666"
                                            style={{ marginRight: '8px' }}
                                          />
                                        ),
                                      }}
                                    />
                                  </Box>
                                ) : (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      gap: 3,
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                    }}
                                  >
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: '#666',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        Email
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        <HiEnvelope size={18} color="#666" />
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                          }}
                                        >
                                          {profile.email || 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          color: '#666',
                                          fontSize: '0.75rem',
                                        }}
                                      >
                                        Contact Number
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        <HiPhone size={18} color="#666" />
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                          }}
                                        >
                                          {profile.contactNo || 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                )}

                                {!isEditing && (
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#666',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      User Type
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <HiIdentification
                                        size={18}
                                        color="#666"
                                      />
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '1rem',
                                          textTransform: 'capitalize',
                                        }}
                                      >
                                        {profile.userType || 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                )}
                              </Box>
                            </Box>

                            {/* Account Security Section */}
                            <Box sx={{ mb: 3 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  mb: 2,
                                  pb: 1,
                                  borderBottom: '2px solid #f0f0f0',
                                }}
                              >
                                <HiLockClosed
                                  size={24}
                                  color="#c10007"
                                  style={{ marginRight: '8px' }}
                                />
                                <Typography
                                  variant="h6"
                                  sx={{ fontWeight: 600, color: '#c10007' }}
                                >
                                  Account Security
                                </Typography>
                              </Box>

                              {isEditing ? (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                  }}
                                >
                                  <TextField
                                    label="Username"
                                    name="username"
                                    value={draft.username || ''}
                                    onChange={handleChange}
                                    size="small"
                                    fullWidth
                                    disabled
                                    required
                                    sx={{
                                      '& .MuiInputBase-input.Mui-disabled': {
                                        WebkitTextFillColor: '#666',
                                        cursor: 'not-allowed',
                                      },
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <HiUser
                                          size={20}
                                          color="#666"
                                          style={{ marginRight: '8px' }}
                                        />
                                      ),
                                    }}
                                  />

                                  {/* Password Change Card */}
                                  <Box
                                    sx={{
                                      bgcolor: '#f8f9fa',
                                      borderRadius: 2,
                                      p: 2.5,
                                      border: '1px solid #e0e0e0',
                                      mt: 1,
                                    }}
                                  >
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 2,
                                      }}
                                    >
                                      <HiLockClosed
                                        size={20}
                                        color="#c10007"
                                        style={{ marginRight: '8px' }}
                                      />
                                      <Typography
                                        variant="subtitle2"
                                        sx={{ fontWeight: 600, color: '#333' }}
                                      >
                                        Change Password (Optional)
                                      </Typography>
                                    </Box>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                      }}
                                    >
                                      <TextField
                                        label="Current Password"
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter current password"
                                      />
                                      <TextField
                                        label="New Password"
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        size="small"
                                        fullWidth
                                        placeholder="Enter new password"
                                        helperText="Leave blank to keep current password"
                                      />
                                      <TextField
                                        label="Confirm New Password"
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        size="small"
                                        fullWidth
                                        placeholder="Re-enter new password"
                                      />
                                    </Box>
                                  </Box>
                                </Box>
                              ) : (
                                <Box>
                                  <Typography
                                    variant="caption"
                                    sx={{ color: '#666', fontSize: '0.75rem' }}
                                  >
                                    Username
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                    }}
                                  >
                                    <HiUser size={18} color="#666" />
                                    <Typography
                                      sx={{ fontWeight: 600, fontSize: '1rem' }}
                                    >
                                      {profile.username || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Box>
                              )}
                            </Box>

                            {error && (
                              <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                              </Alert>
                            )}

                            {isEditing && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: {
                                    xs: 'stretch',
                                    md: 'center',
                                  },
                                  flexDirection: { xs: 'column', md: 'row' },
                                  gap: 2,
                                  pt: 3,
                                  mt: 2,
                                  borderTop: '2px solid #f0f0f0',
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  startIcon={<CloseIcon />}
                                  onClick={() => setOpenInfoCancelModal(true)}
                                  sx={{
                                    borderColor: '#999',
                                    color: '#666',
                                    order: { xs: 2, md: 1 },
                                    '&:hover': {
                                      borderColor: '#666',
                                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                                    },
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="contained"
                                  startIcon={<SaveIcon />}
                                  onClick={() => setShowConfirmModal(true)}
                                  sx={{
                                    bgcolor: '#c10007',
                                    order: { xs: 1, md: 2 },
                                    '&:hover': { bgcolor: '#a50006' },
                                  }}
                                >
                                  Save Changes
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}

                {activeTab === 1 && (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      mt: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        minWidth: '100%',
                        maxWidth: 900,
                        bgcolor: '#ffffff',
                        borderRadius: 2,
                        p: 2,
                        boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                        border: '2px solid #e6e6e6',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          borderRadius: '18px',
                          p: 3,
                          position: 'relative',
                          overflow: 'hidden',
                          bgcolor: 'transparent',
                        }}
                      >
                        {/* Top-right Edit Button */}
                        {!isEditingLicense && (
                          <IconButton
                            onClick={openLicenseEdit}
                            title="Edit License Information"
                            aria-label="Edit license information"
                            sx={{
                              position: 'absolute',
                              top: { xs: -8, md: 12 },
                              right: { xs: 8, md: 50 },
                              backgroundColor: '#fff',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              '&:hover': {
                                backgroundColor: '#1565c0',
                                transform: 'scale(1.05)',
                              },
                              zIndex: 10,
                              transition: 'all 0.2s',
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}

                        {/* License Information Section */}
                        <Box sx={{ mb: 3, mt: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mb: 2,
                              pb: 1,
                              borderBottom: '2px solid #f0f0f0',
                            }}
                          >
                            <BadgeIcon
                              sx={{ mr: 1, color: '#c10007', fontSize: 28 }}
                            />
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 600, color: '#c10007' }}
                            >
                              License Information
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: { xs: 'column', md: 'row' },
                              gap: 3,
                            }}
                          >
                            {/* Left Side - License Details */}
                            <Box
                              sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                              }}
                            >
                              {isEditingLicense ? (
                                <>
                                  <TextField
                                    label="License Number"
                                    value={draftLicenseNo}
                                    onChange={(e) => {
                                      const formatted = formatPhilippineLicense(
                                        e.target.value
                                      );
                                      setDraftLicenseNo(formatted);
                                    }}
                                    fullWidth
                                    placeholder="N01-23-456789"
                                    helperText="Format: NXX-YY-ZZZZZZ (e.g., N01-23-456789)"
                                    error={
                                      draftLicenseNo &&
                                      !validatePhilippineLicense(draftLicenseNo)
                                    }
                                    disabled
                                    sx={{
                                      '& .MuiInputBase-input.Mui-disabled': {
                                        WebkitTextFillColor: '#666',
                                        cursor: 'not-allowed',
                                      },
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <BadgeIcon
                                          sx={{ mr: 1, color: '#666' }}
                                        />
                                      ),
                                    }}
                                  />
                                  <TextField
                                    label="Restrictions"
                                    value={draftLicenseRestrictions}
                                    onChange={(e) =>
                                      setDraftLicenseRestrictions(
                                        e.target.value
                                      )
                                    }
                                    fullWidth
                                  />
                                  <TextField
                                    label="Expiration Date"
                                    value={draftLicenseExpiration}
                                    onChange={(e) =>
                                      setDraftLicenseExpiration(e.target.value)
                                    }
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                  />
                                </>
                              ) : (
                                <>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#666',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      License Number
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                      }}
                                    >
                                      <BadgeIcon
                                        sx={{ fontSize: 18, color: '#666' }}
                                      />
                                      <Typography
                                        sx={{
                                          fontWeight: 600,
                                          fontSize: '1rem',
                                        }}
                                      >
                                        {typeof licenseNumber === 'string'
                                          ? licenseNumber
                                          : 'N/A'}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#666',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Restrictions
                                    </Typography>
                                    <Typography
                                      sx={{ fontWeight: 600, fontSize: '1rem' }}
                                    >
                                      {typeof licenseRestrictions ===
                                        'string' && licenseRestrictions
                                        ? licenseRestrictions
                                        : 'None'}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: '#666',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      Expiration Date
                                    </Typography>
                                    <Typography
                                      sx={{ fontWeight: 600, fontSize: '1rem' }}
                                    >
                                      {licenseExpiration
                                        ? new Date(licenseExpiration)
                                            .toISOString()
                                            .split('T')[0]
                                        : 'N/A'}
                                    </Typography>
                                  </Box>
                                </>
                              )}
                            </Box>

                            {/* Right Side - License Image */}
                            <Box
                              sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 2,
                              }}
                            >
                              <Box
                                sx={{
                                  position: 'relative',
                                  border: '2px solid #e0e0e0',
                                  borderRadius: 3,
                                  p: 1,
                                  bgcolor: '#f8f9fa',
                                }}
                              >
                                <img
                                  src={
                                    isEditingLicense && previewLicenseImage
                                      ? previewLicenseImage
                                      : licenseImage
                                  }
                                  alt="License"
                                  style={{
                                    maxWidth: '300px',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    objectFit: 'contain',
                                    cursor: isEditingLicense
                                      ? 'default'
                                      : 'pointer',
                                    transition: 'transform 0.2s ease',
                                    opacity: licenseImageUploading ? 0.5 : 1,
                                  }}
                                  onClick={() =>
                                    !isEditingLicense &&
                                    setOpenLicenseModal(true)
                                  }
                                />
                              </Box>

                              {/* Upload/Change/Remove Buttons (Only in Edit Mode) */}
                              {isEditingLicense && (
                                <Stack
                                  direction="column"
                                  spacing={1.5}
                                  sx={{ width: '100%', maxWidth: 300 }}
                                >
                                  {licenseImageUploading ? (
                                    <CircularProgress size={24} />
                                  ) : (
                                    <>
                                      <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<PhotoCamera />}
                                        disabled={savingLicense}
                                        fullWidth
                                        sx={{
                                          borderColor: '#c10007',
                                          color: '#c10007',
                                          '&:hover': {
                                            borderColor: '#a50006',
                                            bgcolor: 'rgba(193, 0, 7, 0.04)',
                                          },
                                        }}
                                      >
                                        {previewLicenseImage
                                          ? 'Change Image'
                                          : 'Upload Image'}
                                        <input
                                          type="file"
                                          accept="image/jpeg,image/jpg,image/png,image/webp"
                                          hidden
                                          onChange={handleLicenseFileChange}
                                        />
                                      </Button>
                                      {previewLicenseImage && (
                                        <Button
                                          variant="outlined"
                                          color="error"
                                          fullWidth
                                          onClick={() => {
                                            setDraftLicenseImage(null);
                                            setPreviewLicenseImage(null);
                                          }}
                                          disabled={savingLicense}
                                        >
                                          Remove Image
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </Stack>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* Save / Cancel Buttons */}
                        {isEditingLicense && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: { xs: 'stretch', md: 'center' },
                              flexDirection: { xs: 'column', md: 'row' },
                              gap: 2,
                              pt: 3,
                              mt: 3,
                              borderTop: '2px solid #f0f0f0',
                            }}
                          >
                            <Button
                              variant="outlined"
                              startIcon={<CloseIcon />}
                              onClick={() => setShowLicenseCancelModal(true)}
                              disabled={savingLicense || licenseImageUploading}
                              sx={{
                                borderColor: '#999',
                                color: '#666',
                                order: { xs: 2, md: 1 },
                                '&:hover': {
                                  borderColor: '#666',
                                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                                },
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              startIcon={<SaveIcon />}
                              onClick={() => setShowLicenseConfirmModal(true)}
                              disabled={savingLicense || licenseImageUploading}
                              sx={{
                                bgcolor: '#c10007',
                                order: { xs: 1, md: 2 },
                                '&:hover': { bgcolor: '#a50006' },
                              }}
                            >
                              Save Changes
                            </Button>
                          </Box>
                        )}
                        {/* MODAL FOR LICENSE IMAGE */}
                        <Modal
                          open={openLicenseModal}
                          onClose={() => setOpenLicenseModal(false)}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              bgcolor: 'rgba(0,0,0,0.8)',
                              zIndex: 1300,
                              p: 2,
                            }}
                          >
                            <Box
                              sx={{
                                position: 'relative',
                                maxWidth: '95vw',
                                maxHeight: '95vh',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                              }}
                            >
                              <img
                                src={licenseImage}
                                alt="License Full Size"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  borderRadius: '12px',
                                  objectFit: 'contain',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                }}
                              />
                              <IconButton
                                onClick={() => setOpenLicenseModal(false)}
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: '#fff',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                  },
                                }}
                              >
                                <CloseIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        </Modal>
                      </Box>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Box>

      {/* Modals */}
      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        options={{
          title: 'Confirm Profile Changes',
          message: 'Please review your changes before saving to the database.',
          confirmText: 'Save Changes',
          cancelText: 'Cancel',
          confirmColor: 'primary',
          changes: getChanges(),
          loading: saving,
          showWarning: true,
        }}
      />

      <SaveCancelModal
        open={openInfoCancelModal}
        onClose={() => setOpenInfoCancelModal(false)}
        onConfirm={() => {
          handleCancel();
          setOpenInfoCancelModal(false);
        }}
        type="cancel"
      />

      <ConfirmationModal
        open={showLicenseConfirmModal}
        onClose={() => setShowLicenseConfirmModal(false)}
        onConfirm={handleLicenseSaveConfirm}
        options={{
          title: 'Confirm License Changes',
          message:
            'Please review your license changes before saving to the database.',
          confirmText: 'Save Changes',
          cancelText: 'Cancel',
          confirmColor: 'primary',
          changes: [
            ...(draftLicenseNo !== licenseNumber
              ? [
                  {
                    field: 'License No',
                    from: licenseNumber,
                    to: draftLicenseNo,
                  },
                ]
              : []),
            ...(draftLicenseRestrictions !== licenseRestrictions
              ? [
                  {
                    field: 'Restrictions',
                    from: licenseRestrictions,
                    to: draftLicenseRestrictions,
                  },
                ]
              : []),
            ...(draftLicenseExpiration !== licenseExpiration
              ? [
                  {
                    field: 'Expiration Date',
                    from: licenseExpiration,
                    to: draftLicenseExpiration,
                  },
                ]
              : []),
          ],
          loading: savingLicense,
          showWarning: true,
        }}
      />

      <SaveCancelModal
        open={showLicenseCancelModal}
        onClose={() => setShowLicenseCancelModal(false)}
        onConfirm={() => {
          handleLicenseCancelConfirm();
          setShowLicenseCancelModal(false);
        }}
        type="cancel"
      />

      {/* Avatar modal */}
      <Modal open={avatarOpen} onClose={() => setAvatarOpen(false)}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            bgcolor: 'rgba(0,0,0,0.7)',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={
                imagePreview ||
                profile.profileImageUrl ||
                'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
              }
              alt="Profile"
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
              }}
            />
            <IconButton
              onClick={() => setAvatarOpen(false)}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </Modal>

      {/* Success snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        open={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        phoneNumber={pendingPhoneNumber}
        purpose="phone_change"
        userId={JSON.parse(localStorage.getItem('userInfo'))?.id}
        userType="driver"
        onVerificationSuccess={handlePhoneVerificationSuccess}
        onVerificationError={handlePhoneVerificationError}
      />
    </Box>
  );
}
