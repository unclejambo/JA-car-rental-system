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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../ui/components/Header';
import DriverSideBar from '../../ui/components/DriverSideBar';
import Loading from '../../ui/components/Loading';
import ConfirmationModal from '../../ui/components/modal/ConfirmationModal';
import { HiCog8Tooth } from 'react-icons/hi2';
import { useAuth } from '../../hooks/useAuth.js';
import { createAuthenticatedFetch, getApiBase } from '../../utils/api.js';

export default function DriverSettings() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const { logout } = useAuth();
  const authenticatedFetch = createAuthenticatedFetch(logout);
  const API_BASE = getApiBase();

  // Fetch driver profile data
  useEffect(() => {
    fetchProfileData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      console.log(
        'Fetching driver profile from:',
        `${API_BASE}/driver-profile`
      );
      const response = await authenticatedFetch(`${API_BASE}/driver-profile`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const driverData = {
            firstName: result.data.first_name || '',
            lastName: result.data.last_name || '',
            contactNo: result.data.contact_no || '',
            email: result.data.email || '',
            username: result.data.username || '',
            userType: result.data.user_type || '',
            licenseNumber: result.data.license_number || '',
            address: result.data.address || '',
          };
          setProfile(driverData);
          setDraft(driverData);
        } else {
          setError(result.message || 'Failed to load profile');
        }
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
    setIsEditing(false);
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
          case 'contactNo':
            fieldLabel = 'Contact Number';
            break;
          case 'email':
            fieldLabel = 'Email';
            break;
          case 'username':
            fieldLabel = 'Username';
            break;
          case 'licenseNumber':
            fieldLabel = 'License Number';
            break;
          case 'address':
            fieldLabel = 'Address';
            break;
        }

        changes.push({
          field: fieldLabel,
          from: profile[key],
          to: draft[key],
        });
      }
    });

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

  const validateForm = () => {
    if (!draft.firstName?.trim()) return 'First name is required';
    if (!draft.lastName?.trim()) return 'Last name is required';
    if (!draft.email?.trim()) return 'Email is required';
    if (!draft.username?.trim()) return 'Username is required';
    if (!draft.licenseNumber?.trim()) return 'License number is required';

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

    const changes = getChanges();
    if (changes.length === 0) {
      setError('No changes detected');
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        first_name: draft.firstName,
        last_name: draft.lastName,
        contact_no: draft.contactNo,
        email: draft.email,
        username: draft.username,
        license_number: draft.licenseNumber,
        address: draft.address,
      };

      // Add password data if changing password
      if (passwordData.newPassword && passwordData.newPassword.trim() !== '') {
        updateData.password = passwordData.newPassword;
        updateData.currentPassword = passwordData.currentPassword;
      }

      const response = await authenticatedFetch(`${API_BASE}/driver-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update local state with new data
        const updatedProfile = {
          firstName: result.data.first_name || '',
          lastName: result.data.last_name || '',
          contactNo: result.data.contact_no || '',
          email: result.data.email || '',
          username: result.data.username || '',
          userType: result.data.user_type || '',
          licenseNumber: result.data.license_number || '',
          address: result.data.address || '',
        };

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
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

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

  if (error) {
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
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: '1.8rem',
                  color: '#000',
                  '@media (max-width: 1024px)': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                <HiCog8Tooth
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                DRIVER SETTINGS
              </Typography>
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
                  borderRadius: 2,
                  p: 2,
                  pb: isEditing ? 1 : 2,
                  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                  border: '2px solid #e6e6e6',
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
                        }}
                      />
                    </Box>

                    {/* Right: Details */}
                    <Box sx={{ flex: 1, pl: { xs: 0, md: 6 }, width: '100%' }}>
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
                              fullWidth={false}
                              required
                            />
                            <TextField
                              label="Last Name"
                              name="lastName"
                              value={draft.lastName || ''}
                              onChange={handleChange}
                              size="small"
                              fullWidth={false}
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
                            label="License Number"
                            name="licenseNumber"
                            value={draft.licenseNumber || ''}
                            onChange={handleChange}
                            size="small"
                            sx={{ width: { xs: '100%', md: '70%' } }}
                            required
                            placeholder="e.g., K01-17-002807"
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            License Number:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.licenseNumber || 'N/A'}
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

                        {!isEditing && (
                          <Typography sx={{ fontWeight: 700 }}>
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
                              fullWidth={true}
                              required
                            />
                          ) : (
                            <Typography sx={{ flex: 1, pl: 2 }}>
                              <strong>Username:</strong>{' '}
                              {profile.username || 'N/A'}
                            </Typography>
                          )}
                        </Box>

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
                              onClick={handleCancel}
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
