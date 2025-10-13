import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { HiX, HiBell, HiMail, HiDeviceMobile } from 'react-icons/hi';

export default function NotificationSettingsModal({ 
  open, 
  onClose, 
  currentSetting = 0,
  onSettingsSaved,
  customerName = '',
}) {
  const [selectedSetting, setSelectedSetting] = useState(currentSetting);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (onSettingsSaved) {
      setLoading(true);
      setError('');
      try {
        await onSettingsSaved(selectedSetting);
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to update notification settings');
      } finally {
        setLoading(false);
      }
    } else {
      onClose();
    }
  };

  const getSettingDescription = (value) => {
    const numValue = parseInt(value);
    switch(numValue) {
      case 0: return 'No notifications';
      case 1: return 'SMS notifications only';
      case 2: return 'Email notifications only';
      case 3: return 'Both SMS and Email notifications';
      default: return 'Unknown';
    }
  };

  const getSettingIcon = (value) => {
    const numValue = parseInt(value);
    switch(numValue) {
      case 1: return <HiDeviceMobile size={24} />;
      case 2: return <HiMail size={24} />;
      case 3: return <HiBell size={24} />;
      default: return <HiX size={24} />;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          m: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HiBell size={24} color="#c10007" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notification Settings
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <HiX />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {currentSetting === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Enable notifications to join the waitlist!</strong>
              <br />
              We'll notify you when the car becomes available for your requested dates.
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
            How would you like to be notified?
          </FormLabel>
          
          <RadioGroup
            value={selectedSetting.toString()}
            onChange={(e) => setSelectedSetting(parseInt(e.target.value))}
          >
            <FormControlLabel
              value="0"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HiX size={20} color="#999" />
                  <Box>
                    <Typography variant="body1">No notifications</Typography>
                    <Typography variant="caption" color="text.secondary">
                      You won't receive any updates
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                mb: 1, 
                p: 1.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            />

            <FormControlLabel
              value="1"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HiDeviceMobile size={20} color="#4caf50" />
                  <Box>
                    <Typography variant="body1">SMS only</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive text message notifications
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                mb: 1, 
                p: 1.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            />

            <FormControlLabel
              value="2"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HiMail size={20} color="#2196f3" />
                  <Box>
                    <Typography variant="body1">Email only</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive email notifications
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                mb: 1, 
                p: 1.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            />

            <FormControlLabel
              value="3"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HiBell size={20} color="#ff9800" />
                  <Box>
                    <Typography variant="body1">Both SMS and Email</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive notifications via SMS and email
                    </Typography>
                  </Box>
                </Box>
              }
              sx={{ 
                mb: 1, 
                p: 1.5, 
                border: '1px solid #e0e0e0', 
                borderRadius: 1,
                '&:hover': { backgroundColor: '#f5f5f5' }
              }}
            />
          </RadioGroup>
        </FormControl>

        {currentSetting !== 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              Current setting: <strong>{getSettingDescription(currentSetting)}</strong>
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || selectedSetting === 0}
          sx={{
            backgroundColor: '#c10007',
            '&:hover': { backgroundColor: '#a50006' },
            '&:disabled': { backgroundColor: '#ccc' }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
