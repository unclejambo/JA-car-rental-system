import React, { useState, useEffect } from 'react';
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

// Schema: bookingId required, customer must resolve, extra rules for GCash
const refundSchema = z
  .object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerId: z.number().positive().optional(),
    bookingId: z.coerce.number().int().gt(0, 'Select a booking'),
    description: z.string().min(1, 'Description is required'),
    refundMethod: z.enum(['Cash', 'GCash']),
    refundAmount: z.coerce
      .number()
      .int()
      .gt(0, 'Amount must be a positive integer'),
    gCashNumber: z.string().optional(),
    refundReference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.customerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['customerName'],
        message: 'Select a valid customer (exact full name)',
      });
    }
    if (data.refundMethod === 'GCash') {
      if (!data.gCashNumber || data.gCashNumber.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gCashNumber'],
          message: 'GCash number is required for GCash',
        });
      } else if (!/^09\d{9}$/.test(data.gCashNumber.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['gCashNumber'],
          message: 'GCash number must be 11 digits starting with 09',
        });
      }
      if (!data.refundReference || data.refundReference.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refundReference'],
          message: 'Reference number is required for GCash',
        });
      }
    }
  });

export default function AddRefundModal({ show, onClose }) {
  // Align field names with schema
  const [formData, setFormData] = useState({
    customerName: '',
    customerId: undefined,
    bookingId: '',
    description: '',
    refundMethod: 'Cash',
    refundAmount: '',
    gCashNumber: '',
    refundReference: '',
  });

  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingOptions, setBookingOptions] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const findCustomerByName = (full) => {
    const t = full.trim().toLowerCase();
    return customers.find(
      (c) => `${c.first_name} ${c.last_name}`.toLowerCase() === t
    );
  };

  const updateBookingOptions = (custId) => {
    if (!custId) {
      setBookingOptions([]);
      setFormData((fd) => ({ ...fd, bookingId: '' }));
      return;
    }
    const list = bookings.filter((b) => b.customer_id === custId);
    setBookingOptions(list);
    setFormData((fd) =>
      list.some((b) => b.booking_id === Number(fd.bookingId))
        ? fd
        : { ...fd, bookingId: '' }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let next = { ...formData, [name]: value };
    if (name === 'customerName') {
      const match = findCustomerByName(value);
      next.customerId = match ? match.customer_id : undefined;
      updateBookingOptions(next.customerId);
    }
    setFormData(next);
    validate(next);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    try {
      setSubmitting(true);
      const base =
        import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL || '';
      const payload = {
        booking_id: Number(formData.bookingId),
        customer_id: Number(formData.customerId),
        refund_method: formData.refundMethod,
        gcash_no: formData.gCashNumber || null,
        reference_no: formData.refundReference || null,
        refund_amount: Number(formData.refundAmount),
        refund_date: new Date().toISOString(),
        description: formData.description || null,
      };
      const res = await fetch(`${base}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create refund');
      }
      onClose?.();
    } catch (err) {
      console.error('Create refund failed', err);
      setErrors((prev) => ({ ...prev, form: err.message }));
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!show) return;
    let cancel = false;
    const load = async () => {
      try {
        setLoadingData(true);
        const base =
          import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL || '';
        const [cRes, bRes] = await Promise.all([
          fetch(`${base}/customers`),
          fetch(`${base}/bookings`),
        ]);
        const [cData, bData] = await Promise.all([cRes.json(), bRes.json()]);
        if (!cancel) {
          setCustomers(Array.isArray(cData) ? cData : []);
          setBookings(Array.isArray(bData) ? bData : []);
          if (formData.customerName) {
            const match = findCustomerByName(formData.customerName);
            updateBookingOptions(match?.customer_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch customers/bookings', err);
      } finally {
        if (!cancel) setLoadingData(false);
      }
    };
    load();
    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <Dialog open={!!show} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Add Refund</DialogTitle>

      <DialogContent dividers>
        <form id="addRefundForm" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              required
              disabled={loadingData}
              error={!!errors.customerName}
              helperText={
                errors.customerName || 'Type exact full name (First Last)'
              }
              fullWidth
              placeholder={loadingData ? 'Loading...' : 'e.g., Juan Dela Cruz'}
            />
            <TextField
              select
              label="Booking"
              name="bookingId"
              value={formData.bookingId}
              onChange={handleInputChange}
              required
              disabled={!formData.customerId || bookingOptions.length === 0}
              error={!!errors.bookingId}
              helperText={
                errors.bookingId ||
                (formData.customerId && bookingOptions.length === 0
                  ? 'No bookings for this customer'
                  : '')
              }
              fullWidth
            >
              {bookingOptions.map((b) => {
                const date = new Date(b.booking_date);
                const dStr = isNaN(date.getTime())
                  ? b.booking_date
                  : date.toISOString().split('T')[0];
                return (
                  <MenuItem key={b.booking_id} value={b.booking_id}>
                    {dStr} (ID #{b.booking_id})
                  </MenuItem>
                );
              })}
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
              <>
                <TextField
                  label="GCash Number"
                  name="gCashNumber"
                  type="text"
                  inputMode="numeric"
                  value={formData.gCashNumber}
                  onChange={handleInputChange}
                  onKeyDown={blockNonNumericKeys}
                  placeholder="e.g., 09XXXXXXXXX"
                  fullWidth
                  required
                  error={!!errors.gCashNumber}
                  helperText={errors.gCashNumber}
                  inputProps={{ pattern: '[0-9]*' }}
                />

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
              </>
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
            disabled={submitting || loadingData}
          >
            {submitting ? 'Saving...' : 'Add'}
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
