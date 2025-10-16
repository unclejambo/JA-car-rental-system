# Booking Notification System - Testing Guide

## 🧪 Complete Testing Checklist

Use this guide to thoroughly test the booking notification system.

---

## ⚙️ Pre-Testing Setup

### 1. Environment Configuration

**Option A: Production Mode (Real Notifications)**
```env
SEMAPHORE_API_KEY=your_actual_api_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

**Option B: Development Mode (Simulated)**
```env
# Leave these commented out or empty
# SEMAPHORE_API_KEY=
# EMAIL_USER=
# EMAIL_PASS=
```

### 2. Database Setup
- Ensure you have at least one customer with valid email and phone number
- Ensure you have at least one available car
- Backend server running on http://localhost:3001

### 3. Monitoring Setup
Keep these open during testing:
- Backend console/terminal (to see logs)
- Customer email inbox
- Phone (for SMS)

---

## 📋 Test Suite 1: Booking Creation Notifications

### Test 1.1: Same-Day Booking (1 Hour Deadline)

**Setup:**
- Current date: October 17, 2025, 10:00 AM
- Start date: October 17, 2025 (TODAY)
- End date: October 18, 2025

**Steps:**
1. Login as customer
2. Navigate to booking page
3. Select a car
4. Set start date = today
5. Set end date = tomorrow
6. Fill in all required fields
7. Submit booking

**Expected Results:**
- ✅ Booking created successfully
- ✅ Booking ID returned in response
- ✅ Backend logs show: "📧 Sending booking success notification..."
- ✅ Backend logs show: "✅ Booking success notification sent"
- ✅ SMS received within 1-2 minutes
- ✅ Email received within 1-2 minutes

**SMS should contain:**
- Customer first name
- Car name (make + model)
- Payment amount (balance)
- Deadline: "1 hour"
- Deadline date/time (Oct 17, 11:00 AM)
- Booking ID

**Email should contain:**
- All booking details
- Payment deadline section with "1 hour"
- Deadline: October 17, 2025, 11:00 AM
- Auto-cancellation warning

**Backend logs should show:**
```
📧 Sending booking success notification...
   → Sending SMS to [phone] and Email to [email]
      📱 Sending SMS to [phone]...
      ✅ SMS sent successfully! Message ID: msg_xxxxx
      📧 Sending email to [email]...
      ✅ Email sent successfully! Message ID: <xxxxx>
   ✅ Booking notification sent successfully
✅ Booking success notification sent
```

---

### Test 1.2: Within 3 Days Booking (24 Hour Deadline)

**Setup:**
- Current date: October 17, 2025, 10:00 AM
- Start date: October 19, 2025 (2 days away)
- End date: October 20, 2025

**Steps:**
1. Login as customer
2. Create booking with start date in 2 days
3. Submit booking

**Expected Results:**
- ✅ Booking created successfully
- ✅ Notifications sent

**Verify:**
- SMS deadline: "24 hours"
- Email deadline: October 18, 2025, 10:00 AM (24 hours from now)

---

### Test 1.3: More Than 3 Days Booking (72 Hour Deadline)

**Setup:**
- Current date: October 17, 2025, 10:00 AM
- Start date: October 25, 2025 (8 days away)
- End date: October 27, 2025

**Steps:**
1. Login as customer
2. Create booking with start date in 8 days
3. Submit booking

**Expected Results:**
- ✅ Booking created successfully
- ✅ Notifications sent

**Verify:**
- SMS deadline: "72 hours (3 days)"
- Email deadline: October 20, 2025, 10:00 AM (3 days from now)

---

### Test 1.4: Missing Contact Info

**Setup:**
- Create a test customer with missing phone OR email

**Test 1.4a: Missing Phone Number**
1. Customer has email but NO phone number
2. Create booking

**Expected:**
- ✅ Booking created
- ✅ Email sent
- ⚠️ Backend logs: "No contact number available"
- ✅ No error, system continues

**Test 1.4b: Missing Email**
1. Customer has phone but NO email
2. Create booking

**Expected:**
- ✅ Booking created
- ✅ SMS sent
- ⚠️ Backend logs: "No email available"
- ✅ No error, system continues

**Test 1.4c: Both Missing**
1. Customer has neither phone nor email
2. Create booking

**Expected:**
- ✅ Booking created
- ⚠️ Backend logs: "No contact info available"
- ✅ No error, system continues

---

## 📋 Test Suite 2: Booking Confirmation Notifications

### Test 2.1: Full Payment Confirmation (≥ ₱1,000)

**Setup:**
- Existing booking in "Pending" status
- Total amount: ₱5,000
- Balance: ₱5,000 (no payments yet)

**Steps:**
1. Login as admin
2. Go to Payments page
3. Add payment for the booking:
   - Amount: ₱3,000
   - Payment method: Cash
4. Click "Add Payment"
5. Go to Bookings page
6. Find the booking
7. Set "isPay" toggle to TRUE
8. Click "Confirm" button

**Expected Results:**
- ✅ Booking status changes to "Confirmed"
- ✅ isPay changes to FALSE
- ✅ Backend logs show: "📧 Sending booking confirmation notification..."
- ✅ SMS received
- ✅ Email received

**SMS should contain:**
- "Your booking is now CONFIRMED!"
- Car name
- Pickup date/time
- Booking ID

**Email should contain:**
- "✅ CONFIRMED" status
- Complete booking details
- Vehicle info with plate number
- Payment status:
  - Total: ₱5,000
  - Paid: ₱3,000
  - Remaining: ₱2,000
- Next steps
- What to bring

---

### Test 2.2: Insufficient Payment (< ₱1,000)

**Setup:**
- Existing booking in "Pending" status
- Total amount: ₱5,000
- Balance: ₱5,000

**Steps:**
1. Login as admin
2. Add payment for the booking:
   - Amount: ₱500 (less than ₱1,000)
3. Set isPay = TRUE
4. Click "Confirm" button

**Expected Results:**
- ✅ isPay changes to FALSE
- ✅ Booking status REMAINS "Pending"
- ❌ NO confirmation notification sent
- ⚠️ Backend logs: "Status remains Pending (totalPaid < 1000)"

---

### Test 2.3: Exact Minimum Payment (₱1,000)

**Setup:**
- Existing booking in "Pending" status
- Total amount: ₱5,000

**Steps:**
1. Add payment: ₱1,000
2. Set isPay = TRUE
3. Click "Confirm"

**Expected Results:**
- ✅ Status → "Confirmed"
- ✅ Confirmation notification sent
- ✅ Email shows:
  - Paid: ₱1,000
  - Remaining: ₱4,000

---

### Test 2.4: Multiple Partial Payments

**Setup:**
- Existing booking in "Pending" status
- Total amount: ₱5,000

**Steps:**
1. Add payment #1: ₱300
2. Set isPay = TRUE, Confirm
   - Expected: Status remains "Pending", NO notification
3. Add payment #2: ₱400
4. Set isPay = TRUE, Confirm
   - Expected: Status remains "Pending", NO notification (total = ₱700)
5. Add payment #3: ₱400
6. Set isPay = TRUE, Confirm
   - Expected: Status → "Confirmed", notification sent (total = ₱1,100)

---

### Test 2.5: Already Confirmed Booking

**Setup:**
- Booking already in "Confirmed" status
- isPay = FALSE

**Steps:**
1. Set isPay = TRUE
2. Click "Confirm"

**Expected Results:**
- ✅ isPay changes to FALSE
- ✅ Status remains "Confirmed"
- ❌ NO notification sent (already confirmed)
- ⚠️ Backend logs: "isPay -> false (status remains Confirmed)"

---

## 📋 Test Suite 3: Error Handling

### Test 3.1: Invalid API Keys

**Setup:**
```env
SEMAPHORE_API_KEY=invalid_key
EMAIL_USER=test@gmail.com
EMAIL_PASS=wrong_password
```

**Steps:**
1. Create a booking

**Expected:**
- ✅ Booking created successfully
- ⚠️ Backend logs show SMS error
- ⚠️ Backend logs show Email error
- ✅ System continues normal operation

---

### Test 3.2: Network Failure During Notification

**Setup:**
- Temporarily disable internet connection
- Or set invalid API URLs

**Steps:**
1. Create booking

**Expected:**
- ✅ Booking created
- ❌ Notifications fail
- ✅ Error logged but booking succeeds

---

## 📋 Test Suite 4: Edge Cases

### Test 4.1: Booking at Midnight

**Setup:**
- Current time: 11:55 PM
- Start date: Tomorrow (next day)

**Steps:**
1. Create booking

**Expected:**
- Deadline calculated correctly
- No timezone issues
- Notification sent

---

### Test 4.2: Booking Far in Future

**Setup:**
- Start date: 30 days from now

**Steps:**
1. Create booking

**Expected:**
- 72 hour deadline applied
- Notification sent
- Dates formatted correctly

---

### Test 4.3: Special Characters in Names

**Setup:**
- Customer name: "José María O'Brien"
- Car name: "Toyota Vios (2024)"

**Steps:**
1. Create booking

**Expected:**
- SMS delivered correctly
- Email delivered correctly
- Special characters handled properly

---

## 📊 Test Results Template

Use this template to document your test results:

```
Test ID: [1.1, 1.2, etc.]
Date: [Date]
Tester: [Your Name]

Environment:
- [ ] Production Mode
- [ ] Development Mode

Test Result: 
- [ ] PASS
- [ ] FAIL

SMS Received:
- [ ] Yes, within 1-2 minutes
- [ ] Yes, but delayed (X minutes)
- [ ] No

Email Received:
- [ ] Yes, within 1-2 minutes
- [ ] Yes, in spam folder
- [ ] Yes, but delayed
- [ ] No

Backend Logs:
[Paste relevant logs here]

Issues Found:
[Describe any issues]

Screenshots:
[Attach if needed]

Notes:
[Additional observations]
```

---

## 🔍 Verification Checklist

After running all tests, verify:

### Functionality
- [ ] Booking creation works without notifications
- [ ] Booking creation works with notifications
- [ ] SMS sent for all valid cases
- [ ] Email sent for all valid cases
- [ ] Payment deadline calculated correctly
- [ ] Confirmation only sent when totalPaid ≥ ₱1,000
- [ ] No notification sent for already confirmed bookings

### Error Handling
- [ ] Missing phone number handled gracefully
- [ ] Missing email handled gracefully
- [ ] Invalid API keys don't break bookings
- [ ] Network errors don't break bookings

### Content Quality
- [ ] SMS messages are clear and concise
- [ ] Email messages are well-formatted
- [ ] All variables populated correctly
- [ ] No placeholder text visible
- [ ] Dates formatted in Philippine timezone
- [ ] Currency formatted correctly (₱)

### Performance
- [ ] Booking creation response time acceptable
- [ ] Notifications don't slow down API response
- [ ] System handles concurrent bookings

### Security
- [ ] No sensitive data in SMS
- [ ] Email authentication works
- [ ] API keys not exposed in logs

---

## 🐛 Common Issues & Solutions

### Issue: SMS Not Received

**Check:**
1. Phone number format in database (must include +63)
2. Semaphore API key valid and has credit
3. Backend logs for error messages
4. Semaphore dashboard for delivery status

**Solution:**
- Update phone number format
- Top up Semaphore credit
- Check API key configuration

---

### Issue: Email in Spam

**Check:**
1. Gmail settings allow "less secure apps"
2. Using App Password (not regular password)
3. Sender email properly configured

**Solution:**
- Generate new App Password in Gmail
- Ask customer to whitelist sender
- Configure SPF/DKIM records (advanced)

---

### Issue: Wrong Deadline Calculated

**Check:**
1. System timezone settings
2. Booking dates stored correctly
3. Date calculations in logs

**Solution:**
- Verify server timezone
- Check date storage format
- Review calculation logic

---

### Issue: Duplicate Notifications

**Check:**
1. Function called multiple times?
2. Multiple servers running?
3. Retry logic triggering?

**Solution:**
- Check API calls
- Stop duplicate processes
- Review error handling

---

## 📝 Post-Testing Actions

After successful testing:

1. **Document Results**
   - Save test results
   - Document any issues found
   - Create bug tickets if needed

2. **Update Configuration**
   - Set production API keys
   - Configure email properly
   - Verify environment variables

3. **Monitor Initial Deployment**
   - Watch backend logs
   - Check notification delivery
   - Gather customer feedback

4. **Optimize if Needed**
   - Adjust message content based on feedback
   - Fine-tune deadline rules if needed
   - Update documentation

---

## 🚀 Go-Live Checklist

Before deploying to production:

- [ ] All test suites passed
- [ ] API keys configured in production
- [ ] Email credentials verified
- [ ] Test with real customer data
- [ ] Backend logs reviewed
- [ ] Documentation updated
- [ ] Team trained on new feature
- [ ] Customer support informed
- [ ] Monitoring tools configured
- [ ] Rollback plan prepared

---

**Last Updated:** October 17, 2025
**Version:** 1.0.0
