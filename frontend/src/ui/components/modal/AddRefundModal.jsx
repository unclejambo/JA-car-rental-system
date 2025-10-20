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
import { createAuthenticatedFetch } from '../../../utils/api';

// Schema: bookingId required, customer must resolve, extra rules for GCash
const refundSchema = z
  .object({
    customerName: z.string().min(1, 'Customer name is required'),
    customerId: z.number().positive().optional(),
    bookingId: z.coerce.number().int().gt(0, 'Select a booking'),
    description: z.enum(
      ['50% Refund', '75% Refund', '100% Refund', 'Security Deposit'],
      {
        errorMap: () => ({ message: 'Select a refund type' }),
      }
    ),
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
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [securityDepositFee, setSecurityDepositFee] = useState(0);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errors, setErrors] = useState({});

  // Calculate refund amount based on description and selected booking
  const calculateRefundAmount = (description, booking) => {
    if (!description || !booking || !booking.total_amount) return 0;

    switch (description) {
      case '50% Refund':
        return Math.round((booking.total_amount - 1000) * 0.5);
      case '75% Refund':
        return Math.round((booking.total_amount - 1000) * 0.75);
      case '100% Refund':
        return Math.round((booking.total_amount - 1000) * 1.0);
      case 'Security Deposit':
        return securityDepositFee;
      default:
        return 0;
    }
  };

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
    // Filter bookings by customer_id AND payment_status = 'Paid'
    const list = bookings.filter(
      (b) => b.customer_id === custId && b.payment_status === 'Paid'
    );
    console.log(
      '[AddRefundModal] Filtered bookings for customer:',
      custId,
      'Paid bookings:',
      list
    );
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

    if (name === 'bookingId') {
      // Find the selected booking
      const booking = bookingOptions.find(
        (b) => b.booking_id === Number(value)
      );
      setSelectedBooking(booking || null);

      // Recalculate amount if description is already selected
      if (next.description && booking) {
        next.refundAmount = calculateRefundAmount(next.description, booking);
      }
    }

    if (name === 'description') {
      // Recalculate amount when description changes
      if (selectedBooking) {
        next.refundAmount = calculateRefundAmount(value, selectedBooking);
      }
    }

    setFormData(next);
    validate(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate(formData)) return;
    try {
      setSubmitting(true);
      const authFetch = createAuthenticatedFetch(() => {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      });
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
      const res = await authFetch(`${base}/refunds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // Check if there are validation details
        if (err.details) {
          const {
            totalPaid,
            totalRefunded,
            availableForRefund,
            attemptedRefund,
            currentPaymentStatus,
          } = err.details;
          let detailedMessage = err.error || 'Refund validation failed';

          if (currentPaymentStatus) {
            detailedMessage = `${detailedMessage}\n\nCurrent Payment Status: ${currentPaymentStatus}`;
          } else if (totalPaid !== undefined) {
            detailedMessage = `${detailedMessage}\n\nTotal Paid: ₱${totalPaid?.toFixed(2)}\nTotal Refunded: ₱${totalRefunded?.toFixed(2)}\nAvailable for Refund: ₱${availableForRefund?.toFixed(2)}\nAttempted Refund: ₱${attemptedRefund?.toFixed(2)}`;
          }

          throw new Error(detailedMessage);
        }
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
        const authFetch = createAuthenticatedFetch(() => {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        });
        const base =
          import.meta.env.VITE_API_URL || import.meta.env.VITE_LOCAL || '';
        const [cRes, bRes, fRes] = await Promise.all([
          authFetch(`${base}/api/customers`),
          authFetch(`${base}/bookings`),
          authFetch(`${base}/manage-fees`),
        ]);
        const [cData_raw, bData_raw, fData] = await Promise.all([
          cRes.json(),
          bRes.json(),
          fRes.json(),
        ]);
        // Handle paginated responses - extract data arrays
        const cData = Array.isArray(cData_raw) ? cData_raw : (cData_raw?.data || []);
        const bData = Array.isArray(bData_raw) ? bData_raw : (bData_raw?.data || []);
        
        if (!cancel) {
          setCustomers(Array.isArray(cData) ? cData : []);
          setBookings(Array.isArray(bData) ? bData : []);
          setSecurityDepositFee(fData?.security_deposit_fee || 0);
          if (formData.customerName) {
            const match = findCustomerByName(formData.customerName);
            updateBookingOptions(match?.customer_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch customers/bookings/fees', err);
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
    <Dialog
      open={!!show}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      disableScrollLock
    >
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
              disabled={loadingData}
              error={!!errors.customerName}
              helperText={
                errors.customerName || 'Select a customer from the list'
              }
              fullWidth
            >
              {customers.length === 0 && loadingData && (
                <MenuItem value="" disabled>
                  Loading customers...
                </MenuItem>
              )}
              {customers.length === 0 && !loadingData && (
                <MenuItem value="" disabled>
                  No customers found
                </MenuItem>
              )}
              {customers.map((customer) => (
                <MenuItem
                  key={customer.customer_id}
                  value={`${customer.first_name} ${customer.last_name}`}
                >
                  {customer.first_name} {customer.last_name}
                </MenuItem>
              ))}
            </TextField>
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
                const d = new Date(b.booking_date);
                const dateStr = isNaN(d.getTime())
                  ? b.booking_date
                  : d.toISOString().split('T')[0];
                return (
                  <MenuItem key={b.booking_id} value={b.booking_id}>
                    (ID #{b.booking_id}) - {dateStr} - {b.booking_status}
                  </MenuItem>
                );
              })}
            </TextField>

            <TextField
              select
              label="Refund Type"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              error={!!errors.description}
              helperText={errors.description}
              fullWidth
            >
              <MenuItem value="50% Refund">50% Refund</MenuItem>
              <MenuItem value="75% Refund">75% Refund</MenuItem>
              <MenuItem value="100% Refund">100% Refund</MenuItem>
              <MenuItem value="Security Deposit">Security Deposit</MenuItem>
            </TextField>

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
              type="text"
              value={
                formData.refundAmount
                  ? `₱${formData.refundAmount.toLocaleString()}`
                  : '₱0'
              }
              placeholder="Amount will be calculated automatically"
              required
              disabled
              error={!!errors.refundAmount}
              helperText={
                errors.refundAmount ||
                'Amount is automatically calculated based on refund type'
              }
              fullWidth
              InputProps={{
                readOnly: true,
              }}
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
                  placeholder="e.g., 09XXXXXXXXX"
                  fullWidth
                  required
                  error={!!errors.gCashNumber}
                  helperText={errors.gCashNumber}
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
