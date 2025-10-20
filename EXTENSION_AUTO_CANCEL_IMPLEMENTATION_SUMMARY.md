# Extension Auto-Cancel Implementation Summary

**Date:** October 20, 2025  
**Status:** Pre-Implementation Analysis & Proposal

---

## 🎯 Your Key Questions Answered

### **Q1: Can a customer request extension when NOT currently using the vehicle?**

**Answer: NO** ❌

**Clarification:**
- Extension is ONLY allowed when:
  - ✅ Booking status is `"In Progress"` (vehicle released to customer)
  - ✅ `isRelease = true` (vehicle currently in customer's possession)
  - ❌ NOT allowed if booking is still `"Pending"` or `"Confirmed"` (not yet picked up)
  - ❌ NOT allowed if `"Completed"` or `"Cancelled"`

**Current Code Validation (ALREADY IMPLEMENTED):**
```javascript
// bookingController.js - extendMyBooking() line ~1108
if (booking.booking_status !== 'In Progress') {
  return res.status(400).json({ 
    error: 'Only bookings in progress can be extended' 
  });
}

if (!booking.isRelease) {
  return res.status(400).json({ 
    error: 'Vehicle must be released before extension request' 
  });
}
```

✅ **Your system ALREADY enforces this correctly!**

---

### **Q2: How does continuous extension affect booking history display?**

**Answer: Only ONE booking record shown, with extension history accessible**

#### **Admin Side - Booking History:**

**Display Logic:**
```javascript
// The Booking table record is updated with latest end_date
// BUT Extension table keeps full history

// What admin sees in booking list:
{
  booking_id: 123,
  customer_name: "John Doe",
  start_date: "2025-12-01",
  end_date: "2025-12-15",  // ← Latest end_date (after 3 extensions)
  original_end_date: "2025-12-05", // ← Can calculate from Extension table
  total_amount: 15000,  // ← Accumulated with all extensions
  has_extensions: true,
  extension_count: 3
}
```

**Proposed Enhancement for Admin Booking History:**
1. Show main booking record with CURRENT end_date
2. Add visual indicator (badge/icon) if booking has extensions
3. Add "View Extension History" button/expandable section
4. Extension history shows timeline:
   ```
   Original: Dec 1-5 (5 days)
   Extension 1: Dec 5→8 (+3 days) - Approved Dec 1
   Extension 2: Dec 8→12 (+4 days) - Approved Dec 5
   Extension 3: Dec 12→15 (+3 days) - Approved Dec 10
   Current: Dec 1-15 (15 days total)
   ```

#### **Customer Side - Booking History:**

**Same principle - ONE booking entry:**
```javascript
// Customer sees in "My Bookings":
{
  booking_id: 123,
  car: "Toyota Camry 2024",
  period: "Dec 1 - Dec 15, 2025", // Current dates
  status: "In Progress",
  total_cost: ₱15,000,
  extended: "3 times" // Visual badge
}

// When clicking "View Details":
- Shows current booking details
- Shows "Extension History" section with timeline
- Each extension shows: old date → new date, additional cost, approval date
```

---

### **Q3: Can we copy booking details to Extension table for record keeping?**

**Answer: YES - Recommended enhancement**

#### **Current Extension Table (Minimal):**
```prisma
model Extension {
  extension_id Int       @id
  booking_id   Int
  old_end_date DateTime
  new_end_date DateTime?
  approve_time DateTime?
}
```

#### **Proposed Enhanced Extension Table:**
```prisma
model Extension {
  extension_id     Int       @id @default(autoincrement())
  booking_id       Int
  old_end_date     DateTime  @db.Timestamptz(6)
  new_end_date     DateTime? @db.Timestamptz(6)
  approve_time     DateTime? @db.Timestamptz(6)
  
  // NEW FIELDS FOR RECORD KEEPING:
  request_date     DateTime  @db.Timestamptz(6) // When customer requested
  additional_cost  Int?      // Cost of this specific extension
  old_dropoff_time DateTime? @db.Timestamptz(6) // Previous dropoff time
  new_dropoff_time DateTime? @db.Timestamptz(6) // New dropoff time
  extension_status String?   @default("Pending") // Pending/Approved/Rejected/Auto-Cancelled
  rejection_reason String?   // If rejected by admin
  
  // COPY FROM BOOKING (for historical accuracy):
  purpose          String?   // Purpose stays same, but keep for context
  pickup_loc       String?   // Pickup location (reference)
  dropoff_loc      String?   // Dropoff location (reference)
  
  booking          Booking   @relation(fields: [booking_id], references: [booking_id])
}
```

**Why copy these details?**
1. **Audit Trail**: If booking details change later, extension history remains accurate
2. **Reports**: Can generate extension-specific reports without joining to Booking
3. **Customer Communication**: Can show exact extension request details in notifications
4. **Billing**: Clear breakdown of additional costs per extension

---

### **Q4: How to distinguish if it's an extension in booking history?**

**Answer: Multiple methods**

#### **Method 1: Check Extension Table (Most Accurate)**
```javascript
// Backend query
const bookingWithExtensions = await prisma.booking.findUnique({
  where: { booking_id: 123 },
  include: {
    extensions: {
      where: { approve_time: { not: null } }, // Only approved
      orderBy: { extension_id: 'asc' }
    }
  }
});

const hasExtensions = bookingWithExtensions.extensions.length > 0;
const extensionCount = bookingWithExtensions.extensions.length;
```

#### **Method 2: Add Flag to Booking Table (Faster Queries)**
```prisma
model Booking {
  // ... existing fields ...
  has_extensions   Boolean?  @default(false)
  extension_count  Int?      @default(0)
  original_end_date DateTime? @db.Timestamptz(6) // Store original before first extension
}
```

Update when extension is approved:
```javascript
// In confirmExtensionRequest()
await prisma.booking.update({
  where: { booking_id },
  data: {
    has_extensions: true,
    extension_count: { increment: 1 },
    original_end_date: booking.original_end_date || booking.end_date // Set once
  }
});
```

#### **Method 3: Visual Indicators in UI**
```javascript
// Frontend component
{booking.has_extensions && (
  <Badge color="info">
    Extended {booking.extension_count}x
  </Badge>
)}

// Or calculate time difference
const totalDays = daysBetween(booking.start_date, booking.end_date);
const originalDays = daysBetween(booking.start_date, booking.original_end_date);
const extendedDays = totalDays - originalDays;

{extendedDays > 0 && (
  <Chip label={`+${extendedDays} days extended`} color="primary" />
)}
```

---

## 📋 Proposed Implementation Summary

### **Phase 1: Database Schema Updates**

#### 1.1 Update Booking Table
```sql
ALTER TABLE "Booking" 
ADD COLUMN "payment_deadline" TIMESTAMPTZ,
ADD COLUMN "extension_payment_deadline" TIMESTAMPTZ,
ADD COLUMN "has_extensions" BOOLEAN DEFAULT false,
ADD COLUMN "extension_count" INTEGER DEFAULT 0,
ADD COLUMN "original_end_date" TIMESTAMPTZ;
```

#### 1.2 Enhance Extension Table
```sql
ALTER TABLE "Extension"
ADD COLUMN "request_date" TIMESTAMPTZ,
ADD COLUMN "additional_cost" INTEGER,
ADD COLUMN "old_dropoff_time" TIMESTAMPTZ,
ADD COLUMN "new_dropoff_time" TIMESTAMPTZ,
ADD COLUMN "extension_status" VARCHAR(50) DEFAULT 'Pending',
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "purpose" TEXT,
ADD COLUMN "pickup_loc" TEXT,
ADD COLUMN "dropoff_loc" TEXT;
```

---

### **Phase 2: Extension Auto-Cancel Logic**

#### 2.1 Extension Payment Deadline Calculation
```javascript
// New function in bookingController.js
function calculateExtensionPaymentDeadline(currentEndDate) {
  const now = new Date();
  const endDate = new Date(currentEndDate);
  const hoursUntilEnd = (endDate - now) / (1000 * 60 * 60);
  
  // Same 3-tier system as booking
  if (hoursUntilEnd <= 24) {
    return new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour
  } else if (hoursUntilEnd <= 72) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  } else {
    return new Date(now.getTime() + 72 * 60 * 60 * 1000); // 72 hours
  }
}
```

#### 2.2 Update extendMyBooking() Function
```javascript
// When customer requests extension
const extensionDeadline = calculateExtensionPaymentDeadline(booking.end_date);

// Update booking
await prisma.booking.update({
  where: { booking_id },
  data: {
    isExtend: true,
    new_end_date: newEndDate,
    total_amount: newTotalAmount,
    balance: newBalance,
    payment_status: 'Unpaid',
    extension_payment_deadline: extensionDeadline // NEW
  }
});

// Create extension record with enhanced details
await prisma.extension.create({
  data: {
    booking_id,
    old_end_date: booking.end_date,
    new_end_date: newEndDate,
    request_date: new Date(), // NEW
    additional_cost: additionalCost, // NEW
    old_dropoff_time: booking.dropoff_time, // NEW
    new_dropoff_time: newDropoffTime, // NEW
    extension_status: 'Pending', // NEW
    purpose: booking.purpose, // NEW - Copy from booking
    pickup_loc: booking.pickup_loc, // NEW - Copy from booking
    dropoff_loc: booking.dropoff_loc, // NEW - Copy from booking
  }
});
```

#### 2.3 Update confirmExtensionRequest() Function
```javascript
// Get latest approved extension to determine old_end_date for continuous extensions
const latestExtension = await prisma.extension.findFirst({
  where: { 
    booking_id,
    approve_time: { not: null }
  },
  orderBy: { extension_id: 'desc' }
});

const oldEndDate = latestExtension 
  ? latestExtension.new_end_date 
  : booking.end_date;

// Update extension record
await prisma.extension.update({
  where: { extension_id },
  data: {
    approve_time: new Date(),
    extension_status: 'Approved', // NEW
    old_end_date: oldEndDate // UPDATED for continuous extensions
  }
});

// Update booking
await prisma.booking.update({
  where: { booking_id },
  data: {
    end_date: booking.new_end_date,
    dropoff_time: newDropoffTime,
    new_end_date: null,
    isExtend: false,
    payment_status: 'Unpaid',
    extension_payment_deadline: null,
    has_extensions: true, // NEW
    extension_count: { increment: 1 }, // NEW
    original_end_date: booking.original_end_date || booking.end_date // NEW - Set once
  }
});
```

#### 2.4 Update rejectExtensionRequest() Function
```javascript
// Update extension record
await prisma.extension.update({
  where: { extension_id },
  data: {
    extension_status: 'Rejected', // NEW
    rejection_reason: reason || 'Rejected by admin' // NEW
  }
});

// Revert booking (ALREADY IMPLEMENTED, just add deadline clear)
await prisma.booking.update({
  where: { booking_id },
  data: {
    // ... existing revert logic ...
    extension_payment_deadline: null // NEW - Clear extension deadline
  }
});
```

---

### **Phase 3: Auto-Cancel Integration**

#### 3.1 Update autoCancel.js
```javascript
// Modified autoCancelExpiredBookings()
async function autoCancelExpiredBookings() {
  const now = new Date();
  
  // Find bookings with expired extension payment deadline
  const expiredExtensions = await prisma.booking.findMany({
    where: {
      isExtend: true, // Has pending extension
      extension_payment_deadline: { lte: now }, // Deadline passed
      booking_status: 'In Progress'
    }
  });
  
  for (const booking of expiredExtensions) {
    // Option 1: Auto-reject extension, keep booking active with original end_date
    await autoRejectExtension(booking);
    
    // Option 2: Cancel entire booking if payment not made
    // (discuss with team which approach to use)
  }
  
  // Find bookings with expired initial payment deadline
  const expiredBookings = await prisma.booking.findMany({
    where: {
      isExtend: false, // No pending extension
      payment_deadline: { lte: now },
      payment_status: { in: ['Unpaid', 'Partially Paid'] },
      booking_status: { in: ['Pending', 'Confirmed'] }
    }
  });
  
  for (const booking of expiredBookings) {
    await autoCancelBooking(booking);
  }
}

async function autoRejectExtension(booking) {
  // Find pending extension
  const pendingExtension = await prisma.extension.findFirst({
    where: {
      booking_id: booking.booking_id,
      approve_time: null,
      extension_status: 'Pending'
    },
    orderBy: { extension_id: 'desc' }
  });
  
  if (pendingExtension) {
    // Update extension status
    await prisma.extension.update({
      where: { extension_id: pendingExtension.extension_id },
      data: {
        extension_status: 'Auto-Cancelled',
        rejection_reason: 'Payment deadline expired'
      }
    });
    
    // Revert booking to original state
    const restoredAmount = booking.total_amount - pendingExtension.additional_cost;
    const restoredBalance = booking.balance - pendingExtension.additional_cost;
    
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        new_end_date: null,
        isExtend: false,
        total_amount: restoredAmount,
        balance: restoredBalance,
        extension_payment_deadline: null,
        // Keep original end_date - booking continues normally
      }
    });
    
    // Send notification to customer
    await sendNotification(booking.customer_id, {
      type: 'EXTENSION_AUTO_CANCELLED',
      message: `Your extension request for booking #${booking.booking_id} was automatically cancelled due to unpaid extension fee. Original rental period remains active.`
    });
  }
}
```

---

### **Phase 4: Frontend Display Updates**

#### 4.1 Admin Booking History Component
```javascript
// Enhanced booking row display
const BookingRow = ({ booking }) => {
  const hasExtensions = booking.extension_count > 0;
  const [showExtensionHistory, setShowExtensionHistory] = useState(false);
  
  return (
    <TableRow>
      <TableCell>{booking.booking_id}</TableCell>
      <TableCell>{booking.customer_name}</TableCell>
      <TableCell>
        {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
        {hasExtensions && (
          <Chip 
            size="small" 
            label={`Extended ${booking.extension_count}x`}
            color="info"
            onClick={() => setShowExtensionHistory(true)}
          />
        )}
      </TableCell>
      <TableCell>{formatCurrency(booking.total_amount)}</TableCell>
      <TableCell>{booking.booking_status}</TableCell>
      
      {/* Extension History Modal */}
      {showExtensionHistory && (
        <ExtensionHistoryModal 
          bookingId={booking.booking_id}
          onClose={() => setShowExtensionHistory(false)}
        />
      )}
    </TableRow>
  );
};
```

#### 4.2 Extension History Modal Component
```javascript
const ExtensionHistoryModal = ({ bookingId }) => {
  const [extensions, setExtensions] = useState([]);
  
  useEffect(() => {
    // Fetch extension history
    fetch(`${API_BASE}/bookings/${bookingId}/extensions`)
      .then(res => res.json())
      .then(data => setExtensions(data));
  }, [bookingId]);
  
  return (
    <Dialog>
      <DialogTitle>Extension History - Booking #{bookingId}</DialogTitle>
      <DialogContent>
        <Timeline>
          {/* Original Booking */}
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="primary" />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="h6">Original Booking</Typography>
              <Typography>
                {formatDate(booking.start_date)} - {formatDate(booking.original_end_date)}
              </Typography>
            </TimelineContent>
          </TimelineItem>
          
          {/* Each Extension */}
          {extensions.map((ext, index) => (
            <TimelineItem key={ext.extension_id}>
              <TimelineSeparator>
                <TimelineDot color={
                  ext.extension_status === 'Approved' ? 'success' : 
                  ext.extension_status === 'Rejected' ? 'error' : 'warning'
                } />
                {index < extensions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">
                  Extension {index + 1} - {ext.extension_status}
                </Typography>
                <Typography>
                  {formatDate(ext.old_end_date)} → {formatDate(ext.new_end_date)}
                </Typography>
                <Typography variant="caption">
                  Additional: {formatCurrency(ext.additional_cost)}
                </Typography>
                <Typography variant="caption">
                  Approved: {formatDate(ext.approve_time)}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </DialogContent>
    </Dialog>
  );
};
```

#### 4.3 Customer Booking History Component
```javascript
// Similar to admin, but customer-focused UI
const MyBookingCard = ({ booking }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">
          Booking #{booking.booking_id}
          {booking.has_extensions && (
            <Badge badgeContent={booking.extension_count} color="primary">
              <ExtensionIcon />
            </Badge>
          )}
        </Typography>
        
        <Typography>
          Period: {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
        </Typography>
        
        {booking.has_extensions && (
          <Alert severity="info">
            This booking has been extended {booking.extension_count} time(s).
            Original end date was {formatDate(booking.original_end_date)}.
          </Alert>
        )}
        
        <Button onClick={() => viewExtensionHistory(booking.booking_id)}>
          View Extension History
        </Button>
      </CardContent>
    </Card>
  );
};
```

---

## 🎯 Key Takeaways

### **1. Extension Eligibility**
✅ **ONLY** allowed when `booking_status = "In Progress"` AND `isRelease = true`  
✅ Customer MUST be actively using the vehicle  
✅ Already enforced in your current code

### **2. Booking History Display**
✅ **ONE** booking record shown with current (extended) end_date  
✅ Extension count badge/indicator visible  
✅ Extension history accessible via expandable section/modal  
✅ Timeline view shows: Original → Extension 1 → Extension 2 → etc.

### **3. Extension Record Keeping**
✅ **Enhanced Extension table** stores full details of each extension  
✅ Copies purpose, locations from booking for historical accuracy  
✅ Tracks status (Pending/Approved/Rejected/Auto-Cancelled)  
✅ Records additional cost per extension  
✅ Maintains audit trail for compliance/reporting

### **4. Distinguishing Extensions**
✅ **Method 1:** Check `has_extensions` flag (fast)  
✅ **Method 2:** Count records in Extension table (accurate)  
✅ **Method 3:** Compare `original_end_date` vs `end_date` (calculated)  
✅ **UI:** Visual badges, chips, icons to highlight extended bookings

### **5. Auto-Cancel Behavior**
✅ Separate deadline for extension payment (`extension_payment_deadline`)  
✅ If extension payment deadline expires → Auto-reject extension only  
✅ Original booking continues with original end_date  
✅ Customer notified of auto-cancellation  
✅ Booking remains "In Progress" until original end_date

---

## 📊 Implementation Phases Summary

| Phase | Task | Estimated Effort |
|-------|------|-----------------|
| **Phase 1** | Database schema updates (Booking + Extension tables) | 2 hours |
| **Phase 2** | Extension payment deadline logic | 4 hours |
| **Phase 3** | Auto-cancel integration for extensions | 3 hours |
| **Phase 4** | Frontend history display & timeline UI | 6 hours |
| **Testing** | End-to-end testing (continuous extensions, auto-cancel) | 4 hours |
| **Total** | | **~19 hours** |

---

## ✅ Ready to Implement?

This proposal ensures:
1. ✅ Extensions only allowed during active rentals
2. ✅ Clean booking history display (one record, extension timeline)
3. ✅ Comprehensive extension record keeping
4. ✅ Clear visual distinction for extended bookings
5. ✅ Proper auto-cancel handling for unpaid extension fees
6. ✅ Maintains data integrity for continuous extensions

**Next Steps:**
1. Review and approve this proposal
2. Create database migration scripts
3. Implement backend logic phase by phase
4. Update frontend components
5. Comprehensive testing with multiple extension scenarios

Let me know if you'd like me to proceed with the implementation! 🚀
