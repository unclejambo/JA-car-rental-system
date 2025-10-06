import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Chip,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Reusable confirmation modal for confirming changes
 *
 * @param {boolean} open - Whether the modal is open
 * @param {function} onClose - Function to close the modal
 * @param {function} onConfirm - Function to call when user confirms
 * @param {object} options - Configuration options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Main message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.confirmColor - Confirm button color
 * @param {array} options.changes - Array of changes to display
 * @param {boolean} options.loading - Whether the confirm action is loading
 */
const ConfirmationModal = ({
  open = false,
  onClose,
  onConfirm,
  options = {},
}) => {
  const {
    title = 'Confirm Changes',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'primary',
    changes = [],
    loading = false,
    showWarning = false,
  } = options;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading && onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: 200,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1,
          fontSize: '1.25rem',
          fontWeight: 600,
        }}
      >
        {showWarning ? (
          <WarningIcon color="warning" />
        ) : (
          <CheckCircleIcon color="primary" />
        )}
        {title}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
          {message}
        </Typography>

        {changes && changes.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Changes to be saved:
            </Typography>
            <Box
              sx={{
                maxHeight: 300,
                overflowY: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
                p: 2,
                bgcolor: '#fafafa',
              }}
            >
              {changes.map((change, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 0.5,
                    }}
                  >
                    <Chip
                      label={change.field}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Box>
                  <Box sx={{ ml: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', fontSize: '0.85rem' }}
                    >
                      From: <strong>{change.from || '(empty)'}</strong>
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      To: <strong>{change.to || '(empty)'}</strong>
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {showWarning && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <WarningIcon color="warning" fontSize="small" sx={{ mt: 0.25 }} />
            <Typography variant="body2" sx={{ color: '#856404' }}>
              This action cannot be undone. Please review your changes carefully
              before proceeding.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          variant="outlined"
          color="inherit"
          sx={{ minWidth: 100 }}
        >
          {cancelText}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          variant="contained"
          color={confirmColor}
          sx={{ minWidth: 100 }}
        >
          {loading ? 'Processing...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationModal;
