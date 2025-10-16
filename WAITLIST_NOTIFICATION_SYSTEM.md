# Waitlist Notification System Documentation

## Current Implementation Overview

The Waitlist table currently serves as a **car reservation/booking queue** system where customers can:
- Join a waitlist when a car is unavailable
- Reserve dates for a specific car
- Make payments for their waitlist position
- Get notified when it's their turn

## Database Schema (Current)

```prisma
model Waitlist {
  waitlist_id          Int       @id @default(autoincrement())
  customer_id          Int
  car_id               Int
  requested_start_date DateTime  @db.Timestamptz(6)
  requested_end_date   DateTime  @db.Timestamptz(6)
  purpose              String?
  pickup_time          String?
  dropoff_time         String?
  pickup_location      String?
  dropoff_location     String?
  delivery_type        String?
  is_self_drive        Boolean?  @default(true)
  selected_driver_id   Int?
  selected_driver_id   Int?
  special_requests     String?
  total_cost           Int?
  status               String?   @default("waiting")
  position             Int
  date_created         DateTime  @db.Timestamptz(6)
  notified_date        DateTime? @db.Timestamptz(6)
  payment_status       String?   @default("unpaid")
  paid_date            DateTime? @db.Timestamptz(6)
  
  // Relations
  Payment              Payment[]
  Car                  Car       @relation(...)
  Customer             Customer  @relation(...)
  Driver               Driver?   @relation(...)
}
```

## Customer Notification Settings (isRecUpdate)

The `Customer` table has an `isRecUpdate` field that controls notification preferences:

```prisma
model Customer {
  customer_id       Int            @id @default(autoincrement())
  // ... other fields ...
  isRecUpdate       Int?           @db.SmallInt  // Notification preference
  phone_verified    Boolean?       @default(false)
  contact_no        String?
  email             String
  // ... other fields ...
}
```

### isRecUpdate Values:
- **0**: Do NOT notify (no notifications)
- **1**: Notify via SMS only
- **2**: Notify via Email only
- **3**: Notify via both SMS and Email

---

## Proposed New System: Car Availability Notifications

### Purpose
Transform the Waitlist table into a **car availability notification system** where customers can:
1. Subscribe to get notified when a specific car becomes "Available"
2. Choose their notification method (SMS, Email, or Both)
3. Automatically receive notifications when the car status changes

### How It Should Work

#### 1. **Customer Subscribes to Car Availability**

When a car is **Under Maintenance** or **Rented**:
- Customer clicks "Notify Me When Available" button
- System checks their `isRecUpdate` setting:
  - If `isRecUpdate = 0`: Show modal asking to enable notifications in settings
  - If `isRecUpdate = 1, 2, or 3`: Join waitlist immediately

#### 2. **Waitlist Entry Creation (Simplified)**

```javascript
// No booking details required - just car subscription
const waitlistEntry = await prisma.waitlist.create({
  data: {
    customer_id: customerId,
    car_id: carId,
    position: nextPosition,
    status: 'waiting',
    date_created: new Date(),
    // No dates, times, or costs needed
    // Just tracking who wants to be notified
  }
});
```

#### 3. **Car Status Changes to "Available"**

When admin/staff changes car status from "Under Maintenance" or "Rented" to "Available":

**Backend triggers notification process:**

```javascript
// Example notification trigger (to be implemented)
async function notifyWaitlistWhenCarBecomesAvailable(carId) {
  // 1. Get all waiting customers for this car
  const waitlistEntries = await prisma.waitlist.findMany({
    where: {
      car_id: carId,
      status: 'waiting'
    },
    include: {
      Customer: {
        select: {
          customer_id: true,
          first_name: true,
          last_name: true,
          email: true,
          contact_no: true,
          isRecUpdate: true  // Get notification preference
        }
      },
      Car: {
        select: {
          make: true,
          model: true,
          year: true,
          car_img_url: true
        }
      }
    },
    orderBy: { position: 'asc' }
  });

  // 2. Send notifications based on each customer's preference
  for (const entry of waitlistEntries) {
    const customer = entry.Customer;
    const car = entry.Car;
    const notificationMethod = customer.isRecUpdate;

    // Prepare notification message
    const message = `Great news! The ${car.make} ${car.model} (${car.year}) is now available for booking!`;
    const emailSubject = `Car Available: ${car.make} ${car.model}`;

    // Send notification based on preference
    switch (notificationMethod) {
      case 1: // SMS only
        await sendSMS(customer.contact_no, message);
        break;
        
      case 2: // Email only
        await sendEmail(customer.email, emailSubject, message);
        break;
        
      case 3: // Both SMS and Email
        await sendSMS(customer.contact_no, message);
        await sendEmail(customer.email, emailSubject, message);
        break;
        
      default: // 0 or null - should not happen, but skip
        console.log(`Customer ${customer.customer_id} has notifications disabled`);
        continue;
    }

    // 3. Update waitlist entry as notified
    await prisma.waitlist.update({
      where: { waitlist_id: entry.waitlist_id },
      data: {
        status: 'notified',
        notified_date: new Date()
      }
    });
  }

  // 4. Optional: Remove old notified entries after X days
  // This keeps the table clean
}
```

#### 4. **Customer Receives Notification**

Depending on their `isRecUpdate` setting:
- **SMS (1 or 3)**: Receives text via Semaphore API
- **Email (2 or 3)**: Receives email notification
- **Both (3)**: Receives both SMS and Email

#### 5. **Customer Books the Car**

After being notified, customer can:
- Go to the car listing page
- Book the now-available car
- System automatically removes them from waitlist after booking

---

## Implementation Steps

### Phase 1: Update Waitlist Controller

**File:** `backend/src/controllers/waitlistController.js`

1. **Simplify `joinWaitlist` function** (already partially done):
   - Accept simple car subscription without booking details
   - Check `isRecUpdate` setting
   - Create basic waitlist entry with just `customer_id`, `car_id`, `position`, `status`

2. **Add new function `notifyWaitlistOnCarAvailable`**:
   ```javascript
   export const notifyWaitlistOnCarAvailable = async (carId) => {
     // Get all waiting customers
     // Check each customer's isRecUpdate setting
     // Send SMS/Email based on preference
     // Update waitlist status to 'notified'
   }
   ```

### Phase 2: Update Car Controller

**File:** `backend/src/controllers/carController.js`

Add trigger when car status changes to "Available":

```javascript
export const updateCar = async (req, res) => {
  try {
    const { car_id } = req.params;
    const updateData = req.body;
    
    // Get current car status
    const currentCar = await prisma.car.findUnique({
      where: { car_id: parseInt(car_id) }
    });
    
    // Update car
    const updatedCar = await prisma.car.update({
      where: { car_id: parseInt(car_id) },
      data: updateData
    });
    
    // Check if status changed to "Available"
    if (currentCar.car_status !== 'Available' && 
        updatedCar.car_status === 'Available') {
      // Trigger waitlist notifications
      await notifyWaitlistOnCarAvailable(parseInt(car_id));
    }
    
    res.json({ success: true, car: updatedCar });
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
};
```

### Phase 3: Create Notification Services

**File:** `backend/src/utils/notificationService.js` (new file)

```javascript
import { sendOTPSMS } from './smsService.js';
// Import email service when created

export async function sendCarAvailabilityNotification(customer, car) {
  const { isRecUpdate, contact_no, email, first_name } = customer;
  const { make, model, year } = car;
  
  const smsMessage = `Hi ${first_name}! The ${make} ${model} (${year}) is now available for booking at JA Car Rental. Book now: [booking link]`;
  
  const emailSubject = `Car Available: ${make} ${model}`;
  const emailBody = `
    Hi ${first_name},
    
    Great news! The ${make} ${model} (${year}) you were interested in is now available for booking.
    
    Click here to book now: [booking link]
    
    Thanks,
    JA Car Rental Team
  `;
  
  try {
    switch (isRecUpdate) {
      case 1: // SMS only
        if (contact_no) {
          await sendSMS(contact_no, smsMessage);
        }
        break;
        
      case 2: // Email only
        if (email) {
          await sendEmail(email, emailSubject, emailBody);
        }
        break;
        
      case 3: // Both
        if (contact_no) {
          await sendSMS(contact_no, smsMessage);
        }
        if (email) {
          await sendEmail(email, emailSubject, emailBody);
        }
        break;
        
      default:
        console.log(`Customer has notifications disabled (isRecUpdate: ${isRecUpdate})`);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    return { success: false, error: error.message };
  }
}

async function sendSMS(phoneNumber, message) {
  // Use existing Semaphore SMS service
  const result = await sendOTPSMS(phoneNumber, 'car_available');
  // Note: You might need to modify smsService to support custom messages
  return result;
}

async function sendEmail(email, subject, body) {
  // TODO: Implement email service (NodeMailer, SendGrid, etc.)
  console.log(`Sending email to ${email}: ${subject}`);
  return { success: true };
}
```

### Phase 4: Update Frontend

**File:** `frontend/src/pages/customer/CustomerCars.jsx`

Update the "Join Waitlist" / "Notify Me" button logic:

```javascript
const handleNotifyMe = async (car) => {
  // Check if customer has notifications enabled
  const notificationEnabled = customerProfile.isRecUpdate > 0;
  
  if (!notificationEnabled) {
    setShowNotificationPrompt(true);  // Show modal to enable notifications
    return;
  }
  
  // Join waitlist for availability notifications
  try {
    const response = await authenticatedFetch(
      `${API_BASE}/api/cars/${car.car_id}/waitlist`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // No booking details needed - just subscribing to notifications
        })
      }
    );
    
    if (response.ok) {
      setSnackbarMessage(
        `You'll be notified when this car becomes available!`
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  } catch (error) {
    console.error('Error joining waitlist:', error);
  }
};
```

### Phase 5: Database Cleanup (Optional)

Add a cleanup job to remove old notified entries:

```javascript
// Run daily or weekly
export const cleanupOldWaitlistEntries = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  await prisma.waitlist.deleteMany({
    where: {
      status: 'notified',
      notified_date: {
        lt: thirtyDaysAgo
      }
    }
  });
};
```

---

## Benefits of This Approach

✅ **No Complex Booking Details Required**: Customers just subscribe to car availability  
✅ **Respects User Preferences**: Uses existing `isRecUpdate` settings  
✅ **Automated Notifications**: Triggered automatically when car becomes available  
✅ **Multi-Channel Support**: SMS, Email, or Both based on customer preference  
✅ **Clean Database**: Old entries can be auto-removed after notification  
✅ **Simple UX**: Just click "Notify Me" - no forms to fill  

---

## Testing Checklist

- [ ] Customer with `isRecUpdate = 0` cannot join waitlist (shows prompt to enable)
- [ ] Customer with `isRecUpdate = 1` joins waitlist and receives SMS when car available
- [ ] Customer with `isRecUpdate = 2` joins waitlist and receives Email when car available
- [ ] Customer with `isRecUpdate = 3` joins waitlist and receives both SMS and Email
- [ ] Multiple customers on same car waitlist all get notified
- [ ] Waitlist entries are marked as 'notified' after sending notification
- [ ] Customer cannot join waitlist for same car twice
- [ ] Customer can leave waitlist before being notified
- [ ] Admin can see waitlist entries for each car
- [ ] Old notified entries are cleaned up automatically

---

## Migration Notes

### Current Waitlist Data
If there's existing waitlist data with booking details, you can:
1. Keep the schema flexible to support both use cases
2. Migrate old data to new simpler format
3. Or add a `type` field: `'reservation'` vs `'notification'`

### Recommended Schema Changes (Optional)

```prisma
model Waitlist {
  // ... existing fields ...
  
  // Make these optional since notification-only entries won't have them
  requested_start_date DateTime?  @db.Timestamptz(6)  // Made optional
  requested_end_date   DateTime?  @db.Timestamptz(6)  // Made optional
  total_cost           Int?
  
  // Add type to differentiate
  waitlist_type        String?    @default("notification") // 'notification' or 'reservation'
  
  // Rest stays the same...
}
```

This way the table can serve both purposes:
- **notification**: Simple car availability subscription
- **reservation**: Full booking details with payment (future feature)

---

## Current vs Proposed Flow

### Current Flow (Reservation System)
```
Car Unavailable → Customer fills booking form → Joins waitlist with dates/costs → 
Makes payment → Gets priority booking → Car becomes available → Booking created
```

### Proposed Flow (Notification System)
```
Car Unavailable → Customer clicks "Notify Me" → Checks notification settings →
Joins waitlist (simple) → Car becomes available → Customer notified via SMS/Email →
Customer books car normally → Waitlist entry archived
```

---

## Files to Modify

### Backend
1. `backend/src/controllers/waitlistController.js` - Add notification logic
2. `backend/src/controllers/carController.js` - Add status change trigger
3. `backend/src/utils/notificationService.js` - **NEW** - Notification handling
4. `backend/src/utils/emailService.js` - **NEW** - Email sending (optional)
5. `backend/src/utils/smsService.js` - Modify to support custom messages

### Frontend
1. `frontend/src/pages/customer/CustomerCars.jsx` - Update "Notify Me" button logic
2. `frontend/src/pages/customer/CustomerSettings.jsx` - Show notification preference explanation
3. Components showing car status - Add "Notify Me" button for unavailable cars

---

## Questions to Consider

1. **Should notified customers be auto-removed from waitlist?**  
   → Recommended: Keep for 7-30 days, then auto-cleanup

2. **Should there be a limit on how many cars a customer can waitlist?**  
   → Recommended: 5-10 cars maximum to prevent spam

3. **Should notification be sent immediately or batched?**  
   → Recommended: Immediate for better UX

4. **What if car becomes unavailable again before customer books?**  
   → Keep entry as 'notified' - don't notify again unless they rejoin

5. **Should we track notification delivery status?**  
   → Recommended: Yes - add `notification_sent` and `notification_error` fields

---

## Summary

This proposal transforms the Waitlist table from a complex reservation system into a simple, user-friendly car availability notification system that:

- Leverages existing `isRecUpdate` customer preferences
- Automatically notifies customers via their preferred channel (SMS/Email/Both)
- Requires minimal customer input (just click "Notify Me")
- Can be implemented with existing SMS infrastructure
- Keeps database clean with automatic cleanup
- Provides better UX than manual checking

The implementation can be done incrementally without breaking existing functionality by making the booking-related fields optional and adding a `waitlist_type` discriminator.
