# Return Reminder SMS Implementation

## Overview

Implemented automated SMS/Email notifications sent to customers 3 hours before their scheduled car return time. The system includes instructions for customers to call if they cannot return the car on time.

## Implementation Date

December 16, 2025

## Features Implemented

### 1. Database Schema Update

**File:** `backend/prisma/schema.prisma`

Added new field to Booking model:

```prisma
return_reminder_sent  Boolean?  @default(false)
```

This tracks whether the 3-hour return reminder has been sent for each booking.

### 2. Return Reminder Notification Function

**File:** `backend/src/utils/notificationService.js`

Created `sendReturnReminderNotification()` function that:

- Sends SMS and/or Email based on customer preferences (isRecUpdate)
- Includes car details, return time, and return location
- **Includes important instruction: "If you cannot return the car on time, please call us immediately to notify of any delay"**
- Supports all three notification methods:
  - SMS only (isRecUpdate = 1)
  - Email only (isRecUpdate = 2)
  - Both SMS + Email (isRecUpdate = 3)

#### SMS Message Format:

```
Hi [CustomerName]! Reminder: Your car return is scheduled in 3 hours at [ReturnTime]. Car: [CarName] [LicensePlate]. Return Location: [Location]. IMPORTANT: If you cannot return the car on time, please call us immediately to notify of any delay. - JA Car Rental
```

#### Email Format:

- Subject: "Return Reminder - [CarName]"
- Body includes:
  - Return time and location
  - Car details and booking ID
  - Important notice about calling if delayed
  - Late return fee warning

### 3. Return Reminder Scheduler

**File:** `backend/src/utils/returnReminder.js`

Created `sendReturnReminders()` function that:

- Runs periodically to check for bookings needing reminders
- Finds bookings with return time between 3-3.5 hours from current time
- Only targets active bookings (Confirmed, In Progress, Ongoing status)
- Skips bookings where reminder was already sent (`return_reminder_sent = true`)
- Skips customers with notifications disabled
- Marks bookings as reminded after successful send
- Logs detailed results for monitoring

#### Selection Criteria:

```javascript
- Return time (dropoff_time or end_date): 3 to 3.5 hours from now
- Booking status: 'Confirmed', 'In Progress', or 'Ongoing'
- return_reminder_sent: false or null
- Customer notification preference: isRecUpdate > 0
```

### 4. Server Integration

**File:** `backend/src/index.js`

Added scheduled task that:

- Runs every **30 minutes** to check for return reminders
- Starts 30 seconds after server startup (initial run)
- Runs alongside existing auto-cancel tasks
- Logs all scheduled task activity

```javascript
// Return reminder scheduler - runs every 30 minutes
const RETURN_REMINDER_INTERVAL = 30 * 60 * 1000; // 30 minutes

setInterval(async () => {
  await sendReturnReminders();
}, RETURN_REMINDER_INTERVAL);
```

## Timing Logic

### 3-Hour Window

The system checks for bookings where the return time falls between:

- **Minimum:** 3 hours from now
- **Maximum:** 3.5 hours from now

This 30-minute buffer ensures:

- Reminder is sent close to 3 hours before return
- No duplicate reminders (marked as sent after first attempt)
- Running every 30 minutes catches all eligible bookings

### Example Timeline:

```
Current Time:     12:00 PM
Check Range:      3:00 PM - 3:30 PM (return times)
Return Time:      3:15 PM
Reminder Sent:    12:00 PM (3 hours 15 minutes before return)
```

## Database Migration

Run the following to apply schema changes:

```bash
cd backend
npx prisma migrate dev --name add_return_reminder_sent_field
npx prisma generate
```

## Testing Checklist

### Test Scenario 1: SMS Notification (isRecUpdate = 1)

1. Create a booking with return time exactly 3 hours from now
2. Ensure customer has SMS preference (isRecUpdate = 1)
3. Wait for next scheduled check (or trigger manually)
4. Verify SMS received with delay notification message
5. Check database: `return_reminder_sent` should be `true`

### Test Scenario 2: Email Notification (isRecUpdate = 2)

1. Create booking with email-only preference
2. Return time: 3 hours from current time
3. Verify email received with full return details
4. Confirm email includes delay notification instructions

### Test Scenario 3: Both SMS + Email (isRecUpdate = 3)

1. Customer with both SMS and Email preference
2. Verify both notifications sent
3. Confirm messages match expected format

### Test Scenario 4: No Duplicate Reminders

1. Send reminder for a booking
2. Verify `return_reminder_sent = true` in database
3. Confirm no duplicate reminder sent on next check

### Test Scenario 5: Notifications Disabled

1. Customer with isRecUpdate = 0 or null
2. Booking should be skipped
3. Marked as sent to avoid future checks

### Test Scenario 6: Wrong Timing

1. Return time: 4 hours from now (too early)
2. Return time: 2 hours from now (too late)
3. Neither should trigger reminder

## Monitoring

### Server Logs

The system logs detailed information:

```
🔔 Checking for return reminders...
📋 Found X bookings needing return reminders
📤 Sending return reminder for booking [ID] to customer [Name]
✅ Return reminder sent successfully for booking [ID]
✨ Return reminder check complete: X sent, Y failed
```

### Error Handling

- Failed SMS/Email sends are logged with error details
- Booking is NOT marked as sent if notification fails
- Will retry on next scheduled check

## Important Notes

### Customer Contact Information

- **SMS:** Requires valid `contact_no` in Customer table
- **Email:** Requires valid `email` in Customer table
- System gracefully handles missing contact info

### Return Time Priority

Uses `dropoff_time` if available, falls back to `end_date`:

```javascript
const returnTime = booking.dropoff_time || booking.end_date;
```

### Status Requirements

Only sends reminders for active bookings:

- ✅ Confirmed
- ✅ In Progress
- ✅ Ongoing
- ❌ Cancelled
- ❌ Completed
- ❌ Pending

### Delay Notification Message

All reminders include:

> "If you cannot return the car on time, please call us immediately to notify of any delay."

This ensures customers know to contact the rental company if they anticipate being late.

## Future Enhancements

Potential improvements:

1. Add rental company phone number to SMS/Email
2. Second reminder at 1 hour before return
3. Admin dashboard to view reminder status
4. Manual trigger for testing reminders
5. Configurable reminder timing (e.g., 2 hours, 4 hours)

## Files Modified/Created

### Modified:

- `backend/prisma/schema.prisma` - Added `return_reminder_sent` field
- `backend/src/index.js` - Added return reminder scheduler
- `backend/src/utils/notificationService.js` - Added return reminder function

### Created:

- `backend/src/utils/returnReminder.js` - Return reminder logic

## Dependencies

No new dependencies required. Uses existing:

- Prisma for database queries
- Semaphore SMS service (via notificationService.js)
- Nodemailer for email (via notificationService.js)

## Configuration

Ensure environment variables are set:

```env
SEMAPHORE_API_KEY=your_semaphore_api_key
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

## Deployment Notes

1. Run database migration before deploying
2. Restart backend server to activate scheduler
3. Monitor logs for first 24 hours to ensure proper operation
4. Verify SMS costs with Semaphore (30-minute intervals = 48 checks/day)

## Success Metrics

Track the following:

- Number of reminders sent daily
- SMS/Email success rates
- Customer feedback on reminder timing
- Late return rate changes (should decrease)

---

**Status:** ✅ Complete and Ready for Testing

**Implementation completed:** December 16, 2025
