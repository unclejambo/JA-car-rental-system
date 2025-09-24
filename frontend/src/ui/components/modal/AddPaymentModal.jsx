import React, { useState } from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Box, // ADD
} from '@mui/material';

// Zod schema (GCash requires a reference)
const paymentSchema = z
  .object({
    startDate: z.string().min(1, 'Start date is required'),
    carName: z.enum(['Nissan', 'Toyota'], {
      errorMap: () => ({ message: 'Select a car' }),
    }),
    customerName: z.string().min(1, 'Select a customer'),
    description: z.string().min(1, 'Description is required'),
    paymentMethod: z.enum(['Cash', 'GCash']),
    paymentAmount: z.coerce
      .number()
      .int()
      .gt(0, 'Amount must be a positive integer'),
    paymentReference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.paymentMethod === 'GCash' &&
      (!data.paymentReference || data.paymentReference.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['paymentReference'],
        message: 'Reference number is required for GCash',
      });
    }
  });

export default function AddPaymentModal({ show, onClose }) {
  // make a const that handles the customer name (first and last name)

  const [formData, setFormData] = useState({
    startDate: '',
    carName: 'Nissan',
    customerName: 'Cisco Cisco',
    description: '',
    paymentMethod: 'Cash',
    paymentAmount: '',
    paymentReference: '',
  });

  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const res = paymentSchema.safeParse(data);
    if (!res.success) {
      const fieldErrors = {};
      for (const issue of res.error.issues) {
        const key = issue.path[0] || 'form';
        fieldErrors[key] = issue.message;
      }
      // setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const next = { ...formData, [name]: value };
    setFormData(next);
    validate(next); // live validate
  };

  // Only allow digits while typing; keep empty string while editing
  const handleAmountChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    const next = { ...formData, paymentAmount: digits };
    setFormData(next);
    validate(next);
  };

  // Block non-numeric keys (prevents e, E, +, -, .)
  const blockNonNumericKeys = (e) => {
    const allowed = [
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'Home',
      'End',
    ];
    if (e.ctrlKey || e.metaKey) return; // allow copy/paste/select all
    if (!/^\d$/.test(e.key) && !allowed.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate(formData)) return; // stop if invalid
    console.log('Added Payment:', formData);
    onClose?.();
  };

  return (
    <Dialog open={!!show} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Payment</DialogTitle>

      <DialogContent dividers>
        <form id="addPaymentForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleInputChange}
              required
              error={!!errors.startDate}
              helperText={errors.startDate}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <TextField
              select
              label="Car Name"
              name="carName"
              value={formData.carName}
              onChange={handleInputChange}
              required
              error={!!errors.carName}
              helperText={errors.carName}
              fullWidth
            >
              <MenuItem value="Nissan">Nissan</MenuItem>
              <MenuItem value="Toyota">Toyota</MenuItem>
            </TextField>

            <TextField
              select
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              error={!!errors.customerName}
              helperText={errors.customerName}
              fullWidth
            >
              <MenuItem value="Cisco Cisco">Cisco Cisco</MenuItem>
              <MenuItem value="John Morgan">John Morgan</MenuItem>
            </TextField>

            <TextField
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Description"
              required
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
            />

            <TextField
              select
              label="Payment Method"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              required
              error={!!errors.paymentMethod}
              helperText={errors.paymentMethod}
              fullWidth
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
            </TextField>

            <TextField
              label="Amount"
              name="paymentAmount"
              type="text" // use text to avoid browser number quirks
              inputMode="numeric"
              value={formData.paymentAmount}
              onChange={handleAmountChange}
              onKeyDown={blockNonNumericKeys}
              placeholder="Amount"
              required
              error={!!errors.paymentAmount}
              helperText={errors.paymentAmount}
              fullWidth
              inputProps={{ pattern: '[0-9]*' }}
            />

            {formData.paymentMethod === 'GCash' && (
              <TextField
                label="Reference No."
                name="paymentReference"
                value={formData.paymentReference}
                onChange={handleInputChange}
                placeholder="Reference Number"
                required
                error={!!errors.paymentReference}
                helperText={errors.paymentReference}
                fullWidth
              />
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
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
            form="addPaymentForm"
            variant="contained"
            color="success"
          >
            Add
          </Button>
          <Button
            onClick={onClose}
            color="error"
            variant="outlined"
            sx={{
              '&:hover': { backgroundColor: 'error.main', color: 'white' },
            }}
          >
            Cancel
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
