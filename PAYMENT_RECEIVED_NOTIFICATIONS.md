# Payment Received Notifications System

## Overview
This document describes the payment received notification system that confirms to customers when their payments (GCash or Cash) have been received by JA Car Rental.

## When Notifications Are Sent

### 1. **GCash Payment Approval**
- **Trigger**: When admin/staff approves a GCash payment request
- **Location**: `confirmBooking()` in `bookingController.js`
- **Flow**:
  1. Customer submits GCash payment (sets `isPay = true`)
  2. Admin reviews the GCash payment in the admin panel
  3. Admin clicks "Confirm" button to approve the payment
  4. System sends payment received notification to customer
  5. If payment ≥ ₱1,000, booking confirmation notification is also sent

### 2. **Cash Payment**
- **Trigger**: When staff records a cash payment in the system
- **Location**: `createPayment()` in `paymentController.js`
- **Flow**:
  1. Staff receives cash payment on-site
  2. Staff records the cash payment in the system
  3. System immediately sends payment received notification to customer
  4. If payment brings total ≥ ₱1,000, booking confirmation notification is also sent

## Notification Details

### SMS Message Format
```
Hi [FirstName]! We've received your [GCash/Cash] payment of ₱[Amount] for your [CarName] booking ([StartDate] to [EndDate]). Remaining balance: ₱[Balance]. Thank you! - JA Car Rental
```

### Email Format
**Subject**: `Payment Received - ₱[Amount] for [CarName]`

**Body**:
```
Hi [FirstName],

We are pleased to confirm that we have received your payment for your car rental booking.

PAYMENT DETAILS:
- Amount Received: ₱[Amount]
- Payment Method: [GCash/Cash]
- Reference Number: [ReferenceNo] (if GCash)
- Payment Date: [Date]

BOOKING DETAILS:
- Booking ID: #[BookingID]
- Vehicle: [CarName]
- Plate Number: [PlateNumber]
- Pickup Date: [StartDate]
- Return Date: [EndDate]

PAYMENT SUMMARY:
- Total Amount: ₱[TotalAmount]
- Amount Paid: ₱[TotalPaid]
- Remaining Balance: ₱[Balance]
[⚠️ Please pay the remaining balance before your pickup date. / ✅ Your booking is fully paid!]

[You can pay the remaining balance via GCash or cash on the day of pickup. / Your booking is now fully confirmed. We look forward to serving you!]

If you have any questions about your payment or booking, please don't hesitate to contact us.

Thank you for choosing JA Car Rental!

Best regards,
JA Car Rental Team
```

## Technical Implementation

### New Function Added: `sendPaymentReceivedNotification()`

**Location**: `backend/src/utils/notificationService.js`

**Parameters**:
- `payment` - Payment object with amount, method, reference details
- `customer` - Customer object with contact information
- `car` - Car object with vehicle details
- `booking` - Booking object with dates and amounts
- `paymentType` - String: 'gcash' or 'cash'

**Behavior**:
- Always sends both SMS and Email (dual-channel)
- Non-blocking - failures don't prevent payment processing
- Includes remaining balance information
- Shows different messages based on payment completion status

### Modified Controllers

#### 1. **bookingController.js**
```javascript
// Added import
import { sendPaymentReceivedNotification } from "../utils/notificationService.js";

// In confirmBooking() - After isPay check, before booking confirmation
// Get the latest payment for this booking
const latestPayment = await prisma.payment.findFirst({
  where: { booking_id: bookingId },
  orderBy: { paid_date: 'desc' }
});

// Send notification if it's a GCash payment
if (latestPayment && latestPayment.payment_method === 'GCash') {
  await sendPaymentReceivedNotification(
    latestPayment,
    customer,
    car,
    booking,
    'gcash'
  );
}
```

#### 2. **paymentController.js**
```javascript
// Added import
import { sendPaymentReceivedNotification } from "../utils/notificationService.js";

// In createPayment() - After payment creation and booking update
// Send notification for Cash payments immediately
if (payment_method === 'Cash') {
  await sendPaymentReceivedNotification(
    created,
    customer,
    car,
    updatedBooking,
    'cash'
  );
}
```

## Notification Flow Diagram

### GCash Payment Flow
```
Customer submits payment
         ↓
    isPay = true
         ↓
Admin reviews in panel
         ↓
Admin clicks "Confirm"
         ↓
  confirmBooking() called
         ↓
Fetch latest payment
         ↓
Check if payment_method = 'GCash'
         ↓
Send Payment Received Notification (SMS + Email)
         ↓
If totalPaid >= ₱1,000
         ↓
Send Booking Confirmation Notification (SMS + Email)
```

### Cash Payment Flow
```
Staff receives cash on-site
         ↓
Staff records in system
         ↓
  createPayment() called
         ↓
Payment record created
         ↓
Check if payment_method = 'Cash'
         ↓
Send Payment Received Notification (SMS + Email)
         ↓
If totalPaid >= ₱1,000
         ↓
Send Booking Confirmation Notification (SMS + Email)
```

## Important Notes

### Why Different Triggers?
- **GCash**: Notification sent when admin **approves** (not when customer submits)
  - Reason: Staff needs to verify the GCash transaction first
  - Customer gets notification only after staff confirms receipt
  
- **Cash**: Notification sent **immediately** when recorded
  - Reason: Staff is physically receiving cash, no verification delay needed
  - Notification confirms the payment was properly recorded

### Notification Sequence
When a payment is made:
1. **First**: Payment received notification (this feature)
2. **Then** (if applicable): Booking confirmation notification (if total ≥ ₱1,000)

This ensures customers get:
- Immediate confirmation their payment was received
- Separate confirmation their booking is now confirmed (if threshold met)

### Error Handling
- All notification calls are wrapped in try-catch blocks
- Notification failures are logged but don't prevent payment processing
- Uses `console.log` with emojis for easy tracking:
  - 💰 Payment notification being sent
  - ✅ Notification sent successfully
  - ❌ Notification failed

## Testing Checklist

### Test Case 1: GCash Payment Approval
- [ ] Customer submits GCash payment for booking
- [ ] Payment shows in admin panel with isPay = true
- [ ] Admin clicks "Confirm" button
- [ ] Customer receives SMS notification
- [ ] Customer receives Email notification
- [ ] Both notifications show correct amount and balance
- [ ] If payment ≥ ₱1,000, booking confirmation also sent

### Test Case 2: Cash Payment (Partial)
- [ ] Staff records cash payment of ₱500
- [ ] Customer immediately receives SMS notification
- [ ] Customer immediately receives Email notification
- [ ] Notifications show ₱500 payment and remaining balance
- [ ] Booking remains in Pending status

### Test Case 3: Cash Payment (Full/Confirming)
- [ ] Staff records cash payment of ₱1,500
- [ ] Customer receives payment received notification (SMS + Email)
- [ ] Customer receives booking confirmation notification (SMS + Email)
- [ ] Booking status changes to Confirmed
- [ ] Balance shows correctly in notifications

### Test Case 4: Multiple Payments
- [ ] Customer makes ₱500 GCash payment → Notification sent after approval
- [ ] Customer makes ₱800 Cash payment → Notification sent immediately
- [ ] Both notifications show correct cumulative balance
- [ ] Second payment triggers booking confirmation (total = ₱1,300)

## Environment Variables Required

Same as booking notifications:
- `SEMAPHORE_API_KEY` - For SMS notifications
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password

## Backend Console Output

### GCash Payment Approval
```
💰 Sending payment received notification for GCash approval...
   → Sending SMS to 09171234567 and Email to customer@example.com
   ✅ Payment received notification sent successfully
   ✅ GCash payment received notification sent
```

### Cash Payment
```
💰 Sending payment received notification for Cash payment...
   → Sending SMS to 09171234567 and Email to customer@example.com
   ✅ Payment received notification sent successfully
   ✅ Cash payment received notification sent
```

## Files Modified

1. **backend/src/utils/notificationService.js**
   - Added `sendPaymentReceivedNotification()` function (80+ lines)

2. **backend/src/controllers/bookingController.js**
   - Added import for `sendPaymentReceivedNotification`
   - Added notification call in `confirmBooking()` for GCash approvals

3. **backend/src/controllers/paymentController.js**
   - Added import for `sendPaymentReceivedNotification`
   - Added notification call in `createPayment()` for Cash payments

## Future Enhancements

- [ ] Add notification preferences (customer chooses SMS/Email/Both)
- [ ] Support for other payment methods (Bank Transfer, etc.)
- [ ] Payment receipt PDF generation and attachment to email
- [ ] SMS with payment receipt download link
- [ ] Configurable notification templates in admin panel

---

**Implementation Date**: October 17, 2025  
**Status**: ✅ Complete and Ready for Testing
