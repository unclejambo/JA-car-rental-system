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
import { HiCog8Tooth } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import { updateLicense } from '../../store/license'; // same approach as CustomerSettings

export default function DriverSettings() {
  // Tabs
  const [activeTab, setActiveTab] = useState(0);
  const handleTabChange = (event, newValue) => setActiveTab(newValue);

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
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseRestrictions, setLicenseRestrictions] = useState('');
  const [licenseExpiration, setLicenseExpiration] = useState('');
  const [licenseImage, setLicenseImage] = useState('/license.png');

  const [draftLicenseNo, setDraftLicenseNo] = useState('');
  const [draftLicenseRestrictions, setDraftLicenseRestrictions] = useState('');
  const [draftLicenseExpiration, setDraftLicenseExpiration] = useState('');
  const [draftLicenseImage, setDraftLicenseImage] = useState(null);
  const [previewLicenseImage, setPreviewLicenseImage] = useState(null);

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
      console.log('Driver profile data:', result.data);
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
      };

      setProfile(driverData);
      setDraft(driverData);

      // license fields (defensive)
      setLicenseNumber(data.license_number || data.driver_license_no || '');
      setLicenseRestrictions(
        data.license_restrictions ||
          data.license?.restrictions ||
          data.licenseRestrictions ||
          ''
      );
      setLicenseExpiration(
        data.license_expiry || // <-- this is the correct key
          data.license_expiration ||
          data.license?.expiry_date ||
          data.license?.expiration_date ||
          data.DriverLicense?.expiry_date ||
          data.driver_license_expiry ||
          data.licenseExpiration ||
          ''
      );
      setLicenseImage(
        data.license_image_url ||
          data.DriverLicense?.dl_img_url ||
          data.license_img ||
          'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
      );
    } catch (err) {
      console.error('Error fetching profile:', err);
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
      const updateData = {
        first_name: draft.firstName,
        last_name: draft.lastName,
        contact_no: draft.contactNo,
        email: draft.email,
        username: draft.username,
        address: draft.address,
        license_number: licenseNumber, // ✅ backend requires this
      };

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
        };

        setProfile(updatedProfile);
        setDraft(updatedProfile);

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
      console.error('Error updating profile:', error);
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
      setDraftLicenseImage(file);
      setPreviewLicenseImage(URL.createObjectURL(file));
    }
  };

  const handleLicenseSaveConfirm = async () => {
    setSaving(true);

    try {
      const updateData = {
        restrictions: draftLicenseRestrictions || licenseRestrictions,
        expiry_date: draftLicenseExpiration || licenseExpiration,
        dl_img_url: licenseImage || previewLicenseImage || '',
      };

      console.log('🚀 Sending to backend:', {
        restrictions: licenseRestrictions,
        expiry_date: licenseExpiration,
        dl_img_url: licenseImage || previewLicenseImage || '',
      });

      const response = await authenticatedFetch(
        `${API_BASE}/api/driver-license/${licenseNumber}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log('✅ License updated:', result);

        // ✅ Update local state
        setLicenseRestrictions(updateData.restrictions);
        setLicenseExpiration(updateData.expiry_date);
        setLicenseImage(updateData.dl_img_url);

        // ✅ Exit edit mode and close modals
        setIsEditingLicense(false);
        setShowLicenseConfirmModal(false);
        setShowLicenseCancelModal(false);

        // ✅ Show success
        setSuccessMessage('License information updated successfully!');
        setShowSuccess(true);
      } else {
        console.error('❌ Failed to update license:', result);
        setError(result.error || 'Failed to update license');
      }
    } catch (error) {
      console.error('❌ Error updating license:', error);
      setError('Unexpected error updating license');
    } finally {
      setSaving(false);
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

  // UI: loading / error states
  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <DriverSideBar
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

  if (error && !isEditing && !isEditingLicense) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <DriverSideBar
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
          color="error.main"
        >
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

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
              backgroundColor: '#f9f9f9',
              p: { xs: 1, sm: 2, md: 2, lg: 2 },
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 4px 0 6px -1px rgba(0, 0, 0, 0.1), -4px 0 6px -1px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
              height: 'auto',
              boxSizing: 'border-box',
            }}
          >
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
                  sx={{
                    fontWeight: 'bold',
                    color: '#c10007',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <HiCog8Tooth style={{ marginRight: '8px' }} />
                  Driver Settings
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Manage your driver account information
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
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <AccountCircleIcon style={{ marginRight: 8 }} /> Info
                      </span>
                    }
                  />
                  <Tab
                    label={
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <BadgeIcon style={{ marginRight: 8 }} /> License
                      </span>
                    }
                  />
                </Tabs>
              </Box>
            </Box>

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
                    borderRadius: 2,
                    p: 2,
                    pb: isEditing ? 1 : 2,
                    boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                    border: '2px solid #e6e6e6',
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
                        position: { xs: 'relative', md: 'relative' },
                        top: { md: 12 },
                        right: { md: 20 },
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
                      {/* Avatar */}
                      <Box
                        sx={{
                          width: { xs: '100%', md: 160 },
                          position: 'relative',
                          display: 'flex',
                          justifyContent: { xs: 'center', md: 'flex-start' },
                          mb: { xs: 2, md: 0 },
                        }}
                      >
                        <Avatar
                          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                          sx={{
                            width: { xs: 96, md: 120 },
                            height: { xs: 96, md: 120 },
                            position: { xs: 'static', md: 'absolute' },
                            left: { md: 8 },
                            top: { md: 25 },
                            boxShadow: 2,
                            cursor: 'pointer',
                          }}
                          onClick={() => setAvatarOpen(true)}
                        />
                      </Box>

                      {/* Details */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1, // <-- add this line to ensure proper spacing vertically
                          width: { xs: '100%', md: '48%' }, // responsive width for side-by-side inputs
                        }}
                      >
                        {isEditing ? (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              flexDirection: { xs: 'column', md: 'row' },
                            }}
                          >
                            <TextField
                              label="First Name"
                              name="firstName"
                              value={draft.firstName || ''}
                              onChange={handleChange}
                              size="small"
                              required
                            />
                            <TextField
                              label="Last Name"
                              name="lastName"
                              value={draft.lastName || ''}
                              onChange={handleChange}
                              size="small"
                              required
                            />
                          </Box>
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            First Name:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.firstName || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        {!isEditing && (
                          <Typography sx={{ fontWeight: 700 }}>
                            Last Name:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.lastName || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        {isEditing ? (
                          <TextField
                            label="Contact Number"
                            name="contactNo"
                            value={draft.contactNo || ''}
                            onChange={handleChange}
                            size="small"
                            placeholder="e.g., 09123456789"
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            Contact Number:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.contactNo || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        {isEditing ? (
                          <TextField
                            label="Email"
                            name="email"
                            type="email"
                            value={draft.email || ''}
                            onChange={handleChange}
                            size="small"
                            sx={{ width: { xs: '100%', md: '70%' } }}
                            required
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            Email:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.email || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        {isEditing ? (
                          <TextField
                            label="Address"
                            name="address"
                            value={draft.address || ''}
                            onChange={handleChange}
                            size="small"
                            sx={{ width: { xs: '100%', md: '70%' } }}
                            placeholder="e.g., 123 Main St, City"
                            multiline
                            rows={2}
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            Address:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.address || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        {/* userType read-only */}
                        {!isEditing && (
                          <Typography sx={{ fontWeight: 700, mt: 1 }}>
                            User Type:{' '}
                            <span
                              style={{
                                fontWeight: 400,
                                textTransform: 'capitalize',
                              }}
                            >
                              {profile.userType || 'N/A'}
                            </span>
                          </Typography>
                        )}

                        <Box sx={{ mt: 2 }} />

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
                              alignItems: 'center',
                              bgcolor: '#e9e9e9',
                              borderRadius: 4,
                              p: 1.2,
                            }}
                          >
                            {isEditing ? (
                              <TextField
                                label="Username"
                                name="username"
                                value={draft.username || ''}
                                onChange={handleChange}
                                size="small"
                                sx={{ flex: 1, background: 'transparent' }}
                                fullWidth
                                required
                              />
                            ) : (
                              <Typography sx={{ flex: 1, pl: 2 }}>
                                <strong>Username:</strong>{' '}
                                {profile.username || 'N/A'}
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

                          {error && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                              {error}
                            </Alert>
                          )}

                          {isEditing && (
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: { xs: 'column', md: 'row' },
                                gap: 1,
                                width: '100%',
                                mt: 2,
                              }}
                            >
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={() => setShowConfirmModal(true)}
                                sx={{ width: { xs: '100%', md: '100%' } }}
                              >
                                Save Changes
                              </Button>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={() => setOpenInfoCancelModal(true)}
                                sx={{ width: { xs: '100%', md: '100%' } }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          )}
                        </Box>
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
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      gap: 4,
                      minHeight: '230px',
                    }}
                  >
                    {!isEditingLicense && (
                      <IconButton
                        onClick={openLicenseEdit}
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
                              {licenseNumber || ''}
                            </span>
                          </Typography>
                          <Typography sx={{ fontWeight: 700 }}>
                            Restrictions:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {licenseRestrictions || ''}
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

                    {/* Right side - image */}
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
                          }}
                          onClick={() =>
                            !isEditingLicense && setOpenLicenseModal(true)
                          }
                        />
                        {isEditingLicense && (
                          <IconButton
                            color="primary"
                            component="label"
                            sx={{ mt: 1 }}
                          >
                            <PhotoCamera />
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={handleLicenseFileChange}
                            />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {isEditingLicense && (
                      <Box
                        sx={{
                          position: { xs: 'static', md: 'absolute' },
                          mt: { xs: 2, md: 0 },
                          bottom: { md: 16 },
                          left: { md: '50%' },
                          transform: { md: 'translateX(-50%)' },
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' }, // stack on xs, side by side on sm+
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: { xs: 1.5, md: 2 },
                          width: { xs: '80%', sm: 'auto' },
                          px: { xs: 2, sm: 0 },
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={() => setShowLicenseConfirmModal(true)} // open confirm modal
                          sx={{ width: { xs: '100%', md: '100%' } }}
                        >
                          Save
                        </Button>

                        <Button
                          variant="outlined"
                          color="inherit"
                          size="small"
                          startIcon={<CloseIcon />}
                          onClick={() => setShowLicenseCancelModal(true)}
                          sx={{ width: { xs: '100%', md: '100%' } }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}

                    {/* License full-size modal */}
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
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
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
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
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
    </Box>
  );
}
