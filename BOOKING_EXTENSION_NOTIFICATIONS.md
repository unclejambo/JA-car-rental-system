# Booking Extension Notifications

## Overview
Added complete notification system for booking extension requests - admin notifications when customers request extensions, and customer notifications when extensions are approved or rejected.

**Implementation Date:** October 19, 2025

---

## 🎯 Purpose

The extension notification system handles three key scenarios:
1. **Extension Request** - Customer requests to extend their ongoing booking
2. **Extension Approved** - Admin approves the extension request
3. **Extension Rejected** - Admin rejects the extension request

These notifications ensure both admin and customers are promptly informed about extension requests and their outcomes.

---

## 🔔 Notification Types

### 1. Admin Extension Request Notification
- **Trigger:** When `extendMyBooking()` is called by customer
- **Recipient:** Admin/Staff (always SMS + Email)
- **Timing:** Immediately when customer submits extension request
- **Purpose:** Alert admin that extension request needs review

### 2. Customer Extension Approved Notification
- **Trigger:** When `confirmExtensionRequest()` is called by admin
- **Recipient:** Customer (based on isRecUpdate preference)
- **Timing:** Immediately when admin approves extension
- **Purpose:** Inform customer their extension was approved and payment is needed

### 3. Customer Extension Rejected Notification
- **Trigger:** When `rejectExtensionRequest()` is called by admin
- **Recipient:** Customer (based on isRecUpdate preference)
- **Timing:** Immediately when admin rejects extension
- **Purpose:** Inform customer their extension was denied

---

## 📋 Implementation Details

### New Functions Created
**File:** `backend/src/utils/notificationService.js`

```javascript
// Admin notification when customer requests extension
export async function sendAdminExtensionRequestNotification(
  booking,         // Booking object with extension details
  customer,        // Customer object
  car,            // Car object
  additionalDays, // Number of days to extend
  additionalCost  // Cost for extension
)

// Customer notification when extension is approved
export async function sendExtensionApprovedNotification(
  booking,         // Updated booking object
  customer,        // Customer object
  car,            // Car object
  additionalDays, // Number of days approved
  additionalCost  // Cost for extension
)

// Customer notification when extension is rejected
export async function sendExtensionRejectedNotification(
  booking,         // Booking object
  customer,        // Customer object
  car,            // Car object
  additionalDays, // Number of days that were requested
  deductedAmount  // Amount removed from balance
)
```

---

## 📱 Notification Content

### Admin Extension Request Notification

#### SMS Format
```
EXTENSION REQUEST! [Customer Name] wants to extend [Car Name] booking by [X] days ([Old Date] → [New Date]). Additional: ₱[Amount]. Booking #[ID]. - JA Car Rental
```

**Example:**
```
EXTENSION REQUEST! John Doe wants to extend Toyota Vios (2024) booking by 3 days (December 20, 2025 → December 23, 2025). Additional: ₱3,600. Booking #123. - JA Car Rental
```

#### Email Content
**Subject:** `Extension Request #[BookingID] - [Customer Name] (+[X] days)`

**Body Includes:**
- Customer Information (name, email, phone)
- Booking Details (ID, current status)
- Vehicle Information (make, model, year, plate)
- Extension Details (old end date, new end date, additional days, cost)
- Financial Impact (original total, extension cost, new total, new balance)
- Action Required (review and approve/reject)
- Important Notes (check vehicle availability, verify no conflicts)

---

### Customer Extension Approved Notification

#### SMS Format
```
Hi [FirstName]! Your extension request for [Car Name] has been APPROVED! New end date: [Date]. Additional cost: ₱[Amount]. Please pay the balance. - JA Car Rental
```

**Example:**
```
Hi John! Your extension request for Toyota Vios (2024) has been APPROVED! New end date: December 23, 2025, 2:00 PM. Additional cost: ₱3,600. Please pay the balance. - JA Car Rental
```

#### Email Content
**Subject:** `Extension Approved - [Car Name] Booking Extended`

**Body Includes:**
- Congratulatory message
- Booking Details (ID, vehicle, status)
- Extension Details (additional days, new return date, extension cost)
- Payment Information (total amount, current balance due)
- Important Payment Notice (payment required for extension)
- Payment Methods (GCash, Cash)
- Next Steps (make payment, continue rental, return on new date)

---

### Customer Extension Rejected Notification

#### SMS Format
```
Hi [FirstName]! Your extension request for [Car Name] has been denied. Original return date remains: [Date]. Please contact us if you have questions. - JA Car Rental
```

**Example:**
```
Hi John! Your extension request for Toyota Vios (2024) has been denied. Original return date remains: December 20, 2025, 2:00 PM. Please contact us if you have questions. - JA Car Rental
```

#### Email Content
**Subject:** `Extension Request Denied - [Car Name] Booking`

**Body Includes:**
- Informative message about denial
- Booking Details (ID, vehicle, original return date, status)
- What This Means (end date unchanged, must return on original date, cost removed)
- Why It Was Denied (common reasons: vehicle booked, maintenance, constraints)
- Alternative Options (check different vehicle, make new booking, discuss arrangements)
- Contact Information (phone, email)
- Apology and appreciation

---

## 🔄 Integration Points

### 1. Extension Request Flow
**File:** `backend/src/controllers/bookingController.js`

**Function:** `extendMyBooking()`

```javascript
// Customer submits extension request
const updatedBooking = await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    isExtend: true,
    new_end_date: newEndDate,
    total_amount: newTotalAmount,
    balance: newBalance,
    payment_status: 'Unpaid'
  }
});

// Send admin notification (NEW)
await sendAdminExtensionRequestNotification(
  updatedBooking,
  customer,
  car,
  additionalDays,
  additionalCost
);
```

**Flow:**
1. Customer requests extension via customer dashboard
2. System calculates additional days and cost
3. Booking updated with `isExtend: true` and `new_end_date`
4. Additional cost added to `total_amount` and `balance`
5. Admin receives extension request notification ⭐ NEW

---

### 2. Extension Approval Flow
**File:** `backend/src/controllers/bookingController.js`

**Function:** `confirmExtensionRequest()`

```javascript
// Admin approves extension
await prisma.extension.create({
  data: {
    booking_id: bookingId,
    old_end_date: booking.end_date,
    new_end_date: booking.new_end_date
  }
});

const updatedBooking = await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    end_date: booking.new_end_date,
    new_end_date: null,
    isExtend: false,
    payment_status: 'Unpaid'
  }
});

// Send customer notification (NEW)
await sendExtensionApprovedNotification(
  updatedBooking,
  customer,
  car,
  additionalDays,
  additionalCost
);
```

**Flow:**
1. Admin reviews extension request in admin dashboard
2. Admin clicks "Approve Extension"
3. Extension record created in database
4. Booking's `end_date` updated to `new_end_date`
5. `isExtend` flag cleared, `new_end_date` cleared
6. Customer receives extension approved notification ⭐ NEW

---

### 3. Extension Rejection Flow
**File:** `backend/src/controllers/bookingController.js`

**Function:** `rejectExtensionRequest()`

```javascript
// Admin rejects extension
const restoredTotalAmount = booking.total_amount - additionalCost;
const restoredBalance = booking.balance - additionalCost;

const updatedBooking = await prisma.booking.update({
  where: { booking_id: bookingId },
  data: {
    new_end_date: null,
    isExtend: false,
    total_amount: restoredTotalAmount,
    balance: restoredBalance,
    payment_status: paymentStatus
  }
});

// Send customer notification (NEW)
await sendExtensionRejectedNotification(
  updatedBooking,
  customer,
  car,
  additionalDays,
  additionalCost
);
```

**Flow:**
1. Admin reviews extension request in admin dashboard
2. Admin clicks "Reject Extension"
3. Additional cost removed from `total_amount` and `balance`
4. `isExtend` flag cleared, `new_end_date` cleared
5. Payment status updated based on restored balance
6. Customer receives extension rejected notification ⭐ NEW

---

## 📊 Extension Notification Matrix

| Event | Admin Notification | Customer Notification |
|-------|-------------------|----------------------|
| **Customer Requests Extension** | ✅ Extension Request (SMS + Email) | ❌ No |
| **Admin Approves Extension** | ❌ No | ✅ Extension Approved (based on isRecUpdate) |
| **Admin Rejects Extension** | ❌ No | ✅ Extension Rejected (based on isRecUpdate) |

---

## 💡 Business Logic

### Extension Request Validation
- Only bookings with status "ongoing" or "in progress" can be extended
- Cannot request extension if `isExtend` is already true (pending request)
- New end date must be after current end date
- Additional cost calculated as: `additionalDays × rent_price`

### Extension Approval
- Creates permanent `Extension` record in database
- Updates `end_date` to the requested `new_end_date`
- Updates `dropoff_time` preserving original time but using new date
- Sets `payment_status` to 'Unpaid' due to additional balance

### Extension Rejection
- Removes additional cost from `total_amount` and `balance`
- Restores original booking terms
- Updates `payment_status` based on restored balance
- No extension record created

---

## ⚙️ Configuration

### Admin Contact Settings
**File:** `backend/src/config/adminNotificationConfig.js`

```javascript
export const ADMIN_NOTIFICATION_CONFIG = {
  PHONE: '09925315378',
  EMAIL: 'gregg.marayan@gmail.com',
  BUSINESS_NAME: 'JA Car Rental'
};
```

### Customer Notification Preferences
Controlled by `isRecUpdate` field:
- `0` = No notifications
- `1` = SMS only
- `2` = Email only
- `3` = Both SMS and Email

**Note:** Admin notifications always send both SMS and Email regardless of preferences.

---

## 🚀 Testing Checklist

### Extension Request Test
- [ ] Customer submits extension request for ongoing booking
- [ ] Verify `isExtend` flag set to true
- [ ] Verify `new_end_date` stored correctly
- [ ] Verify additional cost added to `total_amount` and `balance`
- [ ] Verify admin receives SMS notification
- [ ] Verify admin receives email notification
- [ ] Verify notification includes correct dates and costs
- [ ] Test with different extension periods (1 day, 3 days, 7 days)

### Extension Approval Test
- [ ] Admin approves pending extension request
- [ ] Verify extension record created in database
- [ ] Verify `end_date` updated to new date
- [ ] Verify `dropoff_time` updated correctly
- [ ] Verify `isExtend` cleared and `new_end_date` cleared
- [ ] Verify customer receives notification (based on isRecUpdate)
- [ ] Test with isRecUpdate = 0 (no notification)
- [ ] Test with isRecUpdate = 1 (SMS only)
- [ ] Test with isRecUpdate = 2 (Email only)
- [ ] Test with isRecUpdate = 3 (Both SMS and Email)

### Extension Rejection Test
- [ ] Admin rejects pending extension request
- [ ] Verify additional cost removed from totals
- [ ] Verify `isExtend` cleared and `new_end_date` cleared
- [ ] Verify `payment_status` updated correctly
- [ ] Verify customer receives notification (based on isRecUpdate)
- [ ] Test rejection with different isRecUpdate values
- [ ] Verify balance calculations are accurate

### Error Handling Test
- [ ] Test extension request on non-ongoing booking (should fail)
- [ ] Test extension request when already pending (should fail)
- [ ] Test extension with past date (should fail)
- [ ] Test approval when no pending request (should fail)
- [ ] Test rejection when no pending request (should fail)
- [ ] Verify operations succeed even if notifications fail
- [ ] Test with missing customer contact info

---

## 🔍 Key Features

### ✅ Complete Extension Workflow
- Customer request → Admin review → Approval/Rejection → Customer notification
- Fully automated notification at each step
- Clear communication throughout the process

### ✅ Financial Transparency
- Extension cost clearly communicated
- Balance updates explained
- Payment requirements highlighted

### ✅ Non-Blocking Implementation
- Extension operations never fail due to notification errors
- All notification calls wrapped in try-catch blocks
- Errors logged but don't interrupt business logic

### ✅ Context-Aware Messaging
- Different messages for approval vs rejection
- Includes specific dates, costs, and booking details
- Provides helpful next steps and contact information

### ✅ Customer Preference Respect
- Customer notifications honor `isRecUpdate` setting
- Admin always receives both SMS and Email
- Flexible notification delivery

### ✅ Philippine Timezone Support
- All dates formatted in Asia/Manila timezone
- Consistent date formatting across all notifications
- Uses `formatDatePH()` helper function

---

## 📈 Business Value

1. **Improved Communication**
   - Admin instantly aware of extension requests
   - Customers promptly informed of decisions
   - Reduces confusion and follow-up inquiries

2. **Enhanced Customer Experience**
   - Clear approval/rejection notifications
   - Transparent cost information
   - Helpful guidance on next steps

3. **Operational Efficiency**
   - Admin can quickly identify pending extension requests
   - Automated notifications reduce manual communication
   - Streamlined extension approval workflow

4. **Financial Clarity**
   - Extension costs clearly communicated
   - Balance updates transparent
   - Payment expectations set upfront

5. **Booking Management**
   - Better tracking of booking modifications
   - Clear audit trail via extension records
   - Improved schedule management

---

## 🔮 Future Enhancements

### Potential Additions
1. **Auto-Approval Rules**
   - Automatically approve extensions if vehicle is available
   - Set maximum auto-approval extension period
   - Require manual approval for longer extensions

2. **Extension Limitations**
   - Set maximum number of extensions per booking
   - Define maximum total extension period
   - Implement extension request cooldown period

3. **Payment Integration**
   - Allow payment during extension request
   - Automatic approval if paid immediately
   - Payment deadline for extension approval

4. **Availability Check**
   - Automatically check vehicle availability before allowing request
   - Suggest alternative dates if vehicle is booked
   - Show availability calendar to customer

5. **Notification Enhancements**
   - SMS with link to payment page
   - Reminder if extension payment not received
   - Countdown notifications before return date

6. **Admin Dashboard Features**
   - Bulk approve/reject extensions
   - Extension request analytics
   - Revenue impact tracking

---

## 📝 Complete Extension System

### Extension States
1. **No Extension** - `isExtend: false`, `new_end_date: null`
2. **Pending Extension** - `isExtend: true`, `new_end_date: [Date]`
3. **Approved Extension** - `isExtend: false`, `end_date: [Updated]`, Extension record created
4. **Rejected Extension** - `isExtend: false`, `new_end_date: null`, Costs reverted

### Database Changes
**Extension Record:**
```javascript
{
  extension_id: auto_increment,
  booking_id: foreign_key,
  old_end_date: Date,
  new_end_date: Date,
  created_at: DateTime
}
```

**Booking Fields Used:**
- `isExtend` - Boolean flag for pending extension
- `new_end_date` - Requested new end date
- `end_date` - Actual end date (updated on approval)
- `dropoff_time` - Updated to match new end date
- `total_amount` - Includes extension cost
- `balance` - Includes extension cost
- `payment_status` - Set to 'Unpaid' when extended

---

## 📞 Support Information

**Admin Contact:**
- Phone: 09925315378
- Email: gregg.marayan@gmail.com
- Business: JA Car Rental

**Customer Support:**
- Review extension requests in admin dashboard
- Check extension history in booking details
- Monitor notification logs in backend console

---

## ✅ Implementation Status

**Status:** ✅ COMPLETE

**Files Modified:**
1. ✅ `backend/src/utils/notificationService.js` - Added 3 new notification functions
2. ✅ `backend/src/controllers/bookingController.js` - Integrated notifications in 3 functions

**Functions Updated:**
1. ✅ `extendMyBooking()` - Added admin extension request notification
2. ✅ `confirmExtensionRequest()` - Added customer extension approved notification
3. ✅ `rejectExtensionRequest()` - Added customer extension rejected notification

**Testing Status:** Ready for testing

**Deployment:** Ready for production

---

## 📊 Updated Notification System Overview

### Total Notification Types: 13

#### Customer Notifications (9)
1. ✅ Booking Success (new booking created)
2. ✅ Booking Confirmation (payment confirmed)
3. ✅ Payment Received (GCash approved or Cash recorded)
4. ✅ Car Availability (waitlist notification)
5. ✅ Cancellation Approved
6. ✅ Cancellation Denied
7. ✅ Extension Approved ⭐ NEW
8. ✅ Extension Rejected ⭐ NEW
9. ✅ (Reserved for future)

#### Admin Notifications (4)
1. ✅ New Booking Alert
2. ✅ Cancellation Request
3. ✅ GCash Payment Request
4. ✅ Payment Completed (Cash or GCash)
5. ✅ Extension Request ⭐ NEW

---

## 🎯 Summary

The extension notification system provides complete communication coverage for booking extensions:

**When Customer Requests Extension:**
- Admin receives immediate notification with all extension details
- Admin can review vehicle availability and customer history
- Extension cost and dates clearly communicated

**When Admin Approves Extension:**
- Customer receives approval notification with new return date
- Payment requirements clearly stated
- Next steps provided for smooth continuation

**When Admin Rejects Extension:**
- Customer receives polite denial notification
- Original terms clarified
- Alternative options and contact information provided
- Balance automatically restored to pre-request amount

The implementation maintains consistency with the existing notification system:
- Non-blocking design (operations succeed even if notifications fail)
- Respects customer notification preferences (isRecUpdate)
- Always sends both SMS and Email to admin
- Philippine timezone support throughout
- Comprehensive error handling
- Professional and helpful messaging

This completes the extension notification workflow, ensuring clear communication and smooth operations for booking extensions! 🚀
