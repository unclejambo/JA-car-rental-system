import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Modal,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../ui/components/Header';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Loading from '../../ui/components/Loading';
import {
  HiCog8Tooth,
  HiUser,
  HiMapPin,
  HiEnvelope,
  HiPhone,
  HiCake,
  HiIdentification,
  HiLink,
  HiLockClosed,
  HiBell,
} from 'react-icons/hi2';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useCustomerStore } from '../../store/customer';
import SaveCancelModal from '../../ui/components/modal/SaveCancelModal';
import { updateLicense, createLicenseForCustomer } from '../../store/license';
import ConfirmationModal from '../../ui/components/modal/ConfirmationModal';
import { FormControlLabel, Checkbox } from '@mui/material';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import PhoneVerificationModal from '../../components/PhoneVerificationModal';
import {
  formatPhilippineLicense,
  validatePhilippineLicense,
  getLicenseValidationError,
} from '../../utils/licenseFormatter';

export default function CustomerSettings() {
  // ✅ Added Snackbar state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // License save loading state
  const [savingLicense, setSavingLicense] = useState(false);
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile picture state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  // Phone verification state
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [pendingPhoneNumber, setPendingPhoneNumber] = useState('');
  const [pendingProfileChanges, setPendingProfileChanges] = useState(null);

  function getChanges() {
    const changes = [];
    Object.keys(profile).forEach((key) => {
      if (draft[key] !== profile[key]) {
        changes.push({ field: key, from: profile[key], to: draft[key] });
      }
    });

    if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
      changes.push({
        field: 'Password',
        from: '(hidden)',
        to: '(new password)',
      });
    }

    // ✅ Don't include notification preferences in confirmation modal
    // They are saved separately and should not require confirmation

    return changes;
  }

  const API_BASE = getApiBase();
  const authenticatedFetch = createAuthenticatedFetch(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = '/login';
  });

  function handleConfirmSave() {
    setSaving(true);
    let user = JSON.parse(localStorage.getItem('userInfo'));
    const customerId = user?.id;
    const fieldMap = {
      firstName: 'first_name',
      lastName: 'last_name',
      address: 'address',
      email: 'email',
      contactNumber: 'contact_no',
      birthdate: 'birthdate',
      username: 'username',
      password: 'password',
      socialMediaLink: 'fb_link',
    };
    const changedFields = {};
    Object.keys(draft).forEach((key) => {
      if (draft[key] !== profile[key] && fieldMap[key]) {
        changedFields[fieldMap[key]] = draft[key];
      }
    });

    // Check if phone number has changed
    const phoneNumberChanged = draft.contactNumber !== profile.contactNumber;

    // Include password fields only if user is changing password
    if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
      changedFields.password = passwordData.newPassword;
      changedFields.currentPassword = passwordData.currentPassword;
    }

    // If phone number changed, require verification first
    if (phoneNumberChanged) {
      setSaving(false);
      setShowConfirmModal(false);
      setPendingPhoneNumber(draft.contactNumber);
      setPendingProfileChanges({ changedFields, customerId });

      // Send OTP to new phone number
      sendPhoneOTP(draft.contactNumber);
      return;
    }

    // ✅ Calculate isRecUpdate value based on notification preferences
    // 0 = no notifications, 1 = SMS only, 2 = Email only, 3 = Both SMS and email
    let isRecUpdateValue = 0;
    if (receiveUpdatesPhone && receiveUpdatesEmail) {
      isRecUpdateValue = 3; // Both
    } else if (receiveUpdatesPhone) {
      isRecUpdateValue = 1; // SMS only
    } else if (receiveUpdatesEmail) {
      isRecUpdateValue = 2; // Email only
    }

    // Upload profile image if changed, then update customer with all changes including notifications
    const updatePromise = profileImage
      ? uploadProfileImage().then((imageUrl) => {
          if (imageUrl) {
            changedFields.profile_img_url = imageUrl;
          }
          return useCustomerStore
            .getState()
            .updateCustomer(customerId, changedFields);
        })
      : useCustomerStore.getState().updateCustomer(customerId, changedFields);

    updatePromise
      .then(async (updated) => {
        // ✅ Save notification settings separately using the dedicated endpoint
        // Only save if notification preferences have changed
        const notifChanged =
          receiveUpdatesPhone !== initialReceiveUpdatesPhone ||
          receiveUpdatesEmail !== initialReceiveUpdatesEmail;

        if (notifChanged) {
          try {
            const notificationResponse = await authenticatedFetch(
              `${API_BASE}/api/customers/me/notification-settings`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRecUpdate: isRecUpdateValue }),
              }
            );

            if (!notificationResponse.ok) {
              const _errorData = await notificationResponse.json();
            } else {
              const _result = await notificationResponse.json();

              // Update initial values to reflect saved state
              setInitialReceiveUpdatesPhone(receiveUpdatesPhone);
              setInitialReceiveUpdatesEmail(receiveUpdatesEmail);
            }
          } catch (_notifError) {
            // Silently fail notification preference update
          }
        }

        setProfile({
          firstName: updated.first_name || profile.firstName || '',
          lastName: updated.last_name || profile.lastName || '',
          address: updated.address || profile.address || '',
          email: updated.email || profile.email || '',
          contactNumber: updated.contact_no || profile.contactNumber || '',
          birthdate: updated.birthdate || profile.birthdate || '',
          username: updated.username || profile.username || '',
          password:
            typeof updated.password === 'string' && updated.password !== ''
              ? updated.password
              : draft.password || profile.password || '',
          socialMediaLink: updated.fb_link || profile.socialMediaLink || '',
          profileImageUrl:
            updated.profile_img_url || profile.profileImageUrl || '',
        });
        setProfileImage(null); // Clear the file after upload

        // ✅ Update sessionStorage cache and trigger header refresh
        if (updated.profile_img_url) {
          sessionStorage.setItem('profileImageUrl', updated.profile_img_url);
          // Dispatch custom event to notify Header component
          window.dispatchEvent(
            new CustomEvent('profileImageUpdated', {
              detail: { imageUrl: updated.profile_img_url },
            })
          );
        }

        // Reset password state
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsEditing(false);
        setShowConfirmModal(false);
        // ✅ Added success prompt
        setSuccessMessage('Profile updated successfully!');
        setShowSuccess(true);
      })
      .catch((err) => {})
      .finally(() => {
        setSaving(false);
      });
  }

  // Phone verification functions
  const sendPhoneOTP = async (phoneNumber) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/phone-verification/send-otp`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            purpose: 'phone_change',
            userId: JSON.parse(localStorage.getItem('userInfo'))?.id,
            userType: 'customer',
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setShowPhoneVerification(true);
      } else {
        alert('Failed to send verification code. Please try again.');
        setSaving(false);
      }
    } catch (error) {
      alert('Failed to send verification code. Please try again.');
      setSaving(false);
    }
  };

  const handlePhoneVerificationSuccess = async (data) => {
    setShowPhoneVerification(false);

    // Now proceed with the profile update
    if (pendingProfileChanges) {
      setSaving(true);
      const { changedFields, customerId } = pendingProfileChanges;

      // Calculate isRecUpdate value based on notification preferences
      let isRecUpdateValue = 0;
      if (receiveUpdatesPhone && receiveUpdatesEmail) {
        isRecUpdateValue = 3; // Both
      } else if (receiveUpdatesPhone) {
        isRecUpdateValue = 1; // SMS only
      } else if (receiveUpdatesEmail) {
        isRecUpdateValue = 2; // Email only
      }

      // Upload profile image if changed, then update customer with all changes
      const updatePromise = profileImage
        ? uploadProfileImage().then((imageUrl) => {
            if (imageUrl) {
              changedFields.profile_img_url = imageUrl;
            }
            return useCustomerStore
              .getState()
              .updateCustomer(customerId, changedFields);
          })
        : useCustomerStore.getState().updateCustomer(customerId, changedFields);

      updatePromise
        .then(async (updated) => {
          // Save notification settings if changed
          const notifChanged =
            receiveUpdatesPhone !== initialReceiveUpdatesPhone ||
            receiveUpdatesEmail !== initialReceiveUpdatesEmail;

          if (notifChanged) {
            try {
              const notificationResponse = await authenticatedFetch(
                `${API_BASE}/api/customers/me/notification-settings`,
                {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isRecUpdate: isRecUpdateValue }),
                }
              );

              if (notificationResponse.ok) {
                setInitialReceiveUpdatesPhone(receiveUpdatesPhone);
                setInitialReceiveUpdatesEmail(receiveUpdatesEmail);
              }
            } catch (notifError) {
              // Silently fail notification preference update
            }
          }

          // Update profile state
          setProfile({
            firstName: updated.first_name || profile.firstName || '',
            lastName: updated.last_name || profile.lastName || '',
            address: updated.address || profile.address || '',
            email: updated.email || profile.email || '',
            contactNumber: updated.contact_no || profile.contactNumber || '',
            birthdate: updated.birthdate || profile.birthdate || '',
            username: updated.username || profile.username || '',
            password:
              typeof updated.password === 'string' && updated.password !== ''
                ? updated.password
                : draft.password || profile.password || '',
            socialMediaLink: updated.fb_link || profile.socialMediaLink || '',
            profileImageUrl:
              updated.profile_img_url || profile.profileImageUrl || '',
          });
          setProfileImage(null);

          // Update sessionStorage cache
          if (updated.profile_img_url) {
            sessionStorage.setItem('profileImageUrl', updated.profile_img_url);
            window.dispatchEvent(
              new CustomEvent('profileImageUpdated', {
                detail: { imageUrl: updated.profile_img_url },
              })
            );
          }

          // Reset states
          setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          setPendingProfileChanges(null);
          setPendingPhoneNumber('');
          setIsEditing(false);
          setSuccessMessage('Profile and phone number updated successfully!');
          setShowSuccess(true);
        })
        .catch((err) => {
          alert('Failed to update profile. Please try again.');
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  const handlePhoneVerificationError = (error) => {
    setPendingProfileChanges(null);
    setPendingPhoneNumber('');
    setShowPhoneVerification(false);
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, _setLoading] = useState(true);
  const [error, _setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    address: '',
    email: '',
    contactNumber: '',
    birthdate: '',
    username: '',
    password: '',
    socialMediaLink: '',
  });

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [draft, setDraft] = useState(profile);

  // Password change block
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [activeTab, setActiveTab] = useState(
    parseInt(localStorage.getItem('customerSettingsTab') || '0', 10)
  );

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    localStorage.setItem('customerSettingsTab', newValue.toString());
  };

  const [openInfoSaveModal, setOpenInfoSaveModal] = useState(false);
  const [openInfoCancelModal, setOpenInfoCancelModal] = useState(false);
  const [openLicenseSaveModal, setOpenLicenseSaveModal] = useState(false);
  const [openLicenseCancelModal, setOpenLicenseCancelModal] = useState(false);

  const [receiveUpdatesPhone, setReceiveUpdatesPhone] = useState(false);
  const [receiveUpdatesEmail, setReceiveUpdatesEmail] = useState(false);
  const [initialReceiveUpdatesPhone, setInitialReceiveUpdatesPhone] =
    useState(false);
  const [initialReceiveUpdatesEmail, setInitialReceiveUpdatesEmail] =
    useState(false);

  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [hasNoLicense, setHasNoLicense] = useState(false); // Track if customer has no license
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseRestrictions, setLicenseRestrictions] = useState('');
  const [licenseExpiration, setLicenseExpiration] = useState('');
  const [licenseImage, setLicenseImage] = useState(
    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
  );
  const [draftLicenseNo, setDraftLicenseNo] = useState('');
  const [draftLicenseRestrictions, setDraftLicenseRestrictions] = useState('');
  const [draftLicenseExpiration, setDraftLicenseExpiration] = useState('');
  const [previewLicenseImage, setPreviewLicenseImage] = useState(null);
  const [draftLicenseImage, setDraftLicenseImage] = useState(null);
  const [licenseImageUploading, setLicenseImageUploading] = useState(false);
  const [openLicenseModal, setOpenLicenseModal] = useState(false);

  const { getCustomerById } = useCustomerStore();

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('userInfo'));
    const loadCustomer = async () => {
      try {
        _setLoading(true);
        _setError(null);
        const customer = await getCustomerById(user?.id);
        if (customer) {
          // Check if customer has a license
          const hasLicense =
            customer.driver_license_id !== null &&
            customer.driver_license !== null;
          setHasNoLicense(!hasLicense);

          const licenseNo = customer.driver_license?.driver_license_no || '';
          const licenseRestrictions =
            customer.driver_license?.restrictions || '';
          const licenseExpiration = customer.driver_license?.expiry_date || '';
          const licenseImage =
            customer.driver_license?.dl_img_url ||
            'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

          setLicenseNo(licenseNo);
          setLicenseRestrictions(licenseRestrictions);
          setLicenseExpiration(licenseExpiration);
          setLicenseImage(licenseImage);
          setImagePreview(customer.profile_img_url || ''); // ✅ Set profile image preview

          // ✅ Load notification preferences from isRecUpdate
          // 0 = no notifications, 1 = SMS only, 2 = Email only, 3 = Both SMS and email
          const notificationPref = customer.isRecUpdate ?? 0;
          const phoneChecked = notificationPref === 1 || notificationPref === 3;
          const emailChecked = notificationPref === 2 || notificationPref === 3;
          setReceiveUpdatesPhone(phoneChecked);
          setReceiveUpdatesEmail(emailChecked);
          setInitialReceiveUpdatesPhone(phoneChecked);
          setInitialReceiveUpdatesEmail(emailChecked);

          setProfile((prev) => ({
            ...prev,
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            address: customer.address || '',
            email: customer.email || '',
            contactNumber: customer.contact_no || '',
            username: customer.username || '',
            password: customer.password || '',
            socialMediaLink: customer.fb_link || '',
            profileImageUrl: customer.profile_img_url || '', // ✅ Store profile image URL
          }));
        }
      } catch (err) {
        _setError('Failed to load data. Please try again later.');
      } finally {
        _setLoading(false);
      }
    };
    loadCustomer();
  }, [getCustomerById]);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function handleEditToggle() {
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    // ✅ Reset notification preferences to initial values
    setReceiveUpdatesPhone(initialReceiveUpdatesPhone);
    setReceiveUpdatesEmail(initialReceiveUpdatesEmail);
    setIsEditing(false);
  }

  function handleSave() {
    setProfile(draft);
    setIsEditing(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((s) => ({ ...s, [name]: value }));
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((p) => ({ ...p, [name]: value }));
  };

  function handleSaveConfirm() {
    setProfile(draft);
    setIsEditing(false);
    setOpenInfoSaveModal(false);
  }

  function handleCancelConfirm() {
    setDraft(profile);
    // ✅ Reset notification preferences to initial values
    setReceiveUpdatesPhone(initialReceiveUpdatesPhone);
    setReceiveUpdatesEmail(initialReceiveUpdatesEmail);
    setIsEditing(false);
    setOpenInfoCancelModal(false);
  }

  // Handle license file selection
  function handleLicenseFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setSuccessMessage(validationError);
      setShowSuccess(true);
      return;
    }

    setDraftLicenseImage(file);
    setPreviewLicenseImage(URL.createObjectURL(file));
  }

  // Upload license image to Supabase
  async function uploadLicenseImage() {
    if (!draftLicenseImage) return null;

    setLicenseImageUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', draftLicenseImage);
      formData.append('licenseNumber', draftLicenseNo);
      formData.append('username', profile.username || '');

      const response = await fetch(`${getApiBase()}/api/storage/licenses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return null;
      }

      const result = await response.json();

      // Return the uploaded image URL (use filePath which contains the public URL)
      return result.filePath || result.url || result.publicUrl;
    } catch (error) {
      return null;
    } finally {
      setLicenseImageUploading(false);
    }
  }

  async function handleLicenseSaveConfirm() {
    // Validate license number format
    const licenseError = getLicenseValidationError(draftLicenseNo);
    if (licenseError) {
      setSuccessMessage(licenseError);
      setShowSuccess(true);
      return;
    }

    // Validate required fields
    if (!draftLicenseNo || !draftLicenseExpiration || !draftLicenseImage) {
      setSuccessMessage(
        'All license fields are required (License Number, Expiry Date, and License Image)'
      );
      setShowSuccess(true);
      return;
    }

    setSavingLicense(true);

    let user = JSON.parse(localStorage.getItem('userInfo'));
    const customerId = user?.id;

    try {
      // Check if customer is adding a new license or updating existing one
      if (hasNoLicense) {
        // Customer is adding a new license
        // Upload image first
        const uploadedImageUrl = await uploadLicenseImage();
        if (!uploadedImageUrl) {
          setSuccessMessage(
            'Failed to upload license image. Please try again.'
          );
          setShowSuccess(true);
          setSavingLicense(false);
          return;
        }

        const createData = {
          driver_license_no: draftLicenseNo,
          restrictions: draftLicenseRestrictions || '',
          expiry_date: draftLicenseExpiration,
          dl_img_url: uploadedImageUrl,
        };

        const result = await createLicenseForCustomer(customerId, createData);

        if (result.success) {
          setLicenseNo(result.license.driver_license_no);
          setLicenseRestrictions(result.license.restrictions || '');
          setLicenseExpiration(result.license.expiry_date);
          setLicenseImage(result.license.dl_img_url);
          setDraftLicenseImage(null);
          setPreviewLicenseImage(null);
          setIsEditingLicense(false);
          setHasNoLicense(false); // Customer now has a license
          setOpenLicenseSaveModal(false);
          setSuccessMessage("Driver's license added successfully!");
          setShowSuccess(true);
        } else {
          setSuccessMessage(result.error || 'Failed to add license');
          setShowSuccess(true);
        }
      } else {
        // Customer is updating existing license
        const customer = await getCustomerById(customerId);
        const licenseId = customer?.driver_license?.license_id;

        if (!licenseId) {
          setSuccessMessage(
            'License ID not found. Please refresh and try again.'
          );
          setShowSuccess(true);
          setSavingLicense(false);
          return;
        }

        // Upload image first if a new one was selected
        let uploadedImageUrl = licenseImage;
        if (draftLicenseImage) {
          uploadedImageUrl = await uploadLicenseImage();
          if (!uploadedImageUrl) {
            setSuccessMessage(
              'Failed to upload license image. Please try again.'
            );
            setShowSuccess(true);
            setSavingLicense(false);
            return;
          }
        }

        const updateData = {
          driver_license_no: draftLicenseNo || licenseNo,
          restrictions: draftLicenseRestrictions,
          expiry_date: draftLicenseExpiration,
          dl_img_url: uploadedImageUrl || '',
        };

        const response = await authenticatedFetch(
          `${API_BASE}/api/driver-license/${licenseId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        );

        const result = await response.json();

        if (response.ok) {
          setLicenseNo(result.driver_license_no || draftLicenseNo);
          setLicenseRestrictions(
            result.restrictions || updateData.restrictions
          );
          setLicenseExpiration(result.expiry_date || updateData.expiry_date);
          setLicenseImage(result.dl_img_url || uploadedImageUrl);
          setDraftLicenseImage(null);
          setPreviewLicenseImage(null);
          setIsEditingLicense(false);
          setOpenLicenseSaveModal(false);
          setOpenLicenseCancelModal(false);
          setSuccessMessage('License information updated successfully!');
          setShowSuccess(true);
        } else {
          setSuccessMessage(result.error || 'Failed to update license');
          setShowSuccess(true);
        }
      }
    } catch (error) {
      setSuccessMessage('Error saving license');
      setShowSuccess(true);
    } finally {
      setSavingLicense(false);
    }
  }

  function handleLicenseCancelConfirm() {
    setDraftLicenseNo(licenseNo);
    setDraftLicenseRestrictions(licenseRestrictions);
    setDraftLicenseExpiration(licenseExpiration);
    setPreviewLicenseImage(null);
    setDraftLicenseImage(null);
    setIsEditingLicense(false);
    setOpenLicenseCancelModal(false);
  }

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
      setSuccessMessage(validation);
      setShowSuccess(true);
      return;
    }

    setProfileImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target.result);
    };
    reader.readAsDataURL(file);
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

      // Update profile in database
      let user = JSON.parse(localStorage.getItem('userInfo'));
      const customerId = user?.id;
      const updateResponse = await useCustomerStore
        .getState()
        .updateCustomer(customerId, {
          profile_img_url: '',
        });

      if (updateResponse) {
        setSuccessMessage('Profile picture removed successfully!');
        setShowSuccess(true);
      }
    } catch (error) {
      setSuccessMessage('Failed to remove profile picture');
      setShowSuccess(true);
    } finally {
      setImageUploading(false);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    try {
      setImageUploading(true);

      let user = JSON.parse(localStorage.getItem('userInfo'));
      const customerId = user?.id;

      const formData = new FormData();
      formData.append('profileImage', profileImage);
      formData.append('userId', customerId || 'unknown');
      formData.append('userType', 'customer');

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
        result.data?.customer?.profile_img_url ||
        result.publicUrl;

      if (!imageUrl) {
        throw new Error('No image URL returned from upload');
      }

      // Update the preview immediately
      setImagePreview(imageUrl);

      return imageUrl;
    } catch (error) {
      setSuccessMessage('Failed to upload profile picture');
      setShowSuccess(true);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <title>Account Settings</title>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <CustomerSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 2, md: 3 },
            width: `calc(100% - 18.7dvw)`,
            ml: {
              xs: '0px',
              sm: '0px',
              md: '18.7dvw',
              lg: '18.7dvw',
            },
            '@media (max-width: 1024px)': {
              ml: '0px',
            },
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
              {/* Loading Indicator */}
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
                        Account Settings
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                      Manage your profile and license information
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      mt: 2,
                    }}
                  >
                    {/* MUI Tabs (Info / License) */}
                    <Box
                      sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                    >
                      <Box
                        sx={{ display: 'flex', justifyContent: 'flex-start' }}
                      >
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
                            '& .Mui-selected': {
                              color: '#c10007 !important',
                            },
                            '& .MuiTabs-indicator': {
                              backgroundColor: '#c10007',
                            },
                          }}
                        >
                          <Tab
                            label={
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <AccountCircleIcon style={{ marginRight: 8 }} />{' '}
                                Info
                              </span>
                            }
                          />
                          <Tab
                            label={
                              <span
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                }}
                              >
                                <BadgeIcon style={{ marginRight: 8 }} /> License
                              </span>
                            }
                          />
                        </Tabs>
                      </Box>
                    </Box>
                    {/* Settings Card */}
                    <Box
                      sx={{
                        maxWidth: '100%',
                        bgcolor: '#ffffff',
                        borderRadius: 3,
                        p: { xs: 2, md: 3 },
                        pb: isEditing ? 2 : 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        position: 'relative',
                      }}
                    >
                      {/* Info Tab */}
                      {activeTab === 0 && (
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
                          {/* Edit / Save controls */}
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
                            {/* Left: Avatar (stacked on mobile) */}
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
                                onClick={() => setAvatarOpen(true)}
                                sx={{
                                  width: { xs: 96, md: 120 },
                                  height: { xs: 96, md: 120 },
                                  position: { xs: 'static', md: 'absolute' },
                                  left: { md: 8 },
                                  top: { md: 25 },
                                  boxShadow: 2,
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s ease',
                                  border: imagePreview
                                    ? '3px solid #e0e0e0'
                                    : 'none',
                                  '&:hover': {
                                    transform: 'scale(1.05)',
                                  },
                                }}
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
                                    <CircularProgress
                                      size={20}
                                      sx={{ mt: 1 }}
                                    />
                                  )}
                                </Box>
                              )}
                            </Box>
                            {/* Right: Details */}
                            <Box
                              sx={{
                                flex: 1,
                                pl: { xs: 0, md: 6 },
                                width: '100%',
                              }}
                            >
                              {/* Personal Information Section */}
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
                                        value={draft.firstName}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                        disabled
                                        sx={{
                                          '& .MuiInputBase-input.Mui-disabled':
                                            {
                                              WebkitTextFillColor: '#666',
                                              cursor: 'not-allowed',
                                            },
                                        }}
                                      />
                                      <TextField
                                        label="Last Name"
                                        name="lastName"
                                        value={draft.lastName}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
                                        disabled
                                        sx={{
                                          '& .MuiInputBase-input.Mui-disabled':
                                            {
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
                                          {profile.firstName}
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
                                          {profile.lastName}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                  {isEditing ? (
                                    <TextField
                                      label="Address"
                                      name="address"
                                      value={draft.address}
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
                                          {profile.address}
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
                                        value={draft.email}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
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
                                        name="contactNumber"
                                        value={draft.contactNumber}
                                        onChange={handleChange}
                                        size="small"
                                        fullWidth
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
                                            {profile.email}
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
                                            {profile.contactNumber}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    </Box>
                                  )}
                                  {isEditing ? (
                                    <TextField
                                      label="Social Media Link"
                                      name="socialMediaLink"
                                      value={draft.socialMediaLink}
                                      onChange={handleChange}
                                      size="small"
                                      fullWidth
                                      placeholder="Facebook, Instagram, etc."
                                      InputProps={{
                                        startAdornment: (
                                          <HiLink
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
                                        Social Media Link
                                      </Typography>
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 1,
                                        }}
                                      >
                                        <HiLink size={18} color="#666" />
                                        <Typography
                                          sx={{
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                          }}
                                        >
                                          {profile.socialMediaLink ||
                                            'Not provided'}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                              </Box>

                              {/* Account Security Section */}
                              <Box sx={{ mb: 2 }}>
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
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 1,
                                    }}
                                  >
                                    {/* Username */}
                                    {!isEditing && (
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#666',
                                            fontSize: '0.75rem',
                                          }}
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
                                          <HiIdentification
                                            size={18}
                                            color="#666"
                                          />
                                          <Typography
                                            sx={{
                                              fontWeight: 600,
                                              fontSize: '1rem',
                                            }}
                                          >
                                            {profile.username}
                                          </Typography>
                                        </Box>
                                      </Box>
                                    )}
                                    {isEditing && (
                                      <Box>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#666',
                                            fontSize: '0.75rem',
                                            mb: 0.5,
                                            display: 'block',
                                          }}
                                        >
                                          Username
                                        </Typography>
                                        <TextField
                                          name="username"
                                          value={draft.username}
                                          onChange={handleChange}
                                          size="small"
                                          fullWidth
                                          disabled
                                          sx={{
                                            '& .MuiInputBase-input.Mui-disabled':
                                              {
                                                WebkitTextFillColor: '#666',
                                                cursor: 'not-allowed',
                                              },
                                          }}
                                          InputProps={{
                                            startAdornment: (
                                              <HiIdentification
                                                size={20}
                                                color="#666"
                                                style={{ marginRight: '8px' }}
                                              />
                                            ),
                                          }}
                                        />
                                      </Box>
                                    )}

                                    {/* Password change area (only during edit) */}
                                    {isEditing && (
                                      <Box
                                        sx={{
                                          mt: 2,
                                          p: 2.5,
                                          bgcolor: '#f8f9fa',
                                          borderRadius: 2,
                                          border: '1px solid #e0e0e0',
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
                                            sx={{
                                              fontWeight: 600,
                                              color: '#c10007',
                                            }}
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
                                          />
                                          <TextField
                                            label="New Password"
                                            type="password"
                                            name="newPassword"
                                            value={passwordData.newPassword}
                                            onChange={handlePasswordChange}
                                            size="small"
                                            fullWidth
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
                                          />
                                        </Box>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              </Box>

                              {/* Notification Preferences Section */}
                              <Box sx={{ mb: 2 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    mb: 2,
                                    pb: 1,
                                    borderBottom: '2px solid #f0f0f0',
                                  }}
                                >
                                  <HiBell
                                    size={24}
                                    color="#c10007"
                                    style={{ marginRight: '8px' }}
                                  />
                                  <Typography
                                    variant="h6"
                                    sx={{ fontWeight: 600, color: '#c10007' }}
                                  >
                                    Notification Preferences
                                  </Typography>
                                </Box>
                                {/* CheckBox */}
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 0,
                                    pl: 1,
                                  }}
                                >
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={receiveUpdatesPhone}
                                        onChange={(e) =>
                                          setReceiveUpdatesPhone(
                                            e.target.checked
                                          )
                                        }
                                        color="primary"
                                        disabled={!isEditing}
                                      />
                                    }
                                    label="Receive updates via SMS"
                                  />
                                  <FormControlLabel
                                    control={
                                      <Checkbox
                                        checked={receiveUpdatesEmail}
                                        onChange={(e) =>
                                          setReceiveUpdatesEmail(
                                            e.target.checked
                                          )
                                        }
                                        color="primary"
                                        disabled={!isEditing}
                                      />
                                    }
                                    label="Receive updates via Email"
                                  />
                                </Box>
                                
                                {/* SMS/Email Notification Examples */}
                                <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                                    📱 What notifications will I receive?
                                  </Typography>
                                  <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                                    <strong>You'll be notified about:</strong>
                                  </Typography>
                                  <Box component="ul" sx={{ pl: 2, mt: 0.5, fontSize: '0.75rem' }}>
                                    <li>Booking confirmations & status updates</li>
                                    <li>Payment reminders (24 hours before deadline)</li>
                                    <li>Return reminders (24 hours before due date)</li>
                                    <li>Overdue alerts (if vehicle not returned on time)</li>
                                    <li>Agreement signing requests</li>
                                    <li>Extension approvals/rejections</li>
                                    <li>Cancellation confirmations</li>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    💡 <em>Critical notifications (overdue, cancellations) are always sent regardless of your preferences.</em>
                                  </Typography>
                                </Alert>
                                
                                {isEditing && (
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      justifyContent: {
                                        xs: 'stretch',
                                        md: 'center',
                                      },
                                      flexDirection: {
                                        xs: 'column',
                                        md: 'row',
                                      },
                                      gap: 1,
                                      width: '100%',
                                      mt: 1,
                                    }}
                                  >
                                    <Button
                                      variant="outlined"
                                      startIcon={<CloseIcon />}
                                      onClick={() =>
                                        setOpenInfoCancelModal(true)
                                      }
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
                      )}
                      {/* License Tab */}
                      {activeTab === 1 && (
                        <Box
                          sx={{
                            borderRadius: '18px',
                            p: 3,
                            position: 'relative',
                            overflow: 'hidden',
                            bgcolor: 'transparent',
                          }}
                        >
                          {/* Show "Add License" button if customer has no license and not editing */}
                          {hasNoLicense && !isEditingLicense && (
                            <Box
                              sx={{
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 2,
                                py: 6,
                                bgcolor: '#f8f9fa',
                                borderRadius: 3,
                                border: '2px dashed #e0e0e0',
                              }}
                            >
                              <BadgeIcon
                                sx={{
                                  fontSize: 80,
                                  color: '#c10007',
                                  opacity: 0.5,
                                }}
                              />
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, color: '#333' }}
                              >
                                No Driver's License on Record
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                textAlign="center"
                                sx={{ maxWidth: 400 }}
                              >
                                You haven't added your driver's license yet. Add
                                one to enable self-drive bookings.
                              </Typography>
                              <Button
                                variant="contained"
                                color="primary"
                                startIcon={<BadgeIcon />}
                                onClick={() => {
                                  setDraftLicenseNo('');
                                  setDraftLicenseRestrictions('');
                                  setDraftLicenseExpiration('');
                                  setPreviewLicenseImage(null);
                                  setDraftLicenseImage(null);
                                  setIsEditingLicense(true);
                                }}
                                sx={{
                                  mt: 2,
                                  bgcolor: '#c10007',
                                  '&:hover': { bgcolor: '#a50006' },
                                }}
                              >
                                Add Driver's License
                              </Button>
                            </Box>
                          )}

                          {/* Show license form when editing or if has license */}
                          {(!hasNoLicense || isEditingLicense) && (
                            <>
                              {/* Top-right Edit Button - only show if has license and not editing */}
                              {!hasNoLicense && !isEditingLicense && (
                                <IconButton
                                  onClick={() => {
                                    setDraftLicenseNo(licenseNo);
                                    setDraftLicenseRestrictions(
                                      licenseRestrictions
                                    );
                                    setDraftLicenseExpiration(
                                      licenseExpiration
                                    );
                                    setPreviewLicenseImage(null);
                                    setDraftLicenseImage(null);
                                    setIsEditingLicense(true);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    top: { xs: -8, md: 12 },
                                    right: { xs: 8, md: 50 },
                                    backgroundColor: '#fff',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    zIndex: 10,
                                    '&:hover': { backgroundColor: '#1565c0' },
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              )}

                              {/* License Information Section */}
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
                                  <BadgeIcon
                                    sx={{
                                      mr: 1,
                                      color: '#c10007',
                                      fontSize: 28,
                                    }}
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
                                          label="License Number *"
                                          value={draftLicenseNo}
                                          onChange={(e) => {
                                            const formatted =
                                              formatPhilippineLicense(
                                                e.target.value
                                              );
                                            setDraftLicenseNo(formatted);
                                          }}
                                          fullWidth
                                          required
                                          placeholder="N01-23-456789"
                                          helperText="Format: NXX-YY-ZZZZZZ (e.g., N01-23-456789)"
                                          error={
                                            draftLicenseNo &&
                                            !validatePhilippineLicense(
                                              draftLicenseNo
                                            )
                                          }
                                          disabled
                                          sx={{
                                            '& .MuiInputBase-input.Mui-disabled':
                                              {
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
                                          placeholder="e.g., 1, 2, 3"
                                        />
                                        <TextField
                                          label="Expiration Date *"
                                          value={draftLicenseExpiration}
                                          onChange={(e) =>
                                            setDraftLicenseExpiration(
                                              e.target.value
                                            )
                                          }
                                          type="date"
                                          InputLabelProps={{ shrink: true }}
                                          fullWidth
                                          required
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
                                              sx={{
                                                fontSize: 18,
                                                color: '#666',
                                              }}
                                            />
                                            <Typography
                                              sx={{
                                                fontWeight: 600,
                                                fontSize: '1rem',
                                              }}
                                            >
                                              {typeof licenseNo === 'string'
                                                ? licenseNo
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
                                            sx={{
                                              fontWeight: 600,
                                              fontSize: '1rem',
                                            }}
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
                                            sx={{
                                              fontWeight: 600,
                                              fontSize: '1rem',
                                            }}
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
                                          isEditingLicense &&
                                          previewLicenseImage
                                            ? previewLicenseImage
                                            : licenseImage
                                        }
                                        alt="License"
                                        style={{
                                          maxWidth: '300px',
                                          maxHeight: '200px',
                                          borderRadius: '8px',
                                          boxShadow:
                                            '0 2px 8px rgba(0,0,0,0.1)',
                                          objectFit: 'contain',
                                          cursor: isEditingLicense
                                            ? 'default'
                                            : 'pointer',
                                          transition: 'transform 0.2s ease',
                                          opacity: licenseImageUploading
                                            ? 0.5
                                            : 1,
                                        }}
                                        onClick={() =>
                                          !isEditingLicense &&
                                          !hasNoLicense &&
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
                                                  bgcolor:
                                                    'rgba(193, 0, 7, 0.04)',
                                                },
                                              }}
                                            >
                                              {previewLicenseImage
                                                ? 'Change Image'
                                                : 'Upload Image *'}
                                              <input
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                hidden
                                                onChange={
                                                  handleLicenseFileChange
                                                }
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
                                    justifyContent: {
                                      xs: 'stretch',
                                      md: 'center',
                                    },
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
                                    onClick={() =>
                                      setOpenLicenseCancelModal(true)
                                    }
                                    disabled={
                                      savingLicense || licenseImageUploading
                                    }
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
                                    onClick={() =>
                                      setOpenLicenseSaveModal(true)
                                    }
                                    disabled={
                                      savingLicense || licenseImageUploading
                                    }
                                    sx={{
                                      bgcolor: '#c10007',
                                      order: { xs: 1, md: 2 },
                                      '&:hover': { bgcolor: '#a50006' },
                                    }}
                                  >
                                    {hasNoLicense
                                      ? 'Add License'
                                      : 'Save Changes'}
                                  </Button>
                                </Box>
                              )}
                            </>
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
                                {/* Close button (top right) */}
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
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
      {/* ---- MODALS ---- */}
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
          showWarning: false, // ✅ Removed warning for notification preferences
        }}
      />
      <SaveCancelModal
        open={openInfoSaveModal}
        onClose={() => setOpenInfoSaveModal(false)}
        onConfirm={handleSaveConfirm}
        type="save"
      />
      <SaveCancelModal
        open={openInfoCancelModal}
        onClose={() => setOpenInfoCancelModal(false)}
        onConfirm={handleCancelConfirm}
        type="cancel"
      />
      <ConfirmationModal
        open={openLicenseSaveModal}
        onClose={() => setOpenLicenseSaveModal(false)}
        onConfirm={handleLicenseSaveConfirm}
        options={{
          title: hasNoLicense
            ? 'Confirm Add License'
            : 'Confirm License Changes',
          message: hasNoLicense
            ? 'Please review your license information before adding it to the database.'
            : 'Please review your license changes before saving to the database.',
          confirmText: hasNoLicense ? 'Add License' : 'Save Changes',
          cancelText: 'Cancel',
          confirmColor: 'primary',
          changes: hasNoLicense
            ? [
                {
                  field: 'License No',
                  from: 'None',
                  to: draftLicenseNo || 'Not provided',
                },
                {
                  field: 'Restrictions',
                  from: 'None',
                  to: draftLicenseRestrictions || 'None',
                },
                {
                  field: 'Expiration Date',
                  from: 'None',
                  to: draftLicenseExpiration || 'Not provided',
                },
                {
                  field: 'License Image',
                  from: 'None',
                  to: draftLicenseImage ? 'Uploaded' : 'Not uploaded',
                },
              ]
            : [
                ...(draftLicenseNo !== licenseNo
                  ? [
                      {
                        field: 'License No',
                        from: licenseNo || 'None',
                        to: draftLicenseNo,
                      },
                    ]
                  : []),
                ...(draftLicenseRestrictions !== licenseRestrictions
                  ? [
                      {
                        field: 'Restrictions',
                        from: licenseRestrictions || 'None',
                        to: draftLicenseRestrictions || 'None',
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
                ...(draftLicenseImage
                  ? [
                      {
                        field: 'License Image',
                        from: 'Current',
                        to: 'New upload',
                      },
                    ]
                  : []),
              ],
          loading: savingLicense,
          showWarning: true,
        }}
      />
      <SaveCancelModal
        open={openLicenseCancelModal}
        onClose={() => setOpenLicenseCancelModal(false)}
        onConfirm={handleLicenseCancelConfirm}
        type="cancel"
      />
      {/* Avatar Modal — single instance kept at bottom (shows full-size) */}
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
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // ⬅️ moved to top-right
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        open={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        phoneNumber={pendingPhoneNumber}
        purpose="phone_change"
        userId={JSON.parse(localStorage.getItem('userInfo'))?.id}
        userType="customer"
        onVerificationSuccess={handlePhoneVerificationSuccess}
        onVerificationError={handlePhoneVerificationError}
      />
    </>
  );
}
