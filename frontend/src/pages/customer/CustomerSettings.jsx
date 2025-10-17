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
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../ui/components/Header';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import Loading from '../../ui/components/Loading';
import { HiCog8Tooth } from 'react-icons/hi2';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useCustomerStore } from '../../store/customer';
import SaveCancelModal from '../../ui/components/modal/SaveCancelModal';
import { updateLicense } from '../../store/license';
import ConfirmationModal from '../../ui/components/modal/ConfirmationModal';
import { FormControlLabel, Checkbox } from '@mui/material';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import PhoneVerificationModal from '../../components/PhoneVerificationModal';

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
            console.log('🔔 Saving notification settings...');
            console.log(
              '📱 SMS:',
              receiveUpdatesPhone,
              '📧 Email:',
              receiveUpdatesEmail
            );

            const notificationResponse = await authenticatedFetch(
              `${API_BASE}/api/customers/me/notification-settings`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRecUpdate: isRecUpdateValue }),
              }
            );

            if (!notificationResponse.ok) {
              const errorData = await notificationResponse.json();
              console.error(
                'Failed to update notification settings:',
                errorData
              );
            } else {
              const result = await notificationResponse.json();
              console.log('✅ Notification settings saved:', result);

              // Update initial values to reflect saved state
              setInitialReceiveUpdatesPhone(receiveUpdatesPhone);
              setInitialReceiveUpdatesEmail(receiveUpdatesEmail);
            }
          } catch (notifError) {
            console.error('Error updating notification settings:', notifError);
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
      .catch((err) => {
        console.error('Failed to update customer:', err);
      })
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
        console.error('Failed to send OTP:', data.message);
        alert('Failed to send verification code. Please try again.');
        setSaving(false);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('Failed to send verification code. Please try again.');
      setSaving(false);
    }
  };

  const handlePhoneVerificationSuccess = async (data) => {
    console.log('Phone verified successfully:', data);
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
              console.error(
                'Error updating notification settings:',
                notifError
              );
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
          console.error('Failed to update customer:', err);
          alert('Failed to update profile. Please try again.');
        })
        .finally(() => {
          setSaving(false);
        });
    }
  };

  const handlePhoneVerificationError = (error) => {
    console.error('Phone verification failed:', error);
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
          const licenseNo =
            typeof customer.driver_license_no === 'string'
              ? customer.driver_license_no
              : customer.driver_license_no?.driver_license_no || '';
          const licenseRestrictions =
            typeof customer.driver_license?.restrictions === 'string'
              ? customer.driver_license?.restrictions
              : customer.driver_license?.restrictions?.restrictions || '';
          const licenseExpiration =
            typeof customer.driver_license?.expiry_date === 'string'
              ? customer.driver_license?.expiry_date
              : customer.driver_license?.expiry_date?.expiry_date || '';
          const licenseImage =
            customer.driver_license?.dl_img_url ||
            customer.DriverLicense?.dl_img_url ||
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
            profileImageUrl: customer.profile_img_url || '', // ✅ Store profile image URL
          }));
        }
      } catch (err) {
        console.error('Error loading customer:', err);
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
        console.error('Upload failed:', errorData);
        return null;
      }

      const result = await response.json();
      console.log('📦 Customer license upload response:', result);

      // Return the uploaded image URL (use filePath which contains the public URL)
      return result.filePath || result.url || result.publicUrl;
    } catch (error) {
      console.error('Error uploading license image:', error);
      return null;
    } finally {
      setLicenseImageUploading(false);
    }
  }

  async function handleLicenseSaveConfirm() {
    setSavingLicense(true);

    try {
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
          return; // Stop execution if upload fails
        }
      }

      const updateData = {
        restrictions: draftLicenseRestrictions,
        expiry_date: draftLicenseExpiration,
        dl_img_url: uploadedImageUrl || '',
      };

      console.log('🚀 Sending to backend:', updateData);

      const response = await fetch(
        `http://localhost:3001/api/driver-license/${draftLicenseNo}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log('✅ License updated:', result);
        setLicenseRestrictions(updateData.restrictions);
        setLicenseExpiration(updateData.expiry_date);
        setLicenseImage(uploadedImageUrl);
        setDraftLicenseImage(null); // Clear draft after successful save
        setPreviewLicenseImage(null); // Clear preview
        setIsEditingLicense(false);
        setOpenLicenseSaveModal(false);
        setOpenLicenseCancelModal(false);
        setSuccessMessage('License information updated successfully!');
        setShowSuccess(true);
      } else {
        console.error('❌ Failed to update license:', result);
        setSuccessMessage(result.error || 'Failed to update license');
        setShowSuccess(true);
      }
    } catch (error) {
      console.error('❌ Error updating license:', error);
      setSuccessMessage('Error updating license');
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
      console.error('Error removing image:', error);
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

      console.log('🚀 Uploading profile image...');

      const response = await authenticatedFetch(
        `${API_BASE}/api/storage/profile-images`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const result = await response.json();
      console.log('📦 Upload response:', result);

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

      console.log('✅ Image uploaded successfully:', imageUrl);

      // Update the preview immediately
      setImagePreview(imageUrl);

      return imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setSuccessMessage('Failed to upload profile picture');
      setShowSuccess(true);
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <CustomerSideBar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Loading />
        </Box>
      </Box>
    );
  }

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
                backgroundColor: '#f9f9f9',
                p: { xs: 1, sm: 2, md: 2, lg: 2 },
                boxShadow:
                  '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 4px 0 6px -1px rgba(0, 0, 0, 0.1), -4px 0 6px -1px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                height: 'auto',
                boxSizing: 'border-box',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Page Header */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 'bold', color: '#c10007' }}
                    >
                      <HiCog8Tooth
                        style={{ verticalAlign: '-3px', marginRight: '8px' }}
                      />
                      Account Settings
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Manage your profile and license information
                  </Typography>
                </Box>
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
                {/* Settings Card */}
                <Box
                  sx={{
                    maxWidth: '100%',
                    bgcolor: '#ffffff',
                    borderRadius: 2,
                    p: 2,
                    pb: isEditing ? 1 : 2,
                    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                    border: '2px solid #e6e6e6',
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
                          position: { xs: 'relative', md: 'relative' },
                          top: { md: 12 },
                          right: { md: 12 },
                          zIndex: 30,
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
                              top: 10,
                              right: 40,
                              backgroundColor: '#fff',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                              '&:hover': { backgroundColor: '#f5f5f5' },
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
                                <CircularProgress size={20} sx={{ mt: 1 }} />
                              )}
                            </Box>
                          )}
                        </Box>
                        {/* Right: Details */}
                        <Box
                          sx={{ flex: 1, pl: { xs: 0, md: 6 }, width: '100%' }}
                        >
                          <Box
                            sx={{
                              mb: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            {isEditing ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  flexDirection: { xs: 'column', md: 'row' },
                                }}
                              >
                                <TextField
                                  label="First Name"
                                  name="firstName"
                                  value={draft.firstName}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                />
                                <TextField
                                  label="Last Name"
                                  name="lastName"
                                  value={draft.lastName}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                />
                              </Box>
                            ) : (
                              <Typography sx={{ fontWeight: 700 }}>
                                First Name:{' '}
                                <span style={{ fontWeight: 400 }}>
                                  {profile.firstName}
                                </span>
                              </Typography>
                            )}
                            {!isEditing && (
                              <Typography sx={{ fontWeight: 700 }}>
                                Last Name:{' '}
                                <span style={{ fontWeight: 400 }}>
                                  {profile.lastName}
                                </span>
                              </Typography>
                            )}
                            {isEditing ? (
                              <TextField
                                label="Address"
                                name="address"
                                value={draft.address}
                                onChange={handleChange}
                                size="small"
                                fullWidth
                              />
                            ) : (
                              <Typography sx={{ fontWeight: 700 }}>
                                Address:{' '}
                                <span style={{ fontWeight: 400 }}>
                                  {profile.address}
                                </span>
                              </Typography>
                            )}
                            {isEditing ? (
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  flexDirection: { xs: 'column', md: 'row' },
                                }}
                              >
                                <TextField
                                  label="Email"
                                  name="email"
                                  value={draft.email}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                />
                                <TextField
                                  label="Contact Number"
                                  name="contactNumber"
                                  value={draft.contactNumber}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                />
                              </Box>
                            ) : (
                              <>
                                <Typography sx={{ fontWeight: 700 }}>
                                  Email:{' '}
                                  <span style={{ fontWeight: 400 }}>
                                    {profile.email}
                                  </span>
                                </Typography>
                                <Typography sx={{ fontWeight: 700 }}>
                                  Contact Number:{' '}
                                  <span style={{ fontWeight: 400 }}>
                                    {profile.contactNumber}
                                  </span>
                                </Typography>
                              </>
                            )}
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 2,
                              width: { xs: '100%', md: '70%' },
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
                              <Typography sx={{ fontWeight: 700 }}>
                                Username:
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  bgcolor: '#e9e9e9',
                                  borderRadius: 4,
                                  p: 1.2,
                                }}
                              >
                                {isEditing ? (
                                  <TextField
                                    name="username"
                                    value={draft.username}
                                    onChange={handleChange}
                                    size="small"
                                    sx={{ flex: 1, background: 'transparent' }}
                                    fullWidth
                                  />
                                ) : (
                                  <Typography sx={{ flex: 1, pl: 2 }}>
                                    {profile.username}
                                  </Typography>
                                )}
                              </Box>

                              {/* Password change area (only during edit) */}
                              {isEditing && (
                                <Box
                                  sx={{
                                    mt: 2,
                                    p: 2,
                                    bgcolor: '#f5f5f5',
                                    borderRadius: 2,
                                  }}
                                >
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ mb: 2, fontWeight: 600 }}
                                  >
                                    Change Password (Optional)
                                  </Typography>
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
                            {/* CheckBox */}
                            <Box
                              sx={{
                                mt: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0,
                              }}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={receiveUpdatesPhone}
                                    onChange={(e) =>
                                      setReceiveUpdatesPhone(e.target.checked)
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
                                      setReceiveUpdatesEmail(e.target.checked)
                                    }
                                    color="primary"
                                    disabled={!isEditing}
                                  />
                                }
                                label="Receive updates via Email"
                              />
                            </Box>
                            {isEditing && (
                              <Box
                                sx={{
                                  display: 'flex',
                                  flexDirection: { xs: 'column', md: 'row' },
                                  gap: 1,
                                  width: '100%',
                                  mt: 1,
                                }}
                              >
                                <Button
                                  variant="contained"
                                  color="primary"
                                  size="small"
                                  startIcon={<SaveIcon />}
                                  onClick={() => setShowConfirmModal(true)}
                                >
                                  Save Changes
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="inherit"
                                  size="small"
                                  startIcon={<CloseIcon />}
                                  onClick={() => setOpenInfoCancelModal(true)}
                                >
                                  Cancel
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
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        gap: 4,
                        minHeight: '230px',
                      }}
                    >
                      {/* Top-right Edit Button */}
                      {!isEditingLicense && (
                        <IconButton
                          onClick={() => {
                            setDraftLicenseNo(licenseNo);
                            setDraftLicenseRestrictions(licenseRestrictions);
                            setDraftLicenseExpiration(licenseExpiration);
                            setPreviewLicenseImage(null);
                            setDraftLicenseImage(null);
                            setIsEditingLicense(true);
                          }}
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 50,
                            backgroundColor: '#fff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            '&:hover': { backgroundColor: '#f5f5f5' },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      )}
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
                              label="License No"
                              value={draftLicenseNo}
                              fullWidth
                              InputProps={{
                                readOnly: true,
                              }}
                              sx={{
                                '& .MuiInputBase-input.Mui-disabled': {
                                  WebkitTextFillColor: '#000', // ensure black text color
                                },
                              }}
                            />
                            <TextField
                              label="Restrictions"
                              value={draftLicenseRestrictions}
                              onChange={(e) =>
                                setDraftLicenseRestrictions(e.target.value)
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
                            <Typography sx={{ fontWeight: 700 }}>
                              License No:{' '}
                              <span style={{ fontWeight: 400 }}>
                                {typeof licenseNo === 'string' ? licenseNo : ''}
                              </span>
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              Restrictions:{' '}
                              <span style={{ fontWeight: 400 }}>
                                {typeof licenseRestrictions === 'string'
                                  ? licenseRestrictions
                                  : ''}
                              </span>
                            </Typography>
                            <Typography sx={{ fontWeight: 700 }}>
                              Expiration Date:{' '}
                              <span style={{ fontWeight: 400 }}>
                                {licenseExpiration
                                  ? new Date(licenseExpiration)
                                      .toISOString()
                                      .split('T')[0]
                                  : 'N/A'}
                              </span>
                            </Typography>
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
                        <Box sx={{ position: 'relative' }}>
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
                              borderRadius: '12px',
                              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                              objectFit: 'contain',
                              cursor: isEditingLicense ? 'default' : 'pointer',
                              transition: 'transform 0.2s ease',
                              opacity: licenseImageUploading ? 0.5 : 1,
                            }}
                            onClick={() =>
                              !isEditingLicense && setOpenLicenseModal(true)
                            }
                          />
                          {/* Upload/Change/Remove Buttons (Only in Edit Mode) */}
                          {isEditingLicense && (
                            <Box
                              sx={{
                                mt: 2,
                                display: 'flex',
                                gap: 1,
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              {licenseImageUploading ? (
                                <CircularProgress size={24} />
                              ) : (
                                <>
                                  <Button
                                    variant="contained"
                                    component="label"
                                    startIcon={<PhotoCamera />}
                                    disabled={savingLicense}
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
                                      size="small"
                                      onClick={() => {
                                        setDraftLicenseImage(null);
                                        setPreviewLicenseImage(null);
                                      }}
                                      disabled={savingLicense}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Box>
                      {/* Save / Cancel Buttons (centered at bottom) */}
                      {isEditingLicense && (
                        <Box
                          sx={{
                            position: { xs: 'static', md: 'absolute' },
                            mt: { xs: 3, md: 0 },
                            bottom: { md: 10 },
                            left: { md: '50%' },
                            transform: { md: 'translateX(-50%)' },
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 2,
                            width: { xs: '100%', md: 'auto' },
                          }}
                        >
                          <Button
                            variant="contained"
                            color="primary"
                            startIcon={<SaveIcon />}
                            onClick={() => setOpenLicenseSaveModal(true)}
                            disabled={savingLicense || licenseImageUploading}
                          >
                            Save Changes
                          </Button>
                          <Button
                            variant="outlined"
                            color="inherit"
                            startIcon={<CloseIcon />}
                            onClick={() => setOpenLicenseCancelModal(true)}
                            disabled={savingLicense || licenseImageUploading}
                          >
                            Cancel
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
          title: 'Confirm License Changes',
          message:
            'Please review your license changes before saving to the database.',
          confirmText: 'Save Changes',
          cancelText: 'Cancel',
          confirmColor: 'primary',
          changes: [
            ...(draftLicenseNo !== licenseNo
              ? [{ field: 'License No', from: licenseNo, to: draftLicenseNo }]
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
