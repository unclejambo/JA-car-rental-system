# Payment Notification Flow Diagrams

## Complete Customer Journey with All Notifications

```
┌─────────────────────────────────────────────────────────────────┐
│                    CUSTOMER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

Step 1: BOOKING CREATION
┌──────────────────┐
│ Customer Books   │
│ Car Online       │
└────────┬─────────┘
         │
         ▼
   ┌─────────────────────────┐
   │ NOTIFICATION #1         │
   │ Booking Success         │
   │ ✉️ SMS + Email           │
   │                         │
   │ "Your booking for       │
   │  [Car] is successful!"  │
   │                         │
   │ "Pay ₱1,000+ by [Date]" │
   │ "to confirm booking"    │
   └────────┬────────────────┘
            │
            ▼


Step 2a: GCASH PAYMENT PATH
┌──────────────────┐
│ Customer Submits │
│ GCash Payment    │
│ (₱1,500)         │
└────────┬─────────┘
         │
         │ [isPay = true]
         │ [Pending in admin panel]
         │
         ▼
┌──────────────────┐
│ Admin Reviews    │
│ GCash Screenshot │
│ & Verifies       │
└────────┬─────────┘
         │
         │ [Clicks "Confirm"]
         │
         ▼
   ┌─────────────────────────┐
   │ NOTIFICATION #2         │
   │ Payment Received        │
   │ ✉️ SMS + Email           │
   │                         │
   │ "We've received your    │
   │  GCash payment of       │
   │  ₱1,500"                │
   │                         │
   │ "Remaining: ₱2,000"     │
   └────────┬────────────────┘
            │
            ▼
   ┌─────────────────────────┐
   │ NOTIFICATION #3         │
   │ Booking Confirmation    │
   │ ✉️ SMS + Email           │
   │                         │
   │ "Your booking is now    │
   │  CONFIRMED!"            │
   │                         │
   │ "Complete booking       │
   │  details..."            │
   └─────────────────────────┘


Step 2b: CASH PAYMENT PATH
┌──────────────────┐
│ Customer Arrives │
│ On Pickup Day    │
│ With Cash        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Staff Receives   │
│ ₱1,500 Cash      │
│ Payment          │
└────────┬─────────┘
         │
         │ [Records in system]
         │
         ▼
   ┌─────────────────────────┐
   │ NOTIFICATION #2         │
   │ Payment Received        │
   │ ✉️ SMS + Email           │
   │ (IMMEDIATE)             │
   │                         │
   │ "We've received your    │
   │  Cash payment of        │
   │  ₱1,500"                │
   │                         │
   │ "Remaining: ₱2,000"     │
   └────────┬────────────────┘
            │
            ▼
   ┌─────────────────────────┐
   │ NOTIFICATION #3         │
   │ Booking Confirmation    │
   │ ✉️ SMS + Email           │
   │                         │
   │ "Your booking is now    │
   │  CONFIRMED!"            │
   │                         │
   │ "Complete booking       │
   │  details..."            │
   └─────────────────────────┘
```

## Technical Flow: GCash Payment Approval

```
┌─────────────────────────────────────────────────────────────────┐
│               GCASH PAYMENT TECHNICAL FLOW                       │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (Customer)
├─ Customer submits payment form
│  ├─ payment_method: "GCash"
│  ├─ gcash_no: "09171234567"
│  ├─ reference_no: "REF123456"
│  └─ amount: 1500
│
├─ POST /api/bookings/:id/customer-payment
│
└─ Backend creates payment & sets isPay = true


FRONTEND (Admin Panel)
├─ Admin sees booking with isPay = true
│  └─ Shows "Confirm" button
│
├─ Admin clicks "Confirm"
│
├─ PUT /api/bookings/:id/confirm
│
└─ confirmBooking() called


BACKEND (bookingController.js)
├─ Validate isPay = true
│
├─ Fetch latest payment
│  └─ WHERE booking_id = :id
│      ORDER BY paid_date DESC
│
├─ Check if payment_method = "GCash"
│  └─ IF TRUE ──────────────────────┐
│                                    │
│                                    ▼
│                    sendPaymentReceivedNotification()
│                    ├─ SMS: "GCash payment ₱1,500 received"
│                    └─ Email: Full payment details
│
├─ Calculate totalPaid
│
├─ IF totalPaid >= 1000 ────────────┐
│                                    │
│                                    ▼
│                    sendBookingConfirmationNotification()
│                    ├─ SMS: "Booking confirmed!"
│                    └─ Email: Full booking details
│
├─ Update booking
│  ├─ isPay = false
│  └─ booking_status = "Confirmed"
│
└─ Return success response
```

## Technical Flow: Cash Payment

```
┌─────────────────────────────────────────────────────────────────┐
│                CASH PAYMENT TECHNICAL FLOW                       │
└─────────────────────────────────────────────────────────────────┘

FRONTEND (Admin Panel)
├─ Staff opens payment modal for booking
│
├─ Enters payment details
│  ├─ payment_method: "Cash"
│  ├─ amount: 1500
│  └─ description: "Down payment"
│
├─ POST /api/payments
│
└─ Backend processes payment


BACKEND (paymentController.js)
├─ Validate booking exists
│
├─ Calculate running balance
│
├─ Create payment record
│  └─ payment_id: 123
│      booking_id: 45
│      payment_method: "Cash"
│      amount: 1500
│
├─ Check if payment_method = "Cash"
│  └─ IF TRUE ──────────────────────┐
│                                    │
│                                    ▼
│                    sendPaymentReceivedNotification()
│                    ├─ SMS: "Cash payment ₱1,500 received"
│                    └─ Email: Full payment details
│                    └─ (SENT IMMEDIATELY)
│
├─ Calculate newTotalPaid
│
├─ Determine booking status
│  └─ IF totalPaid >= 1000
│      └─ newStatus = "Confirmed"
│
├─ Track status change
│  └─ isNewlyConfirmed = (old="Pending" && new="Confirmed")
│
├─ Update booking
│  ├─ balance = updated
│  ├─ payment_status = updated
│  └─ booking_status = updated
│
├─ IF isNewlyConfirmed = true ──────┐
│                                    │
│                                    ▼
│                    sendBookingConfirmationNotification()
│                    ├─ SMS: "Booking confirmed!"
│                    └─ Email: Full booking details
│
└─ Return payment record
```

## Notification Sequence Matrix

```
┌──────────────────┬─────────────────┬──────────────────┬─────────────────┐
│  SCENARIO        │  Notification 1 │  Notification 2  │ Notification 3  │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ Create Booking   │ ✅ Booking      │ ⏳ (Pending)     │ ⏳ (Pending)    │
│                  │    Success      │                  │                 │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ GCash < ₱1k      │ ✅ Sent         │ ✅ Payment       │ ❌ Not sent     │
│ Approved         │    Already      │    Received      │    (< ₱1k)      │
│                  │                 │    (GCash)       │                 │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ GCash ≥ ₱1k      │ ✅ Sent         │ ✅ Payment       │ ✅ Booking      │
│ Approved         │    Already      │    Received      │    Confirmed    │
│                  │                 │    (GCash)       │                 │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ Cash < ₱1k       │ ✅ Sent         │ ✅ Payment       │ ❌ Not sent     │
│ Recorded         │    Already      │    Received      │    (< ₱1k)      │
│                  │                 │    (Cash)        │                 │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ Cash ≥ ₱1k       │ ✅ Sent         │ ✅ Payment       │ ✅ Booking      │
│ Recorded         │    Already      │    Received      │    Confirmed    │
│                  │                 │    (Cash)        │                 │
├──────────────────┼─────────────────┼──────────────────┼─────────────────┤
│ Multiple Pmts    │ ✅ Sent         │ ✅ Each payment  │ ✅ When total   │
│ (₱500 + ₱800)    │    at booking   │    triggers one  │    reaches ₱1k  │
└──────────────────┴─────────────────┴──────────────────┴─────────────────┘
```

## Notification Content Comparison

```
╔════════════════════════════════════════════════════════════════════╗
║                    BOOKING SUCCESS NOTIFICATION                     ║
╠════════════════════════════════════════════════════════════════════╣
║ Trigger: When booking is created                                   ║
║ Focus: Payment deadline to confirm booking                         ║
║                                                                     ║
║ SMS: "Booking successful! Pay ₱1,000+ by [Date] to confirm."      ║
║                                                                     ║
║ Email Highlights:                                                  ║
║ • Car details                                                      ║
║ • Rental dates                                                     ║
║ • Total cost                                                       ║
║ • ⚠️ Payment deadline (1hr/24hr/72hr)                              ║
║ • Payment instructions                                             ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║                   PAYMENT RECEIVED NOTIFICATION                     ║
╠════════════════════════════════════════════════════════════════════╣
║ Trigger: When payment is approved/recorded                         ║
║ Focus: Confirming specific payment was received                    ║
║                                                                     ║
║ SMS: "We've received your [GCash/Cash] payment of ₱[Amount]"      ║
║                                                                     ║
║ Email Highlights:                                                  ║
║ • ✅ Payment confirmation                                           ║
║ • Amount received                                                  ║
║ • Payment method & reference                                       ║
║ • Payment summary (total, paid, balance)                           ║
║ • Remaining balance (if any)                                       ║
╚════════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════════╗
║                  BOOKING CONFIRMATION NOTIFICATION                  ║
╠════════════════════════════════════════════════════════════════════╣
║ Trigger: When payment reaches ≥ ₱1,000                            ║
║ Focus: Booking is now officially confirmed                         ║
║                                                                     ║
║ SMS: "Your booking is now CONFIRMED! [Full details]"              ║
║                                                                     ║
║ Email Highlights:                                                  ║
║ • ✅ Booking confirmation                                           ║
║ • Complete rental details                                          ║
║ • Car information                                                  ║
║ • Pickup/return dates                                              ║
║ • What to bring                                                    ║
║ • Next steps                                                       ║
╚════════════════════════════════════════════════════════════════════╝
```

---

**Visual Guide Created**: October 17, 2025  
**Purpose**: Help understand the complete notification flow
