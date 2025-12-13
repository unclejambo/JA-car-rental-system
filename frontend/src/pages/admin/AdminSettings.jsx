import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { Settings } from '@mui/icons-material';
import Header from '../../ui/components/Header';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Loading from '../../ui/components/Loading';
import ConfirmationModal from '../../ui/components/modal/ConfirmationModal';
import SaveCancelModal from '../../ui/components/modal/SaveCancelModal';
import {
  HiCog8Tooth,
  HiUser,
  HiMapPin,
  HiEnvelope,
  HiPhone,
  HiIdentification,
  HiLockClosed,
  HiShieldCheck,
} from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

export default function AdminSettings() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [openInfoCancelModal, setOpenInfoCancelModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({});
  const [draft, setDraft] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Profile picture state
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  const { logout } = useAuth();
  const authenticatedFetch = createAuthenticatedFetch(logout);
  const API_BASE = getApiBase();

  // Fetch admin profile data
  useEffect(() => {
    fetchProfileData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(
        `${API_BASE}/api/admin-profile`
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const adminData = {
            adminId: result.data.admin_id,
            firstName: result.data.first_name || '',
            lastName: result.data.last_name || '',
            address: result.data.address || '',
            contactNo: result.data.contact_no || '',
            email: result.data.email || '',
            username: result.data.username || '',
            userType: result.data.user_type || '',
            profileImageUrl: result.data.profile_img_url || '',
          };
          setImagePreview(result.data.profile_img_url || '');
          setProfile(adminData);
          setDraft(adminData);
        } else {
          setError(result.message || 'Failed to load profile');
        }
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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
    setProfileImage(null);
    setImagePreview(profile.profileImageUrl || '');
    setIsEditing(false);
  };

  const handleCancelConfirm = () => {
    handleCancel();
    setOpenInfoCancelModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDraft((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const getChanges = () => {
    const changes = [];

    Object.keys(draft).forEach((key) => {
      if (draft[key] !== profile[key]) {
        let fieldLabel = key;
        switch (key) {
          case 'firstName':
            fieldLabel = 'First Name';
            break;
          case 'lastName':
            fieldLabel = 'Last Name';
            break;
          case 'address':
            fieldLabel = 'Address';
            break;
          case 'contactNo':
            fieldLabel = 'Contact Number';
            break;
          case 'email':
            fieldLabel = 'Email';
            break;
          case 'username':
            fieldLabel = 'Username';
            break;
        }

        changes.push({
          field: fieldLabel,
          from: profile[key],
          to: draft[key],
        });
      }
    });

    // Check if profile image is being changed
    if (profileImage) {
      changes.push({
        field: 'Profile Picture',
        from: profile.profileImageUrl ? '(current image)' : '(no image)',
        to: '(new image)',
      });
    }

    // Check if password is being changed
    if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
      changes.push({
        field: 'Password',
        from: '(hidden)',
        to: '(new password)',
      });
    }

    return changes;
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

      // Update profile in database
      const updateResponse = await authenticatedFetch(
        `${API_BASE}/api/admin-profile`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...draft, profile_img_url: '' }),
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

      // No need to delete old image manually - backend handles this now

      const formData = new FormData();
      formData.append('profileImage', profileImage); // Changed from 'image' to 'profileImage'
      formData.append('userId', profile.adminId || 'unknown');
      formData.append('userType', 'admin');

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

      // Backend now automatically updates the database and returns the admin data
      // The image URL can be found in result.data.url or result.data.admin.profile_img_url
      const imageUrl =
        result.data?.url ||
        result.data?.admin?.profile_img_url ||
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

  const validateForm = () => {
    if (!draft.firstName?.trim()) return 'First name is required';
    if (!draft.lastName?.trim()) return 'Last name is required';
    if (!draft.email?.trim()) return 'Email is required';
    if (!draft.username?.trim()) return 'Username is required';

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(draft.email)) return 'Please enter a valid email';

    // Password validation if changing
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
    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    // Always show confirmation modal, even if no changes
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      // Check if there's a profile image to upload
      let profileImageUrl = profile.profileImageUrl;
      let imageWasUploaded = false;

      if (profileImage) {
        profileImageUrl = await uploadProfileImage();
        if (!profileImageUrl) {
          // Upload failed, error already set
          setSaving(false);
          setShowConfirmModal(false);
          return;
        }
        imageWasUploaded = true;
      }

      // Prepare update data for other fields
      const updateData = {
        first_name: draft.firstName,
        last_name: draft.lastName,
        address: draft.address,
        contact_no: draft.contactNo,
        email: draft.email,
        username: draft.username,
        profile_img_url: profileImageUrl,
      };

      // Add password data if changing password
      if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
        updateData.password = passwordData.newPassword;
        updateData.currentPassword = passwordData.currentPassword;
      }

      // Check if there are other changes besides the image
      const hasOtherChanges =
        draft.firstName !== profile.firstName ||
        draft.lastName !== profile.lastName ||
        draft.address !== profile.address ||
        draft.contactNo !== profile.contactNo ||
        draft.email !== profile.email ||
        draft.username !== profile.username ||
        (passwordData.newPassword && passwordData.newPassword.trim() !== '');

      let result;

      // If image was uploaded and there are other changes, update the profile
      // If only image was uploaded, we can skip the profile update since backend already handled it
      if (imageWasUploaded && !hasOtherChanges) {
        // Image was already uploaded and saved, just refresh the profile data

        const profileResponse = await authenticatedFetch(
          `${API_BASE}/api/admin-profile`
        );
        const profileResult = await profileResponse.json();

        if (profileResponse.ok && profileResult.success) {
          result = profileResult;
        } else {
          throw new Error('Failed to fetch updated profile');
        }
      } else {
        // Update other profile fields

        const response = await authenticatedFetch(
          `${API_BASE}/api/admin-profile`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        );

        result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Failed to update profile');
        }
      }

      // Update local state with new data
      const updatedProfile = {
        adminId: result.data.admin_id,
        firstName: result.data.first_name || '',
        lastName: result.data.last_name || '',
        address: result.data.address || '',
        contactNo: result.data.contact_no || '',
        email: result.data.email || '',
        username: result.data.username || '',
        userType: result.data.user_type || '',
        profileImageUrl: result.data.profile_img_url || '',
      };

      setImagePreview(result.data.profile_img_url || '');
      setProfileImage(null);

      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setShowSuccess(true);
    } catch (error) {
      setError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
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

  if (error) {
    return (
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setMobileOpen(true)} />
        <AdminSideBar
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

  return (
    <Box sx={{ display: 'flex' }}>
      <title>Settings</title>
      <Header onMenuClick={() => setMobileOpen(true)} />
      <AdminSideBar
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
          mt: { xs: '70px', sm: '70px', md: '56px', lg: '56px' }, // Adjust based on your header height
          height: '100%',
          overflow: 'hidden',
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
            {/* Modern Gradient Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #c10007 0%, #8b0005 100%)',
                borderRadius: 3,
                p: { xs: 2.5, md: 3 },
                mb: 3,
                boxShadow: '0 4px 12px rgba(193, 0, 7, 0.15)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    width: { xs: 56, md: 64 },
                    height: { xs: 56, md: 64 },
                  }}
                >
                  <Settings
                    sx={{ fontSize: { xs: 32, md: 40 }, color: '#fff' }}
                  />
                </Avatar>
                <Box>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: '#fff',
                      fontSize: { xs: '1.5rem', md: '2rem' },
                      mb: 0.5,
                    }}
                  >
                    Admin Settings
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: { xs: '0.875rem', md: '1rem' },
                    }}
                  >
                    Manage your admin profile and credentials
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                alignItems: 'center',
                mt: 2,
              }}
            >
              {/* Settings Card */}
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
                {/* Inner rounded panel with thicker outline */}
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
                        size="small"
                        onClick={handleEditToggle}
                        aria-label="edit"
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
                        sx={{
                          width: { xs: 96, md: 120 },
                          height: { xs: 96, md: 120 },
                          position: { xs: 'static', md: 'absolute' },
                          left: { md: 8 },
                          top: { md: 25 },
                          boxShadow: 2,
                          border: imagePreview ? '3px solid #e0e0e0' : 'none',
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
                    <Box sx={{ flex: 1, pl: { xs: 0, md: 6 }, width: '100%' }}>
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
                                flexDirection: { xs: 'column', md: 'row' },
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
                                flexDirection: { xs: 'column', md: 'row' },
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#666', fontSize: '0.75rem' }}
                                >
                                  First Name
                                </Typography>
                                <Typography
                                  sx={{ fontWeight: 600, fontSize: '1rem' }}
                                >
                                  {profile.firstName || 'N/A'}
                                </Typography>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#666', fontSize: '0.75rem' }}
                                >
                                  Last Name
                                </Typography>
                                <Typography
                                  sx={{ fontWeight: 600, fontSize: '1rem' }}
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
                                sx={{ color: '#666', fontSize: '0.75rem' }}
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
                                  sx={{ fontWeight: 600, fontSize: '1rem' }}
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
                                flexDirection: { xs: 'column', md: 'row' },
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
                                flexDirection: { xs: 'column', md: 'row' },
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#666', fontSize: '0.75rem' }}
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
                                    sx={{ fontWeight: 600, fontSize: '1rem' }}
                                  >
                                    {profile.email || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography
                                  variant="caption"
                                  sx={{ color: '#666', fontSize: '0.75rem' }}
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
                                    sx={{ fontWeight: 600, fontSize: '1rem' }}
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
                                sx={{ color: '#666', fontSize: '0.75rem' }}
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
                                <HiShieldCheck size={18} color="#666" />
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
                          {!isEditing && (
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
                                <HiIdentification size={18} color="#666" />
                                <Typography
                                  sx={{ fontWeight: 600, fontSize: '1rem' }}
                                >
                                  {profile.username || 'N/A'}
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
                                value={draft.username || ''}
                                onChange={handleChange}
                                disabled
                                size="small"
                                fullWidth
                                sx={{
                                  '& .MuiInputBase-input.Mui-disabled': {
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
                                  sx={{ fontWeight: 600, color: '#c10007' }}
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
                                  value={passwordData.currentPassword}
                                  onChange={handlePasswordChange}
                                  name="currentPassword"
                                  size="small"
                                  fullWidth
                                />
                                <TextField
                                  label="New Password"
                                  type="password"
                                  value={passwordData.newPassword}
                                  onChange={handlePasswordChange}
                                  name="newPassword"
                                  size="small"
                                  fullWidth
                                  helperText="Leave blank to keep current password"
                                />
                                <TextField
                                  label="Confirm New Password"
                                  type="password"
                                  value={passwordData.confirmPassword}
                                  onChange={handlePasswordChange}
                                  name="confirmPassword"
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
                                onClick={handleSaveClick}
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
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Modal */}
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

      {/* Cancel Confirmation Modal */}
      <SaveCancelModal
        open={openInfoCancelModal}
        onClose={() => setOpenInfoCancelModal(false)}
        onConfirm={handleCancelConfirm}
        type="cancel"
      />

      {/* Success Message */}
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
