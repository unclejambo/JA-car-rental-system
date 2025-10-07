import React from 'react';
import { Modal, Box, Typography, Button } from '@mui/material';

export default function SaveCancelModal({ open, onClose, onConfirm, type }) {
  const titles = {
    save: 'Save Changes?',
    cancel: 'Discard Changes?',
  };

  const messages = {
    save: 'Are you sure you want to save these changes?',
    cancel: 'Are you sure you want to discard these changes?',
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 2,
          boxShadow: 24,
          width: type === 'cancel' ? 420 : 350, // wider for discard so text fits
        }}
      >
        {/* Primary text centered */}
        <Typography
          variant="h6"
          gutterBottom
          sx={{ textAlign: 'center', fontWeight: 600 }}
        >
          {titles[type]}
        </Typography>

        {/* Secondary text */}
        <Typography
          variant="body1"
          color="text.secondary"
          gutterBottom
          sx={{ textAlign: 'center', whiteSpace: 'nowrap' }}
        >
          {messages[type]}
        </Typography>

        {/* Footer with buttons - centered */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2 }}>
          <Button
            variant="contained"
            onClick={onConfirm}
            sx={{
              backgroundColor: '##0000FF',
            }}
          >
            Yes
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              color: '#555',
              borderColor: '#bbb',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#999',
              },
            }}
          >
            No
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
