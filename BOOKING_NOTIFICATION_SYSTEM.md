# Booking Notification System

## Overview
This document describes the automated SMS and email notification system for booking confirmations in the JA Car Rental System.

## Features

### 1. Booking Success Notification
When a customer successfully creates a booking, they receive an immediate notification via both SMS and email with:
- Booking confirmation
- Payment deadline information
- Amount due
- Booking details (dates, locations, car information)
- Warning about auto-cancellation if payment deadline is missed

### 2. Booking Confirmation Notification
When a customer's payment is verified and the booking is confirmed (minimum ₱1,000 paid), they receive a confirmation notification via both SMS and email with:
- Booking confirmation status
- Complete booking details
- Vehicle information including plate number
- Payment status (amount paid and remaining balance)
- Next steps for pickup

## Payment Deadline Rules

The system automatically calculates payment deadlines based on the booking start date:

| Scenario | Payment Deadline | Example |
|----------|-----------------|---------|
| Booking start date is **TODAY** | **1 hour** from booking creation | Booked at 10:00 AM, must pay by 11:00 AM |
| Booking start date is **within 3 days** (but not today) | **24 hours** from booking creation | Booked on Monday for Wednesday, must pay by Tuesday same time |
| Booking start date is **more than 3 days away** | **72 hours (3 days)** from booking creation | Booked on Monday for next Monday, must pay by Thursday same time |

## Notification Flow

```
Customer Creates Booking
         ↓
   Booking Saved to DB
         ↓
   ✉️ NOTIFICATION #1: Booking Success
   • SMS: Short notification with payment deadline
   • Email: Detailed booking info + payment instructions
         ↓
   Customer Makes Payment (≥ ₱1,000)
         ↓
   System Automatically Detects Payment
         ↓
   System Updates Booking Status to "Confirmed"
         ↓
   ✉️ NOTIFICATION #2: Booking Confirmation
   • SMS: Confirmation with pickup date
   • Email: Complete details + next steps
```

**Note:** The confirmation notification is sent automatically when:
- A payment is added that brings the total paid to ≥ ₱1,000, OR
- Admin confirms the booking via the "Confirm Booking" button (when isPay=TRUE)

## Implementation Details

### Backend Files Modified

#### 1. `notificationService.js`
**Location:** `backend/src/utils/notificationService.js`

**New Functions Added:**
- `calculatePaymentDeadline(bookingDate, startDate)` - Calculates payment deadline based on booking rules
- `formatDatePH(date)` - Formats dates to Philippine timezone
- `sendBookingSuccessNotification(booking, customer, car)` - Sends initial booking notification
- `sendBookingConfirmationNotification(booking, customer, car)` - Sends confirmation notification

**Key Features:**
- Automatically sends both SMS and email for critical booking notifications
- Handles missing contact information gracefully
- Supports simulated mode when API keys are not configured (for development)

#### 2. `paymentController.js`
**Location:** `backend/src/controllers/paymentController.js`

**Changes:**
- Added import for `sendBookingConfirmationNotification`
- Modified `createPayment()` to automatically send confirmation notification when payment brings total to ≥ ₱1,000 and status changes from "Pending" to "Confirmed"
- Tracks status change with `isNewlyConfirmed` flag
- Fetches customer and car details for notification

#### 3. `bookingController.js`
**Location:** `backend/src/controllers/bookingController.js`

**Changes:**
- Added import for notification functions
- Modified `createBooking()` to send booking success notification after booking creation
- Modified `confirmBooking()` to send confirmation notification when booking transitions from Pending to Confirmed (when isPay=TRUE and totalPaid >= ₱1,000)

### Notification Content

#### SMS Notification #1: Booking Success
```
Hi [FirstName]! Your booking for [CarName] is successful! 
To confirm, pay ₱[Balance] within [Deadline] (by [Date]). 
Booking ID: [ID]. - JA Car Rental
```

#### Email Notification #1: Booking Success
**Subject:** Booking Successful - [CarName] (Booking #[ID])

**Content:**
- Booking details (ID, car, dates, locations)
- Payment information (total, amount due)
- Payment deadline with warning about auto-cancellation
- Next steps

#### SMS Notification #2: Booking Confirmation
```
Hi [FirstName]! Your booking for [CarName] is now CONFIRMED! 
Pickup: [Date]. Booking ID: [ID]. See you soon! - JA Car Rental
```

#### Email Notification #2: Booking Confirmation
**Subject:** Booking Confirmed - [CarName] (Booking #[ID])

**Content:**
- Confirmed status indicator
- Vehicle information with plate number
- Complete rental period details
- Location information
- Payment status breakdown
- What's next for customer
- Reminder about requirements (license, ID)
- Remaining balance notification if applicable

## Configuration

### Environment Variables Required

```env
# SMS Configuration (Semaphore API)
SEMAPHORE_API_KEY=your_api_key_here

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

### Development Mode
If the above environment variables are not set:
- Notifications will be simulated (logged to console)
- System will not fail - booking creation will succeed
- Useful for local development and testing

## Error Handling

The notification system is designed to be **non-blocking**:
- If notification fails, the booking still succeeds
- Errors are logged to console for debugging
- System continues normal operation
- Notifications are sent on a "best effort" basis

## Testing

### Manual Testing Checklist

#### Test 1: New Booking (Same Day)
1. Create a booking with start date = today
2. Verify SMS and email received
3. Check deadline is 1 hour from booking time
4. Verify booking appears in admin panel as "Pending"

#### Test 2: New Booking (Within 3 Days)
1. Create a booking with start date in 2 days
2. Verify SMS and email received
3. Check deadline is 24 hours from booking time

#### Test 3: New Booking (More than 3 Days)
1. Create a booking with start date in 5 days
2. Verify SMS and email received
3. Check deadline is 72 hours from booking time

#### Test 4: Payment Confirmation
1. Create a booking
2. Admin adds payment of ₱1,000 or more
3. Admin sets isPay = TRUE
4. Admin confirms booking
5. Verify confirmation SMS and email received
6. Check booking status changed to "Confirmed"

#### Test 5: Partial Payment (Less than ₱1,000)
1. Create a booking
2. Admin adds payment of ₱500
3. Admin sets isPay = TRUE
4. Admin confirms booking
5. Verify NO confirmation notification sent
6. Check booking status remains "Pending"

## Auto-Cancellation Integration

The notification system works in conjunction with the auto-cancellation feature:
- Auto-cancellation checks run periodically
- Bookings past their payment deadline are automatically cancelled
- The booking success notification warns customers about this deadline
- No separate cancellation notification is sent (future enhancement)

## Future Enhancements

Potential improvements for the notification system:

1. **Auto-Cancellation Notification**
   - Send notification when booking is auto-cancelled for non-payment
   - Include rebooking instructions

2. **Reminder Notifications**
   - Send reminder 24 hours before payment deadline
   - Send reminder 2 hours before payment deadline for same-day bookings

3. **Pickup Reminder**
   - Send notification 24 hours before pickup date
   - Include requirements checklist

4. **Driver Assignment Notification**
   - Notify customer when driver is assigned
   - Include driver details and contact info

5. **Extension Confirmation**
   - Send notification when booking extension is approved
   - Include new dates and additional payment info

6. **Return Reminder**
   - Send notification 24 hours before return date
   - Include return location and time

7. **Customer Notification Preferences**
   - Allow customers to choose notification methods (SMS only, Email only, Both)
   - Stored in customer profile

## Troubleshooting

### Notifications Not Being Sent

**Check:**
1. Environment variables are properly set in `.env`
2. SMS API key is valid and has credit
3. Email credentials are correct (use App Password for Gmail)
4. Customer has valid email and phone number in database
5. Check backend console logs for error messages

### SMS Not Received

**Possible Causes:**
- Invalid phone number format (must include country code)
- Insufficient Semaphore API credit
- Phone number blocked/unsubscribed from service
- Network delays (SMS can take 1-5 minutes)

**Check:**
- Backend console logs for SMS sending status
- Semaphore dashboard for delivery status
- Phone number format in database

### Email Not Received

**Possible Causes:**
- Email in spam/junk folder
- Invalid email address
- Gmail blocking less secure apps (use App Password)
- Email service rate limits

**Check:**
- Customer's spam/junk folder
- Email address validity in database
- Backend console logs for email sending status
- Gmail account settings for "App Passwords"

## Maintenance Notes

### Updating Notification Templates

To modify notification content:
1. Edit `notificationService.js`
2. Update `sendBookingSuccessNotification()` or `sendBookingConfirmationNotification()`
3. Modify SMS message string (keep under 160 characters for single SMS)
4. Modify email subject and body strings
5. Test thoroughly before deploying

### Changing Payment Deadline Rules

To modify deadline calculation:
1. Edit `calculatePaymentDeadline()` function in `notificationService.js`
2. Update the deadline logic
3. Also update `autoCancel.js` to match the new rules
4. Update this documentation with new rules

## Support

For issues or questions about the notification system:
1. Check backend console logs for detailed error messages
2. Verify environment variables are properly configured
3. Test in simulated mode (without API keys) to isolate issues
4. Check notification service provider dashboards (Semaphore, Gmail)

---

**Last Updated:** October 17, 2025
**Version:** 1.0.0
