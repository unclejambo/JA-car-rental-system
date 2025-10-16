# Cancellation Approved Notifications System

## Overview
This document describes the cancellation approved notification system that confirms to customers when their booking cancellation requests have been approved by admin/staff.

## When Notifications Are Sent

### **Cancellation Request Approval**
- **Trigger**: When admin/staff approves a cancellation request
- **Location**: `confirmCancellationRequest()` in `bookingController.js`
- **Flow**:
  1. Customer submits cancellation request (sets `isCancel = true`)
  2. Booking appears in admin panel's "CANCELLATION" tab
  3. Admin reviews the cancellation request
  4. Admin clicks "Confirm" button to approve the cancellation
  5. System updates `booking_status` to "Cancelled"
  6. System sends cancellation approved notification to customer
  7. Transaction record is created with cancellation date

## Notification Details

### SMS Message Format
```
Hi [FirstName]! Your cancellation request for [CarName] ([StartDate] to [EndDate]) has been approved. Any applicable refunds will be processed shortly. - JA Car Rental
```

### Email Format
**Subject**: `Cancellation Approved - [CarName] Booking`

**Body**:
```
Hi [FirstName],

Your booking cancellation request has been approved.

CANCELLED BOOKING DETAILS:
- Booking ID: #[BookingID]
- Vehicle: [CarName]
- Plate Number: [PlateNumber]
- Original Pickup Date: [StartDate]
- Original Return Date: [EndDate]
- Total Amount: ₱[TotalAmount]

WHAT'S NEXT:
- Your booking has been officially cancelled
- If you made any payments, our team will review your refund eligibility
- Refunds (if applicable) will be processed within 5-7 business days
- You will receive a separate notification once the refund is processed

REBOOKING:
You're always welcome to book with us again! Visit our website to check available vehicles for your next trip.

If you have any questions about your cancellation or refund, please don't hesitate to contact us.

We hope to serve you again in the future!

Best regards,
JA Car Rental Team
```

## Technical Implementation

### New Function Added: `sendCancellationApprovedNotification()`

**Location**: `backend/src/utils/notificationService.js`

**Parameters**:
- `booking` - Booking object with dates and amounts
- `customer` - Customer object with contact information
- `car` - Car object with vehicle details

**Behavior**:
- Always sends both SMS and Email (dual-channel)
- Non-blocking - failures don't prevent cancellation processing
- Includes original booking details
- Mentions refund process

### Modified Controller

#### **bookingController.js**
```javascript
// Added import
import { sendCancellationApprovedNotification } from "../utils/notificationService.js";

// In confirmCancellationRequest() - After booking status update
const updatedBooking = await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    booking_status: "Cancelled",
    isCancel: false,
  },
  include: {
    car: { 
      select: { 
        make: true, 
        model: true, 
        year: true, 
        license_plate: true 
      } 
    },
    customer: { 
      select: { 
        customer_id: true,
        first_name: true, 
        last_name: true,
        email: true,
        contact_no: true
      } 
    }
  },
});

// Send cancellation approved notification
await sendCancellationApprovedNotification(
  updatedBooking,
  customer,
  car
);
```

## Cancellation Flow Diagram

### Complete Cancellation Request Flow
```
Customer submits cancellation
         ↓
  isCancel = true
         ↓
Appears in admin "CANCELLATION" tab
         ↓
Admin reviews request
         ↓
Admin clicks "Confirm"
         ↓
confirmCancellationRequest() called
         ↓
Update booking_status = "Cancelled"
Update isCancel = false
         ↓
Send Cancellation Approved Notification (SMS + Email)
         ↓
Create transaction record with cancellation_date
         ↓
Customer receives confirmation
```

### Customer Journey Timeline
```
1. Customer Books Car
   └─> 📧 NOTIFICATION: Booking Success

2. Customer Decides to Cancel
   └─> Submits cancellation request via customer portal

3. Admin Reviews Request
   └─> Appears in "CANCELLATION" tab with isCancel = true

4. Admin Approves Cancellation
   └─> 📧 NOTIFICATION: Cancellation Approved
       "Your cancellation request has been approved"

5. Refund Processing (if applicable)
   └─> Manual review by admin/staff
   └─> Refund processed within 5-7 business days
```

## Important Notes

### Why Notification on Approval?
- **Customer initiated**: Customer submits request, waits for admin approval
- **Confirmation needed**: Customer should know their request was reviewed and approved
- **Next steps clarity**: Notification explains what happens next (refunds, etc.)
- **Professional service**: Keeps customer informed throughout the process

### Cancellation vs Rejection
- **Approved (this notification)**: Booking cancelled, customer notified, transaction created
- **Rejected**: isCancel set to false, booking remains active (no notification currently)

### Refund Information
The notification mentions refunds because:
- Customer may have already paid (partial or full)
- Refund processing is a separate manual step
- Sets customer expectations (5-7 business days)
- Reduces support queries

### Error Handling
- Notification call is wrapped in try-catch block
- Notification failure is logged but doesn't prevent cancellation
- Uses `console.log` with emojis for easy tracking:
  - 🚫 Cancellation notification being sent
  - ✅ Notification sent successfully
  - ❌ Notification failed

## Testing Checklist

### Test Case 1: Basic Cancellation Approval
- [ ] Customer creates a booking
- [ ] Customer submits cancellation request
- [ ] Booking appears in admin "CANCELLATION" tab with isCancel = true
- [ ] Admin clicks "Confirm" button
- [ ] Customer receives SMS notification
- [ ] Customer receives Email notification
- [ ] Booking status changes to "Cancelled"
- [ ] isCancel changes to false
- [ ] Transaction record created with cancellation_date

### Test Case 2: Cancellation with Payment
- [ ] Customer creates booking and makes payment
- [ ] Customer submits cancellation request
- [ ] Admin approves cancellation
- [ ] Customer receives notification mentioning refund process
- [ ] Email clearly states "5-7 business days" for refunds

### Test Case 3: Multiple Cancellation Requests
- [ ] Customer A requests cancellation for Booking 1
- [ ] Customer B requests cancellation for Booking 2
- [ ] Admin approves Booking 1
- [ ] Only Customer A receives notification
- [ ] Admin approves Booking 2
- [ ] Only Customer B receives notification
- [ ] Each notification has correct booking details

### Test Case 4: Notification Delivery
- [ ] SMS sent to customer's phone number
- [ ] Email sent to customer's email address
- [ ] SMS contains concise cancellation confirmation
- [ ] Email contains detailed information and next steps
- [ ] Both notifications show correct car and date details

## Environment Variables Required

Same as other notifications:
- `SEMAPHORE_API_KEY` - For SMS notifications
- `EMAIL_USER` - Gmail address for sending emails
- `EMAIL_PASS` - Gmail app password

## Backend Console Output

### Successful Cancellation Approval
```
Confirming cancellation request: { bookingId: 123, adminId: 1, userRole: 'admin' }
🚫 Sending cancellation approved notification...
   → Sending SMS to 09171234567 and Email to customer@example.com
   ✅ Cancellation approved notification sent successfully
   ✅ Cancellation approved notification sent
Transaction record created for cancelled booking 123 with PH timezone
```

### Notification Failure (Non-Breaking)
```
Confirming cancellation request: { bookingId: 123, adminId: 1, userRole: 'admin' }
🚫 Sending cancellation approved notification...
   → Sending SMS to 09171234567 and Email to customer@example.com
   ❌ Failed to send cancellation notification: SMS API error
Error sending cancellation notification: [error details]
Transaction record created for cancelled booking 123 with PH timezone
[Cancellation still succeeds, just notification failed]
```

## Complete Notification System Status

| Notification Type | Status | Trigger | Channels |
|------------------|--------|---------|----------|
| Booking Success | ✅ Active | Booking creation | SMS + Email |
| Payment Received | ✅ Active | Payment approval/recording | SMS + Email |
| Booking Confirmation | ✅ Active | Total paid ≥ ₱1,000 | SMS + Email |
| **Cancellation Approved** | ✅ **NEW!** | **Admin approves cancellation** | **SMS + Email** |

## API Endpoint

**Route**: `PUT /api/bookings/:id/confirm-cancellation`  
**Access**: Private (Admin/Staff only)  
**Middleware**: `verifyToken`, `adminOrStaff`  
**Controller**: `confirmCancellationRequest`  
**Frontend Call**: `bookingAPI.confirmCancellationRequest(bookingId)`

## Files Modified

1. **backend/src/utils/notificationService.js**
   - Added `sendCancellationApprovedNotification()` function (100+ lines)

2. **backend/src/controllers/bookingController.js**
   - Added import for `sendCancellationApprovedNotification`
   - Added notification call in `confirmCancellationRequest()` function
   - Updated booking query to include email and contact_no
   - Updated car query to include license_plate

## Database Changes

### Updated Query in confirmCancellationRequest:
```javascript
const updatedBooking = await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    booking_status: "Cancelled",
    isCancel: false,
  },
  include: {
    car: { 
      select: { 
        make: true, 
        model: true, 
        year: true, 
        license_plate: true  // Added
      } 
    },
    customer: { 
      select: { 
        customer_id: true,   // Added
        first_name: true, 
        last_name: true,
        email: true,         // Added
        contact_no: true     // Added
      } 
    }
  },
});
```

## Future Enhancements

- [ ] Add notification for cancellation rejection
- [ ] Add notification when refund is processed
- [ ] Track cancellation reason from customer
- [ ] Include cancellation reason in notification
- [ ] Add cancellation statistics to admin dashboard
- [ ] Configurable refund processing timeframe
- [ ] Automatic refund calculation and processing
- [ ] Cancellation fee logic (if within 24 hours, etc.)

## Related Documentation

- **Payment Notifications**: See `PAYMENT_RECEIVED_NOTIFICATIONS.md`
- **Booking Notifications**: See `BOOKING_NOTIFICATION_SYSTEM.md`
- **Complete Flow**: See `PAYMENT_NOTIFICATION_FLOWS.md`

---

**Implementation Date**: October 17, 2025  
**Status**: ✅ Complete and Ready for Testing  
**Total Notification Types**: 4 (Booking Success, Payment Received, Booking Confirmation, Cancellation Approved)
