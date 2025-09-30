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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Header from '../../ui/components/Header';
import CustomerSideBar from '../../ui/components/CustomerSideBar';
import CustomerSettingsHeader from '../../ui/components/header/CustomerSettingsHeader';
import Loading from '../../ui/components/Loading';
import { HiCog8Tooth } from 'react-icons/hi2';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { useCustomerStore } from '../../store/customer';
import SaveCancelModal from '../../ui/components/modal/SaveCancelModal'; // adjust path as needed
import { FormControlLabel, Checkbox } from '@mui/material';

export default function CustomerSettings() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, _setLoading] = useState(true);
  const [error, _setError] = useState(null);

  // Profile state
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
  const [showPassword, setShowPassword] = useState(false);
  const [draft, setDraft] = useState(profile);

  // Tabs
  const [activeTab, setActiveTab] = useState('INFO');
  const handleTabChange = (tab) => setActiveTab(tab);

  // Modals
  const [openInfoSaveModal, setOpenInfoSaveModal] = useState(false);
  const [openInfoCancelModal, setOpenInfoCancelModal] = useState(false);
  const [openLicenseSaveModal, setOpenLicenseSaveModal] = useState(false);
  const [openLicenseCancelModal, setOpenLicenseCancelModal] = useState(false);

  // Checkbox
  const [receiveUpdatesPhone, setReceiveUpdatesPhone] = useState(false);
  const [receiveUpdatesEmail, setReceiveUpdatesEmail] = useState(false);

  // License state
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [licenseNo, setLicenseNo] = useState('');
  const [licenseRestrictions, setLicenseRestrictions] = useState('');
  const [licenseExpiration, setLicenseExpiration] = useState('');
  const [licenseImage, setLicenseImage] = useState('');
  const [draftLicenseNo, setDraftLicenseNo] = useState('');
  const [draftLicenseRestrictions, setDraftLicenseRestrictions] = useState('');
  const [draftLicenseExpiration, setDraftLicenseExpiration] = useState('');
  const [previewLicenseImage, setPreviewLicenseImage] = useState(null);
  const [draftLicenseImage, setDraftLicenseImage] = useState(null);
  const [openLicenseModal, setOpenLicenseModal] = useState(false);

  // Store hook
  const { getCustomerById } = useCustomerStore();

  useEffect(() => {
    let user = JSON.parse(localStorage.getItem('userInfo'));
    const loadCustomer = async () => {
      try {
        _setLoading(true);
        _setError(null);
        const customer = await getCustomerById(user?.id);

        if (customer) {
          setLicenseNo(customer.driver_license_no || '');
          setLicenseRestrictions(customer.DriverLicense?.restrictions || '');
          setLicenseExpiration(customer.expiry_date || '');
          setLicenseImage(customer.driver_license_image || '/license.png');

          setProfile((prev) => ({
            ...prev,
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            address: customer.address || '',
            email: customer.email || '',
            contactNumber: customer.contact_no || '',
            username: customer.username || '',
            password: customer.password || '',
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

  // keep draft synced with profile
  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  function handleEditToggle() {
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
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

  function handleSaveConfirm() {
    setProfile(draft);
    setIsEditing(false);
    setOpenInfoSaveModal(false);
  }

  function handleCancelConfirm() {
    setDraft(profile);
    setIsEditing(false);
    setOpenInfoCancelModal(false);
  }
  function handleLicenseSaveConfirm() {
    setLicenseNo(draftLicenseNo);
    setLicenseRestrictions(draftLicenseRestrictions);
    setLicenseExpiration(draftLicenseExpiration);
    if (draftLicenseImage) {
      setLicenseImage(previewLicenseImage);
    }
    setIsEditingLicense(false);
    setOpenLicenseSaveModal(false);
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

  if (error) {
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
          color="error.main"
        >
          <Typography>{error}</Typography>
        </Box>
      </Box>
    );
  }

  return (
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
          mt: { xs: '70px', sm: '70px', md: '56px', lg: '56px' }, // Adjust based on your header height
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
                ACCOUNT SETTINGS
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
              {/* Tabs (Info / License) */}
              <CustomerSettingsHeader
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
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
                {/* Info Tab (your existing profile UI unchanged) */}
                {activeTab === 'INFO' && (
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
                          src="/jude.jpg"
                          onClick={() => setAvatarOpen(true)}
                          sx={{
                            width: { xs: 96, md: 120 },
                            height: { xs: 96, md: 120 },
                            position: { xs: 'static', md: 'absolute' },
                            left: { md: 8 },
                            top: { md: 25 },
                            boxShadow: 2,
                            cursor: 'pointer', // shows it's clickable
                            transition: 'transform 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.05)', // small hover effect
                            },
                          }}
                        />
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
                                gap: 2,
                                flexDirection: { xs: 'column', md: 'row' },
                              }}
                            >
                              <TextField
                                label="First Name"
                                name="firstName"
                                value={draft.firstName}
                                onChange={handleChange}
                                size="small"
                                fullWidth={false}
                              />
                              <TextField
                                label="Last Name"
                                name="lastName"
                                value={draft.lastName}
                                onChange={handleChange}
                                size="small"
                                fullWidth={false}
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
                            <TextField
                              label="Email"
                              name="email"
                              value={draft.email}
                              onChange={handleChange}
                              size="small"
                              sx={{ width: { xs: '100%', md: '50%' } }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 700 }}>
                              Email:{' '}
                              <span style={{ fontWeight: 400 }}>
                                {profile.email}
                              </span>
                            </Typography>
                          )}

                          {isEditing ? (
                            <TextField
                              label="Contactnumber"
                              name="contactnumber"
                              value={draft.contactNumber}
                              onChange={handleChange}
                              size="small"
                              sx={{ width: { xs: '100%', md: '50%' } }}
                            />
                          ) : (
                            <Typography sx={{ fontWeight: 700 }}>
                              Contact Number:{' '}
                              <span style={{ fontWeight: 400 }}>
                                {profile.contactNumber}
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

                            {/* Password */}
                            <Typography sx={{ fontWeight: 700 }}>
                              Password:
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
                                  name="password"
                                  type={showPassword ? 'text' : 'password'}
                                  value={draft.password}
                                  onChange={handleChange}
                                  size="small"
                                  fullWidth
                                  InputProps={{
                                    endAdornment: (
                                      <InputAdornment position="end">
                                        <IconButton
                                          onClick={() =>
                                            setShowPassword(!showPassword)
                                          }
                                        >
                                          {showPassword ? (
                                            <VisibilityOff />
                                          ) : (
                                            <Visibility />
                                          )}
                                        </IconButton>
                                      </InputAdornment>
                                    ),
                                  }}
                                />
                              ) : (
                                <Typography sx={{ flex: 1, pl: 2 }}>
                                  {'•'.repeat(profile.password.length)}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {/* CheckBox */}
                          <Box
                            sx={{
                              mt: 2,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
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
                                  disabled={!isEditing} // ⬅️ disable when not editing
                                />
                              }
                              label="Receive updates via Phone"
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={receiveUpdatesEmail}
                                  onChange={(e) =>
                                    setReceiveUpdatesEmail(e.target.checked)
                                  }
                                  color="primary"
                                  disabled={!isEditing} // ⬅️ disable when not editing
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
                                onClick={() => setOpenInfoSaveModal(true)} // open modal
                              >
                                Save
                              </Button>
                              <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={() => setOpenInfoCancelModal(true)} // open modal
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
                {activeTab === 'LICENSE' && (
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
                          right: 12,
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
                            onChange={(e) => setDraftLicenseNo(e.target.value)}
                            fullWidth
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
                            <span style={{ fontWeight: 400 }}>{licenseNo}</span>
                          </Typography>

                          <Typography sx={{ fontWeight: 700 }}>
                            Restrictions:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {licenseRestrictions}
                            </span>
                          </Typography>

                          <Typography sx={{ fontWeight: 700 }}>
                            Expiration Date:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {licenseExpiration}
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
                          }}
                          onClick={() =>
                            !isEditingLicense && setOpenLicenseModal(true)
                          }
                        />

                        {/* Camera Icon Upload Button (Only in Edit Mode) */}
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
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setDraftLicenseImage(file);
                                  setPreviewLicenseImage(
                                    URL.createObjectURL(file)
                                  );
                                }
                              }}
                            />
                          </IconButton>
                        )}
                      </Box>
                    </Box>

                    {/* Save / Cancel Buttons (centered at bottom) */}
                    {isEditingLicense && (
                      <Box
                        sx={{
                          position: { xs: 'static', md: 'absolute' }, // static on mobile, absolute on desktop
                          mt: { xs: 3, md: 0 }, // ✅ add top margin on mobile
                          bottom: { md: 10 }, // keep bottom positioning only for desktop
                          left: { md: '50%' },
                          transform: { md: 'translateX(-50%)' },
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 2,
                          width: { xs: '100%', md: 'auto' }, // full-width buttons on mobile
                        }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={() => setOpenLicenseSaveModal(true)} // open modal
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          color="inherit"
                          startIcon={<CloseIcon />}
                          onClick={() => setOpenLicenseCancelModal(true)} // open modal
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
                          p: 2, // padding for mobile screens
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
                              '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
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
      {/* ---- MODALS ---- */}
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
      <SaveCancelModal
        open={openLicenseSaveModal}
        onClose={() => setOpenLicenseSaveModal(false)}
        onConfirm={handleLicenseSaveConfirm}
        type="save"
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
              src="/jude.jpg"
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
    </Box>
  );
}
