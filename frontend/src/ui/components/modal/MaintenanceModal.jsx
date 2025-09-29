import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Stack,
  InputAdornment,
} from '@mui/material';

export default function MaintenanceModal({ show, onClose, car, onSave }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const plus7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const [formData, setFormData] = useState({
    start_date: todayStr,
    end_date: plus7,
    description: '',
    shop_assigned: '',
    maintenance_fee: '',
  });

  // Reset form when a new car is passed
  useEffect(() => {
    if (!car) return;
    setFormData({
      start_date: todayStr,
      end_date: plus7,
      description: '',
      shop_assigned: '',
      maintenance_fee: '',
    });
    // todayStr / plus7 are stable within component render lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [car]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.start_date || !formData.end_date) {
      alert('Please select start and end dates.');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={!!show} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Set Maintenance Details</DialogTitle>
      <DialogContent dividers>
        <Stack
          component="form"
          id="maintenanceForm"
          spacing={2}
          onSubmit={handleSubmit}
        >
          <TextField
            label="Model"
            value={car?.model || car?.raw?.model || ''}
            InputProps={{ readOnly: true }}
            size="small"
            fullWidth
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Date"
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={(e) => {
                  const newStart = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    start_date: newStart,
                    end_date:
                      prev.end_date && prev.end_date >= newStart
                        ? prev.end_date
                        : newStart,
                  }));
                }}
                size="small"
                fullWidth
                inputProps={{ min: todayStr }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Date"
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                size="small"
                fullWidth
                inputProps={{ min: formData.start_date || todayStr }}
              />
            </Grid>
          </Grid>
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            size="small"
            fullWidth
            multiline
            minRows={2}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Shop Assigned"
                name="shop_assigned"
                value={formData.shop_assigned}
                onChange={handleChange}
                size="small"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Maintenance Fee"
                name="maintenance_fee"
                value={formData.maintenance_fee}
                onChange={handleChange}
                size="small"
                fullWidth
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">₱</InputAdornment>
                  ),
                }}
                placeholder="0.00"
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="submit"
          form="maintenanceForm"
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
      </DialogActions>
    </Dialog>
  );
}
