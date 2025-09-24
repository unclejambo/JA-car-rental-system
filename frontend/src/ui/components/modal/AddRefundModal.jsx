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
  Box,
} from '@mui/material';

// Zod schema (GCash requires a reference)
const refundSchema = z
  .object({
    customerName: z.string().min(1, 'Select a customer'),
    description: z.string().min(1, 'Description is required'),
    refundMethod: z.enum(['Cash', 'GCash']),
    refundAmount: z.coerce
      .number()
      .int()
      .gt(0, 'Amount must be a positive integer'),
    refundReference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.refundMethod === 'GCash' &&
      (!data.refundReference || data.refundReference.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['refundReference'],
        message: 'Reference number is required for GCash',
      });
    }
  });

export default function AddRefundModal({ show, onClose }) {
  // Align field names with schema
  const [formData, setFormData] = useState({
    customerName: 'Cisco Cisco',
    description: '',
    refundMethod: 'Cash',
    refundAmount: '',
    refundReference: '',
  });

  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const res = refundSchema.safeParse(data);
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
    const next = { ...formData, refundAmount: digits };
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
    if (!validate(formData)) return;
    console.log('Added Refund:', formData);
    onClose?.();
  };

  return (
    <Dialog open={!!show} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Refund</DialogTitle>

      <DialogContent dividers>
        <form id="addRefundForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
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
              label="Refund Method"
              name="refundMethod"
              value={formData.refundMethod}
              onChange={handleInputChange}
              required
              error={!!errors.refundMethod}
              helperText={errors.refundMethod}
              fullWidth
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="GCash">GCash</MenuItem>
            </TextField>

            <TextField
              label="Amount"
              name="refundAmount"
              type="text" // use text to avoid browser number quirks
              inputMode="numeric"
              value={formData.refundAmount}
              onChange={handleAmountChange}
              onKeyDown={blockNonNumericKeys}
              placeholder="Amount"
              required
              error={!!errors.refundAmount}
              helperText={errors.refundAmount}
              fullWidth
              inputProps={{ pattern: '[0-9]*' }}
            />

            {formData.refundMethod === 'GCash' && (
              <TextField
                label="Reference No."
                name="refundReference"
                value={formData.refundReference}
                onChange={handleInputChange}
                placeholder="Reference Number"
                required
                error={!!errors.refundReference}
                helperText={errors.refundReference}
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
            form="addRefundForm"
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
