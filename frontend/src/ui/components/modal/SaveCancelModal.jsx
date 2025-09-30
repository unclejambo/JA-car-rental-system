import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  Stack,
  Fade,
  Backdrop,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';

export default function SaveCancelModal({
  open,
  onClose,
  onSave,
  onCancel,
  type = 'save', // "save" or "cancel"
}) {
  const isSave = type === 'save';

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{ timeout: 300 }}
    >
      <Fade in={open}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, textAlign: 'center' }}
          >
            {isSave ? 'Save Changes?' : 'Discard Changes?'}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'text.secondary', textAlign: 'center' }}
          >
            {isSave
              ? 'Are you sure you want to save your changes?'
              : 'Are you sure you want to discard your changes? This action cannot be undone.'}
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            {isSave ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={onSave}
              >
                Save
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                startIcon={<CloseIcon />}
                onClick={onCancel}
              >
                Discard
              </Button>
            )}

            <Button variant="outlined" color="inherit" onClick={onClose}>
              Back
            </Button>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
}
