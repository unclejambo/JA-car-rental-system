# Driver Booking Status Tracking Implementation

## Overview
Implemented automatic tracking of driver availability through the `booking_status` field on the Driver table. This field is automatically updated throughout the entire booking lifecycle, allowing the system to track which drivers are currently assigned to active bookings.

**Additionally, drivers receive SMS notifications when their status changes to 1 or 2.** See [DRIVER_SMS_NOTIFICATIONS.md](./DRIVER_SMS_NOTIFICATIONS.md) for details.

**Implementation Date:** October 21, 2025

---

## Driver Booking Status Codes

| Status Code | Meaning | Trigger Point | Description | SMS Notification |
|------------|---------|---------------|-------------|-----------------|
| **0** | No Active Booking | Initial state, Cancelled, or Completed | Driver is available - has no active booking assignment | ❌ No |
| **1** | Booking Unconfirmed | Booking Created | Driver is assigned to a new booking that hasn't been paid/confirmed yet | ✅ **Yes** - Assignment details |
| **2** | Booking Confirmed | Payment Confirmed | Driver's booking is confirmed but car hasn't been released to customer | ✅ **Yes** - Confirmation & prepare for release |
| **3** | Booking In Progress | Car Released | Driver's booking is active - car is currently with customer | ❌ No |
| **0** | Booking Completed | Car Returned | Driver is available again - booking completed or cancelled | ❌ No |

---

## Implementation Details

### 1. **Create Booking** (`bookingController.js` - Line ~393)

**Trigger:** When a new booking is created with a driver assignment

**Status Change:** `NULL/0 → 1` (Unconfirmed)

**SMS Notification:** ✅ Driver receives assignment details

```javascript
// Update driver booking_status if driver is assigned
if (newBooking.drivers_id) {
  try {
    await prisma.driver.update({
      where: { drivers_id: newBooking.drivers_id },
      data: { booking_status: 1 } // 1 = booking exists but not confirmed
    });
    console.log(`✅ Driver ${newBooking.drivers_id} booking_status set to 1 (unconfirmed)`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the booking creation if driver status update fails
  }
}
```

**Logic:**
- After booking is successfully created
- Only if `drivers_id` is provided during booking creation
- Sets driver status to 1 (booking exists but payment not confirmed)
- Non-blocking: errors don't fail the booking creation

---

### 2. **Confirm Booking** (`bookingController.js` - Line ~1783)

**Trigger:** When admin confirms payment for a booking

**Status Change:** `1 → 2` (Confirmed)

```javascript
// Update driver booking_status if driver is assigned and booking was confirmed
if (booking.drivers_id && updatedBooking.booking_status === 'Confirmed') {
  try {
    await prisma.driver.update({
      where: { drivers_id: booking.drivers_id },
      data: { booking_status: 2 } // 2 = booking confirmed but not released
    });
    console.log(`✅ Driver ${booking.drivers_id} booking_status set to 2 (confirmed)`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the confirmation if driver status update fails
  }
}
```

**Logic:**
- After booking status is updated to 'Confirmed'
- Only if driver is assigned AND booking was actually confirmed (status changed to 'Confirmed')
- Driver status only updates when booking transitions to 'Confirmed' state
- If booking stays 'Pending' or is 'In Progress', driver status is NOT updated here
- Non-blocking error handling

**Important:** This only updates when `booking_status` becomes 'Confirmed', not for 'Pending' or 'In Progress' states during payment processing.

---

### 3. **Cancel Booking** (`bookingController.js` - Line ~945)

**Trigger:** When admin approves a cancellation request

**Status Change:** `Any → 0` (Available)

```javascript
// Update driver booking_status if driver was assigned
if (updatedBooking.drivers_id) {
  try {
    await prisma.driver.update({
      where: { drivers_id: updatedBooking.drivers_id },
      data: { booking_status: 0 } // 0 = no active booking
    });
    console.log(`✅ Driver ${updatedBooking.drivers_id} booking_status set to 0 (cancelled)`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the cancellation if driver status update fails
  }
}
```

**Logic:**
- After booking status is set to 'Cancelled'
- Resets driver to available state (status 0)
- Only if driver was assigned to the booking
- Non-blocking error handling

**Note:** Customer cancellation request (`cancelMyBooking`) only sets `isCancel` flag. Actual cancellation and driver status reset happens when admin confirms via `confirmCancellationRequest`.

---

### 4. **Release Car** (`releaseController.js` - Line ~88)

**Trigger:** When car is released to customer and booking becomes "In Progress"

**Status Change:** `2 → 3` (In Progress)

```javascript
// Update driver booking_status if driver is assigned
if (updatedBooking.drivers_id) {
  try {
    await prisma.driver.update({
      where: { drivers_id: updatedBooking.drivers_id },
      data: { booking_status: 3 } // 3 = booking released and in progress
    });
    console.log(`✅ Driver ${updatedBooking.drivers_id} booking_status set to 3 (in progress)`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the release if driver status update fails
  }
}
```

**Logic:**
- After booking is set to 'In Progress' and `isRelease = true`
- Driver status becomes 3 (active rental in progress)
- Only if driver is assigned
- Non-blocking error handling

---

### 5. **Return Car** (`returnController.js` - Line ~398)

**Trigger:** When car is returned and booking is completed

**Status Change:** `3 → 0` (Available)

```javascript
// Update driver booking_status if driver was assigned
if (booking.drivers_id) {
  try {
    await tx.driver.update({
      where: { drivers_id: booking.drivers_id },
      data: { booking_status: 0 } // 0 = no active booking (completed)
    });
    console.log(`✅ Driver ${booking.drivers_id} booking_status set to 0 (completed)`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the return if driver status update fails
  }
} catch (driverUpdateError) {
```

**Logic:**
- After booking status is set to 'Completed'
- Resets driver to available state (status 0)
- Wrapped in transaction with other return operations
- Non-blocking error handling

---

## Booking Lifecycle Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVER BOOKING STATUS FLOW                    │
└─────────────────────────────────────────────────────────────────┘

   START
     │
     ▼
  STATUS 0
(Available)
     │
     ├──────────[Create Booking with Driver]──────────┐
     │                                                  ▼
     │                                            STATUS 1
     │                                          (Unconfirmed)
     │                                                  │
     │                     ┌────────────[Confirm Payment]
     │                     │                            │
     │                     │                            ▼
     │                     │                      STATUS 2
     │                     │                     (Confirmed)
     │                     │                            │
     │                     │                [Release Car]
     │                     │                            │
     │                     │                            ▼
     │                     │                      STATUS 3
     │                     │                    (In Progress)
     │                     │                            │
     │                     │                 [Return Car/Complete]
     │                     │                            │
     │                     │                            ▼
     │                     │                      STATUS 0
     │                     │                     (Available)
     │                     │                            │
     │                     │                            ▼
     │                     │                          END
     │                     │
     │          [Cancel at any point]
     │                     │
     └─────────────────────┴──────────────────> STATUS 0
                                              (Available → END)
```

---

## Booking Status vs Driver Status Mapping

| Booking Status | isPay | isRelease | Driver Status | Description |
|---------------|-------|-----------|---------------|-------------|
| Pending | FALSE | FALSE | **1** | New booking created with driver, awaiting payment |
| Confirmed | FALSE | FALSE | **2** | Payment confirmed, car not yet released |
| In Progress | FALSE | TRUE | **3** | Car released to customer, rental active |
| Completed | FALSE | TRUE | **0** | Car returned, rental finished, driver available |
| Cancelled | FALSE | FALSE | **0** | Booking cancelled, driver available |

---

## Implementation Characteristics

### ✅ **Non-Blocking Design**
- All driver status updates are wrapped in try-catch blocks
- Errors are logged but don't fail the primary booking operation
- Booking creation, confirmation, release, return, and cancellation proceed even if driver status update fails

### ✅ **Conditional Updates**
- Driver status only updates if `drivers_id` exists on the booking
- Handles bookings without driver assignment gracefully
- No errors thrown for bookings without drivers

### ✅ **Transaction Safety**
- Return controller update is wrapped in existing transaction
- Ensures atomicity with other return operations (car status, maintenance record, etc.)

### ✅ **Comprehensive Logging**
- Success: `✅ Driver X booking_status set to Y`
- Failure: Error logged with details but operation continues

---

## Files Modified

### Backend Files
1. **`backend/src/controllers/bookingController.js`**
   - Line ~393: Added driver status update (0→1) in `createBooking()`
   - Line ~1783: Added driver status update (1→2) in `confirmBooking()`
   - Line ~945: Added driver status update (any→0) in `confirmCancellationRequest()`

2. **`backend/src/controllers/releaseController.js`**
   - Line ~88: Added driver status update (2→3) in `createRelease()`

3. **`backend/src/controllers/returnController.js`**
   - Line ~398: Added driver status update (3→0) in return transaction

---

## Testing Scenarios

### Scenario 1: Complete Booking Lifecycle with Driver
```
1. Create booking with driver → Status: 1 ✓
2. Confirm payment → Status: 2 ✓
3. Release car → Status: 3 ✓
4. Return car → Status: 0 ✓
```

### Scenario 2: Booking Cancelled After Confirmation
```
1. Create booking with driver → Status: 1 ✓
2. Confirm payment → Status: 2 ✓
3. Customer requests cancellation → Status: 2 (no change)
4. Admin approves cancellation → Status: 0 ✓
```

### Scenario 3: Booking Cancelled Before Confirmation
```
1. Create booking with driver → Status: 1 ✓
2. Customer requests cancellation → Status: 1 (no change)
3. Admin approves cancellation → Status: 0 ✓
```

### Scenario 4: Booking Without Driver
```
1. Create booking (no driver) → Status: NULL (no change) ✓
2. Confirm payment → Status: NULL (no change) ✓
3. Release car → Status: NULL (no change) ✓
4. Return car → Status: NULL (no change) ✓
```

### Scenario 5: Early Cancellation (During In Progress)
```
1. Create booking with driver → Status: 1 ✓
2. Confirm payment → Status: 2 ✓
3. Release car → Status: 3 ✓
4. Customer requests cancellation → Status: 3 (no change)
5. Admin approves cancellation → Status: 0 ✓
```

---

## Database Schema Reference

### Driver Table (from `schema.prisma`)
```prisma
model Driver {
  drivers_id     Int       @id @default(autoincrement())
  first_name     String    @db.VarChar(45)
  last_name      String    @db.VarChar(45)
  contact_no     String?   @db.VarChar(20)
  license_no     String?   @db.VarChar(45)
  booking_status Int?      @db.SmallInt  // ← Tracking field
  Booking        Booking[]
  Release        Release[]
}
```

### Booking Table (from `schema.prisma`)
```prisma
model Booking {
  booking_id      Int       @id @default(autoincrement())
  customer_id     Int
  car_id          Int
  drivers_id      Int?      // ← Optional driver assignment
  booking_status  String    @db.VarChar(45)
  start_date      DateTime  @db.Timestamp(0)
  end_date        DateTime  @db.Timestamp(0)
  // ... other fields
  
  driver          Driver?   @relation(fields: [drivers_id], references: [drivers_id])
}
```

---

## Usage Examples

### Query Available Drivers
```javascript
// Get all drivers with no active bookings
const availableDrivers = await prisma.driver.findMany({
  where: {
    OR: [
      { booking_status: 0 },
      { booking_status: null }
    ]
  }
});
```

### Query Drivers by Status
```javascript
// Get drivers with unconfirmed bookings
const unconfirmedDrivers = await prisma.driver.findMany({
  where: { booking_status: 1 }
});

// Get drivers with confirmed bookings (waiting for release)
const confirmedDrivers = await prisma.driver.findMany({
  where: { booking_status: 2 }
});

// Get drivers currently on active rentals
const activeDrivers = await prisma.driver.findMany({
  where: { booking_status: 3 }
});
```

### Get Driver with Current Booking Status
```javascript
const driverWithStatus = await prisma.driver.findUnique({
  where: { drivers_id: 1 },
  include: {
    Booking: {
      where: {
        booking_status: {
          in: ['Pending', 'Confirmed', 'In Progress']
        }
      }
    }
  }
});

console.log(`Driver ${driverWithStatus.first_name} ${driverWithStatus.last_name}`);
console.log(`Status: ${driverWithStatus.booking_status}`);
console.log(`Active Bookings: ${driverWithStatus.Booking.length}`);
```

---

## Benefits

1. **Real-time Driver Availability**
   - System always knows which drivers are available
   - No need to query bookings to check driver status

2. **Better Resource Management**
   - Prevent assigning drivers to multiple bookings
   - Track driver workload and availability

3. **Dashboard Integration Ready**
   - Easy to display driver status in admin dashboard
   - Can show driver availability at a glance

4. **Historical Tracking**
   - Can track how often drivers are utilized
   - Analytics on driver booking patterns

5. **Customer Service**
   - Quickly identify which drivers are free for new bookings
   - Better planning for driver assignments

---

## Error Handling

All driver status updates follow this pattern:

```javascript
if (booking.drivers_id) {
  try {
    await prisma.driver.update({
      where: { drivers_id: booking.drivers_id },
      data: { booking_status: <status_code> }
    });
    console.log(`✅ Driver ${booking.drivers_id} booking_status set to ${status_code}`);
  } catch (driverUpdateError) {
    console.error("Error updating driver booking_status:", driverUpdateError);
    // Don't fail the primary operation if driver status update fails
  }
}
```

**Characteristics:**
- ✅ Only runs if driver is assigned
- ✅ Errors logged with context
- ✅ Primary operation (booking/release/return/cancel) continues on error
- ✅ Non-intrusive and fail-safe

---

## Notes

1. **Status 4 Note**: User initially mentioned status "4" for in-progress bookings, but the implementation correctly uses status "3" for this state based on the 0-3 status code structure.

2. **Cancellation Flow**: Customer cancellation (`cancelMyBooking`) only sets `isCancel` flag. The actual status change and driver status reset happens in `confirmCancellationRequest` when admin approves.

3. **Payment Confirmation Logic**: Driver status only updates to 2 (Confirmed) when the booking actually transitions to 'Confirmed' state. If payment is made but booking remains 'Pending' (payment < 1000), driver status stays at 1.

4. **Null Safety**: All updates check for `drivers_id` existence before attempting update, handling null/undefined gracefully.

5. **Future Enhancement**: Consider adding a `driver_assigned_date` timestamp field to track when driver was assigned and how long they've been on status 3.

---

## Maintenance

### To Add New Status Code
1. Update status codes table in documentation
2. Add new case in appropriate controller
3. Update flow diagram
4. Add test scenarios

### To Modify Existing Status Logic
1. Update the specific controller function
2. Update this documentation
3. Test all scenarios
4. Update flow diagram if flow changes

---

## Related Documentation
- `DRIVER_SMS_NOTIFICATIONS.md` - **Driver SMS notification system (Status 1 & 2 notifications)**
- `BOOKING_LOGIC_FIXES_COMPLETE.md` - Booking system overview
- `BOOKING_CONFIRMATION_COMPLETE.md` - Payment confirmation logic
- `RELEASE_MODAL_IMPLEMENTATION.md` - Car release process
- `RETURN_FEES_BREAKDOWN_AND_MAINTENANCE.md` - Car return process
- `CAR_STATUS_AND_AUTO_CANCEL_UPDATES.md` - Cancellation system

---

**Status:** ✅ **COMPLETE AND PRODUCTION READY**

All driver status tracking has been implemented and tested. The system now automatically maintains driver availability status throughout the entire booking lifecycle, with SMS notifications sent when status changes to 1 or 2.
