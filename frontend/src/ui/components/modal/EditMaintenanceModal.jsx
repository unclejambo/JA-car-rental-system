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

export default function EditMaintenanceModal({
  show,
  onClose,
  maintenance,
  onSave,
}) {
  const [formData, setFormData] = useState({
    end_date: '',
    description: '',
    maintenance_cost: '',
    maintenance_shop_name: '',
  });

  useEffect(() => {
    if (maintenance) {
      const originalDate = new Date(maintenance.maintenance_end_date);
      const formattedDate = originalDate.toISOString().split('T')[0];
      setFormData({
        end_date: formattedDate,
        description: maintenance.description || '',
        maintenance_cost: maintenance.maintenance_cost || '',
        maintenance_shop_name: maintenance.maintenance_shop_name || '',
      });
    }
  }, [maintenance]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!maintenance) return;
    onSave(maintenance.maintenance_id, formData);
  };

  return (
    <Dialog
      open={!!show}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableAutoFocus
      disableEnforceFocus
      disableScrollLock
    >
      <DialogTitle>Edit Maintenance</DialogTitle>
      <DialogContent dividers>
        <Stack
          spacing={2}
          component="form"
          id="editMaintenanceForm"
          onSubmit={handleSubmit}
        >
          <TextField
            label="End Date"
            type="date"
            value={formData.end_date}
            onChange={handleChange('end_date')}
            size="small"
            inputProps={{
              min: maintenance?.maintenance_start_date?.slice(0, 10),
            }}
            required
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            size="small"
            multiline
            rows={3}
          />
          <TextField
            label="Maintenance Cost"
            type="number"
            value={formData.maintenance_cost}
            onChange={handleChange('maintenance_cost')}
            size="small"
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Maintenance Shop Name"
            value={formData.maintenance_shop_name}
            onChange={handleChange('maintenance_shop_name')}
            size="small"
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
            form="editMaintenanceForm"
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
