import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
} from '@mui/material';

export default function ExtendMaintenanceModal({
  show,
  onClose,
  maintenance,
  onSave,
}) {
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (maintenance) {
      const originalDate = new Date(maintenance.maintenance_end_date);
      const formattedDate = originalDate.toISOString().split('T')[0];
      setEndDate(formattedDate);
    }
  }, [maintenance]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!maintenance) return;
    onSave(maintenance.maintenance_id, { end_date: endDate });
  };

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      disableAutoFocus
      disableEnforceFocus
      disableScrollLock
    >
      <DialogTitle>Extend Maintenance</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2}
          component="form"
          id="extendMaintenanceForm"
          onSubmit={handleSubmit}
        >
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            size="small"
            inputProps={{
              min: maintenance?.maintenance_start_date?.slice(0, 10),
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3 }}>
        <Box
          sx={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 1,
          }}
        >
          <Button
            type="submit"
            form="extendMaintenanceForm"
            variant="contained"
            color="success"
          >
            Save
          </Button>
          <Button
            onClick={onClose}
            variant="outlined"
            color="error"
            sx={{ '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
