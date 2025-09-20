import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../ui/components/Header';
import AdminSideBar from '../../ui/components/AdminSideBar';
import Loading from '../../ui/components/Loading';
import { HiCog8Tooth } from 'react-icons/hi2';

export default function AdminReportAnalytics() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, _setLoading] = useState(false); // -----------------------------------> CHANGE TO TRUE WHEN CONTENT IS ADDED
  const [error, _setError] = useState(null);
  // Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'Tom',
    lastName: 'Rex',
    address: 'Casuntingan, Mandaue City',
    email: 'tommyrex@gmail.com',
    birthdate: 'January 09, 1996',
    username: 'AdminITRex',
    password: '*************',
  });

  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    setDraft(profile);
  }, [isEditing, profile]);

  function handleEditToggle() {
    setIsEditing(true);
  }

  function handleCancel() {
    setDraft(profile);
    setIsEditing(false);
  }

  function handleSave() {
    // In real app, send update to server here. For now, update local state.
    setProfile(draft);
    setIsEditing(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setDraft((s) => ({ ...s, [name]: value }));
  }

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
          mt: { xs: '64px', sm: '64px', md: '56px', lg: '56px' }, // Adjust based on your header height
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
                    fontSize: '2rem',
                  },
                }}
              >
                <HiCog8Tooth
                  style={{ verticalAlign: '-3px', marginRight: '5px' }}
                />
                SETTINGS
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
                            label="Birthdate"
                            name="birthdate"
                            value={draft.birthdate}
                            onChange={handleChange}
                            size="small"
                            sx={{ width: { xs: '100%', md: '50%' } }}
                          />
                        ) : (
                          <Typography sx={{ fontWeight: 700 }}>
                            Birthdate:{' '}
                            <span style={{ fontWeight: 400 }}>
                              {profile.birthdate}
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
                              name="username"
                              value={draft.username}
                              onChange={handleChange}
                              size="small"
                              sx={{ flex: 1, background: 'transparent' }}
                              fullWidth={true}
                            />
                          ) : (
                            <Typography sx={{ flex: 1, pl: 2 }}>
                              {profile.username}
                            </Typography>
                          )}
                          {/* per-field edit removed; use top-right edit button */}
                        </Box>

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
                              value={draft.password}
                              onChange={handleChange}
                              size="small"
                              sx={{ flex: 1 }}
                              fullWidth={true}
                            />
                          ) : (
                            <Typography sx={{ flex: 1, pl: 2 }}>
                              {profile.password}
                            </Typography>
                          )}
                          {/* per-field edit removed; use top-right edit button */}
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
                              onClick={handleSave}
                              sx={{ width: { xs: '100%', md: '100%' } }}
                            >
                              Save
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
    </Box>
  );
}
