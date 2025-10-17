# Booking Notification System - Visual Flow

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BOOKING NOTIFICATION FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   CUSTOMER       │
│  Creates Booking │
└────────┬─────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: createBooking() in bookingController.js      │
│  1. Validate data                                       │
│  2. Create booking record (status = "Pending")          │
│  3. Update car status to "Rented"                       │
│  4. Create initial payment record (amount = 0)          │
└────────┬────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  SEND NOTIFICATION #1: Booking Success                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│  📱 SMS: "Booking successful! Pay ₱X within [deadline]" │
│  📧 EMAIL: Full booking details + payment instructions  │
│                                                         │
│  Includes:                                              │
│  • Booking ID                                           │
│  • Car details                                          │
│  • Pickup/Return dates & locations                      │
│  • Total amount & balance due                           │
│  • ⏰ PAYMENT DEADLINE (auto-calculated)                │
│  • ⚠️  Auto-cancellation warning                        │
└────────┬────────────────────────────────────────────────┘
         │
         │ Booking Created ✓
         │ Customer Notified ✓
         │
         ▼
┌──────────────────────────────────────────────┐
│  BOOKING STATUS: "Pending"                   │
│  Waiting for customer payment...             │
└──────────────────────────────────────────────┘
         │
         │ (Customer makes payment)
         │
         ▼
┌──────────────────────────────────────────────┐
│  ADMIN                                       │
│  1. Receives payment from customer           │
│  2. Goes to Payments page                    │
│  3. Adds payment record                      │
│     - Booking ID                             │
│     - Amount (e.g., ₱1,000 or more)          │
│     - Payment method                         │
│  4. Clicks "Add Payment"                     │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND: createPayment() in paymentController.js      │
│  1. Create payment record                               │
│  2. Calculate new total paid                            │
│  3. Determine new booking status                        │
│  4. Check: Was status "Pending" before?                 │
│  5. Check: Is new status "Confirmed"?                   │
│  6. Update booking with new status                      │
└────────┬────────────────────────────────────────────────┘
         │
         ├─ NO (totalPaid < ₱1,000)
         │  │
         │  ▼
         │  Status remains "Pending"
         │  NO notification sent
         │
         ├─ YES (totalPaid >= ₱1,000) ✓
         │  │
         │  ▼
         │  Status → "Confirmed" (AUTOMATIC)
         │  │
         │  ▼
         │  ┌─────────────────────────────────────────────────┐
         │  │  SEND NOTIFICATION #2: Booking Confirmed        │
         │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
         │  │  📱 SMS: "Booking CONFIRMED! Pickup: [date]"    │
         │  │  📧 EMAIL: Complete guide for pickup            │
         │  │                                                 │
         │  │  Includes:                                      │
         │  │  • ✅ Confirmed status                          │
         │  │  • Vehicle details + plate number               │
         │  │  • Rental period                                │
         │  │  • Pickup/return locations                      │
         │  │  • Payment breakdown (paid + remaining)         │
         │  │  • What to bring (license, ID)                  │
         │  │  • Next steps                                   │
         │  └─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  BOOKING STATUS: "Confirmed"                 │
│  Customer ready for pickup! 🎉               │
└──────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────┐
│  ALTERNATIVE PATH: Manual Confirmation (Optional)             │
├───────────────────────────────────────────────────────────────┤
│  If admin wants to manually confirm after payment:            │
│  1. Set isPay = TRUE                                          │
│  2. Click "Confirm Booking" button                            │
│  3. confirmBooking() function also sends notification         │
│                                                               │
│  Note: This is optional - automatic confirmation happens      │
│  immediately when payment >= ₱1,000 is added                  │
└───────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════
                    PAYMENT DEADLINE CALCULATION
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  When is the booking start date?                                │
└─────────────────────────────────────────────────────────────────┘
         │
         ├─ TODAY (same day)
         │  │
         │  ▼
         │  ⏰ Deadline: 1 HOUR from booking creation
         │  
         │  Example:
         │  Booking created: Oct 17, 10:00 AM
         │  Start date: Oct 17 (today)
         │  Deadline: Oct 17, 11:00 AM
         │
         ├─ WITHIN 3 DAYS (but not today)
         │  │
         │  ▼
         │  ⏰ Deadline: 24 HOURS from booking creation
         │  
         │  Example:
         │  Booking created: Oct 17, 10:00 AM
         │  Start date: Oct 19 (2 days away)
         │  Deadline: Oct 18, 10:00 AM
         │
         └─ MORE THAN 3 DAYS away
            │
            ▼
            ⏰ Deadline: 72 HOURS (3 days) from booking creation
            
            Example:
            Booking created: Oct 17, 10:00 AM
            Start date: Oct 25 (8 days away)
            Deadline: Oct 20, 10:00 AM


═══════════════════════════════════════════════════════════════════
                    AUTO-CANCELLATION INTEGRATION
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────┐
│  Scheduled Task runs every X minutes         │
│  (See autoCancel.js)                         │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Find all "Pending" bookings                 │
│  where isPay = FALSE or NULL                 │
└────────┬─────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  For each booking:                           │
│  Calculate deadline (same rules as above)    │
│  Check if current time > deadline            │
└────────┬─────────────────────────────────────┘
         │
         ├─ NO: Deadline not passed yet
         │  └─> Skip (keep booking)
         │
         └─ YES: Deadline passed ⚠️
            │
            ▼
            ┌──────────────────────────────────┐
            │  AUTO-CANCEL BOOKING:            │
            │  1. Delete payment records       │
            │  2. Delete booking               │
            │  3. Set car status = "Available" │
            │  4. Create transaction record    │
            └──────────────────────────────────┘
            
            Note: Customer was warned in 
            Notification #1 about this!


═══════════════════════════════════════════════════════════════════
                         ERROR HANDLING
═══════════════════════════════════════════════════════════════════

┌──────────────────────────────────────────────┐
│  Notification Sending Failed? ❌             │
└────────┬─────────────────────────────────────┘
         │
         ├─ SMS Failed
         │  │
         │  ▼
         │  • Log error to console
         │  • Try email instead
         │  • Booking still succeeds ✓
         │
         ├─ Email Failed
         │  │
         │  ▼
         │  • Log error to console
         │  • Try SMS instead
         │  • Booking still succeeds ✓
         │
         └─ Both Failed
            │
            ▼
            • Log errors to console
            • Booking STILL succeeds ✓
            • Admin can manually notify customer


═══════════════════════════════════════════════════════════════════
                    CONFIRMATION LOGIC DECISION TREE
═══════════════════════════════════════════════════════════════════

Admin clicks "Confirm Booking"
         │
         ▼
      isPay = TRUE? ──NO──> ❌ Error: "isPay must be TRUE"
         │
         YES
         ▼
   Status = "Pending"?
         │
         ├─ YES
         │  │
         │  ▼
         │  totalPaid >= ₱1,000?
         │  │
         │  ├─ YES ✓
         │  │  │
         │  │  ▼
         │  │  • Status → "Confirmed"
         │  │  • isPay → FALSE
         │  │  • 📧 Send Notification #2
         │  │  • ✅ Success!
         │  │
         │  └─ NO
         │     │
         │     ▼
         │     • Status remains "Pending"
         │     • isPay → FALSE
         │     • ❌ NO notification sent
         │     • ⚠️  Customer needs to pay more
         │
         ├─ Status = "Confirmed"
         │  │
         │  ▼
         │  • Status remains "Confirmed"
         │  • isPay → FALSE
         │  • ❌ NO notification sent (already sent)
         │  • ✅ Success!
         │
         └─ Status = "In Progress"
            │
            ▼
            • Status remains "In Progress"
            • isPay → FALSE
            • ❌ NO notification sent
            • ✅ Success!
```

## 🎯 Key Takeaways

1. **Two Notifications, Two Purposes:**
   - Notification #1: Inform + Urgency (pay now or lose booking)
   - Notification #2: Confirm + Guide (you're all set, here's what's next)

2. **Smart Deadlines:**
   - More urgent bookings = shorter deadline
   - Prevents last-minute no-shows
   - Matches auto-cancellation system

3. **Non-Blocking Design:**
   - Notifications can fail without breaking bookings
   - Customer experience not disrupted
   - Admin can manually follow up if needed

4. **Minimum Confirmation Fee:**
   - ≥ ₱1,000 required to confirm booking
   - Prevents spam bookings
   - Customer can pay balance later

5. **Automatic Status Management:**
   - System handles status transitions
   - Notifications sent at right moments
   - No manual notification needed

---

**Quick Reference:**
- 📱 = SMS Notification
- 📧 = Email Notification
- ✓ = Success path
- ❌ = Error/Skip path
- ⚠️ = Warning
- ⏰ = Time-based rule
