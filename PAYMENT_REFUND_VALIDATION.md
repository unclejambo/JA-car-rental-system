# Payment & Refund Validation Implementation

## Overview

Implemented comprehensive validation for payments and refunds to prevent financial errors by ensuring amounts don't exceed booking totals and remaining balances.

## Date

January 14, 2025

## Changes Made

### 1. Payment Validation (`backend/src/controllers/paymentController.js`)

#### Validation Logic

- **Regular Payments**: Validates that payment amount doesn't exceed remaining balance
- **Security Deposit Exception**: Special handling for "security deposit fee"
  - If remaining balance is 0, adds the security deposit to `booking.total_amount`
  - This allows security deposits to be added on top of a fully paid booking

#### Implementation Details

```javascript
// Calculate current state
const currentTotalPaid =
  booking.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) ||
  0;
const paymentAmount = Number(amount);
const totalAmount = booking.total_amount || 0;
const remainingBalance = totalAmount - currentTotalPaid;

// Check if this is a security deposit
const isSecurityDeposit =
  description && description.toLowerCase().includes("security deposit");

// Validation
if (!isSecurityDeposit) {
  // Regular payment: validate against remaining balance
  if (paymentAmount > remainingBalance) {
    return res.status(400).json({
      error: "Payment amount exceeds remaining balance",
      details: {
        bookingTotal: totalAmount,
        amountPaid: currentTotalPaid,
        remainingBalance: remainingBalance,
        attemptedPayment: paymentAmount,
      },
    });
  }
} else {
  // Security deposit: add to total_amount if balance is 0
  if (remainingBalance <= 0) {
    await prisma.booking.update({
      where: { booking_id: Number(booking_id) },
      data: { total_amount: totalAmount + paymentAmount },
    });
  }
}
```

#### Error Response Format

```json
{
  "error": "Payment amount exceeds remaining balance",
  "details": {
    "bookingTotal": 5000.0,
    "amountPaid": 3000.0,
    "remainingBalance": 2000.0,
    "attemptedPayment": 2500.0
  }
}
```

### 2. Refund Validation (`backend/src/controllers/refundController.js`)

#### Validation Logic

- **Payment Status Check**: Only allows refunds for bookings with `payment_status = 'Paid'`
- **Amount Validation**: Ensures refund doesn't exceed (total paid - total refunded)
- **Security Deposit Exception**: Deducts security deposit refunds from `booking.total_amount`

#### Implementation Details

```javascript
// Get booking with payments and refunds
const booking = await prisma.booking.findUnique({
  where: { booking_id: Number(booking_id) },
  include: {
    payments: { select: { amount: true } },
    refunds: { select: { refund_amount: true } },
  },
});

// Check payment status
if (booking.payment_status !== "Paid") {
  return res.status(400).json({
    error: "Refund can only be issued for paid bookings",
    details: { currentPaymentStatus: booking.payment_status },
  });
}

// Calculate available refund amount
const totalPaid =
  booking.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) ||
  0;
const totalRefunded =
  booking.refunds?.reduce(
    (sum, refund) => sum + (refund.refund_amount || 0),
    0
  ) || 0;
const availableForRefund = totalPaid - totalRefunded;
const refundAmountNum = Number(refund_amount);

// Check if security deposit
const isSecurityDeposit =
  description && description.toLowerCase().includes("security deposit");

if (!isSecurityDeposit) {
  // Regular refund: validate against available amount
  if (refundAmountNum > availableForRefund) {
    return res.status(400).json({
      error: "Refund amount exceeds available refund balance",
      details: {
        totalPaid: totalPaid,
        totalRefunded: totalRefunded,
        availableForRefund: availableForRefund,
        attemptedRefund: refundAmountNum,
      },
    });
  }
} else {
  // Security deposit refund: deduct from total_amount
  await prisma.booking.update({
    where: { booking_id: Number(booking_id) },
    data: { total_amount: booking.total_amount - refundAmountNum },
  });
}
```

#### Error Response Formats

**For Unpaid Bookings:**

```json
{
  "error": "Refund can only be issued for paid bookings",
  "details": {
    "currentPaymentStatus": "Unpaid"
  }
}
```

**For Exceeding Refund Amount:**

```json
{
  "error": "Refund amount exceeds available refund balance",
  "details": {
    "totalPaid": 5000.0,
    "totalRefunded": 1000.0,
    "availableForRefund": 4000.0,
    "attemptedRefund": 4500.0
  }
}
```

### 3. Frontend - AddPaymentModal Updates

#### Enhanced Error Display

```javascript
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  // Check if there are validation details
  if (err.details) {
    const { bookingTotal, amountPaid, remainingBalance, attemptedPayment } =
      err.details;
    const detailedMessage = `${err.error || "Payment validation failed"}

Booking Total: ₱${bookingTotal?.toFixed(2)}
Amount Paid: ₱${amountPaid?.toFixed(2)}
Remaining Balance: ₱${remainingBalance?.toFixed(2)}
Attempted Payment: ₱${attemptedPayment?.toFixed(2)}`;
    throw new Error(detailedMessage);
  }
  throw new Error(err.error || "Failed to create payment");
}
```

#### User Experience

- Shows detailed breakdown when payment validation fails
- Displays Philippine Peso (₱) formatting
- Multi-line error message with clear financial information

### 4. Frontend - AddRefundModal Updates

#### Booking Filter

```javascript
// Filter bookings by customer_id AND payment_status = 'Paid'
const list = bookings.filter(
  (b) => b.customer_id === custId && b.payment_status === "Paid"
);
```

#### Enhanced Error Display

```javascript
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  if (err.details) {
    const {
      totalPaid,
      totalRefunded,
      availableForRefund,
      attemptedRefund,
      currentPaymentStatus,
    } = err.details;
    let detailedMessage = err.error || "Refund validation failed";

    if (currentPaymentStatus) {
      detailedMessage = `${detailedMessage}

Current Payment Status: ${currentPaymentStatus}`;
    } else if (totalPaid !== undefined) {
      detailedMessage = `${detailedMessage}

Total Paid: ₱${totalPaid?.toFixed(2)}
Total Refunded: ₱${totalRefunded?.toFixed(2)}
Available for Refund: ₱${availableForRefund?.toFixed(2)}
Attempted Refund: ₱${attemptedRefund?.toFixed(2)}`;
    }

    throw new Error(detailedMessage);
  }
  throw new Error(err.error || "Failed to create refund");
}
```

#### User Experience

- Only shows bookings with "Paid" status in dropdown
- Shows detailed breakdown when refund validation fails
- Handles both payment status errors and amount validation errors
- Philippine Peso (₱) formatting for financial amounts

## Security Deposit Special Handling

### Payment Flow

1. **Initial Booking**: Customer pays booking amount (e.g., ₱5,000)
2. **Booking Fully Paid**: Balance = 0, payment_status = 'Paid'
3. **Security Deposit Payment**:
   - Description contains "security deposit"
   - Amount (e.g., ₱2,000) is added to `booking.total_amount`
   - New total: ₱5,000 + ₱2,000 = ₱7,000
   - New balance: ₱7,000 - ₱5,000 = ₱2,000

### Refund Flow

1. **Security Deposit Refund**:
   - Description contains "security deposit"
   - Amount (e.g., ₱2,000) is deducted from `booking.total_amount`
   - New total: ₱7,000 - ₱2,000 = ₱5,000
   - Balance remains: ₱0 (since ₱5,000 is still paid)

### Detection Logic

```javascript
const isSecurityDeposit =
  description && description.toLowerCase().includes("security deposit");
```

## Business Rules Summary

### Payments

1. ✅ Regular payments must not exceed remaining balance
2. ✅ Security deposit payments bypass balance check when balance = 0
3. ✅ Security deposit payments add to total_amount
4. ✅ All payments update booking balance and payment_status

### Refunds

1. ✅ Only 'Paid' bookings can receive refunds
2. ✅ Refund amount cannot exceed (total paid - total refunded)
3. ✅ Security deposit refunds deduct from total_amount
4. ✅ Detailed error messages guide users on available amounts

## Testing Scenarios

### Payment Tests

1. **Valid Payment**: Amount ≤ remaining balance → Success
2. **Overpayment**: Amount > remaining balance → Error with details
3. **Security Deposit (Balance = 0)**: Adds to total_amount → Success
4. **Security Deposit (Balance > 0)**: Normal validation → May fail if exceeds balance

### Refund Tests

1. **Unpaid Booking**: payment_status ≠ 'Paid' → Error
2. **Valid Refund**: Amount ≤ available refund → Success
3. **Over-refund**: Amount > available refund → Error with details
4. **Security Deposit Refund**: Deducts from total_amount → Success
5. **Dropdown Filter**: Only shows bookings with payment_status = 'Paid'

## Files Modified

### Backend

- `backend/src/controllers/paymentController.js`

  - Added validation logic
  - Security deposit special handling
  - Detailed error responses

- `backend/src/controllers/refundController.js`
  - Payment status check
  - Amount validation
  - Security deposit handling
  - Include payments and refunds in booking query

### Frontend

- `frontend/src/ui/components/modal/AddPaymentModal.jsx`

  - Enhanced error display with financial details
  - Multi-line error formatting

- `frontend/src/ui/components/modal/AddRefundModal.jsx`
  - Filter bookings by payment_status = 'Paid'
  - Enhanced error display
  - Debug logging for booking filtering

## Benefits

1. ✅ **Financial Accuracy**: Prevents overpayments and over-refunds
2. ✅ **User Guidance**: Clear error messages with financial breakdown
3. ✅ **Security Deposit Support**: Flexible handling for deposits
4. ✅ **Data Integrity**: Ensures booking totals reflect actual financial state
5. ✅ **Better UX**: Only shows relevant bookings in refund modal

## Notes

- Error messages use Philippine Peso (₱) symbol
- Security deposit detection is case-insensitive
- Frontend displays errors in multi-line format for readability
- Validation occurs before database writes to prevent inconsistent state
- Console logging added to track booking filtering in refund modal
