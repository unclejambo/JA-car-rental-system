# SMS Notification Service - Activated

## Date: October 16, 2025

## Summary
The SMS notification service has been activated to send actual SMS messages via Semaphore API with the registered sender name **"JACarRental"**.

---

## Changes Made

### **Updated File:** `backend/src/utils/notificationService.js`

**Before:** Simulated SMS sending (placeholder)
```javascript
// Placeholder implementation
console.log(`📱 SMS would be sent to ${phoneNumber}: "${message}"`);

// Simulated success response
return {
  success: true,
  messageId: `msg_${Date.now()}`,
  recipient: phoneNumber,
  message: message
};
```

**After:** Actual SMS sending via Semaphore API
```javascript
const SEMAPHORE_API_KEY = process.env.SEMAPHORE_API_KEY;

// Check if configured
if (!SEMAPHORE_API_KEY) {
  // Falls back to simulated mode
  return { success: true, simulated: true };
}

// Send actual SMS
const response = await fetch('https://api.semaphore.co/api/v4/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    apikey: SEMAPHORE_API_KEY,
    number: phoneNumber,
    message: message,
    sendername: 'JACarRental'  // Registered sender name
  })
});
```

---

## Sender Name Configuration

✅ **Sender Name:** `JACarRental` (as registered with Semaphore)

This appears on the recipient's phone as:
```
From: JACarRental
Message: Hi Gregg! The Ford Granger (2026) is now available for booking...
```

---

## Environment Configuration

**Required in `.env`:**
```env
SEMAPHORE_API_KEY=3724e4af6df4b4ff08ef07596e05f5d9
```

✅ Already configured in your `.env` file!

---

## SMS Message Format

When a car becomes available, customers receive:

**Example SMS:**
```
Hi Gregg! The Ford Granger (2026) is now available for booking at JA Car Rental. Book now!
```

**Message Structure:**
- Personal greeting with customer's first name
- Car details (make, model, year)
- Call to action
- Company name
- Sender: JACarRental

---

## How It Works

### **Notification Flow:**

1. **Customer subscribes** with `isRecUpdate = 1` (SMS) or `3` (Both)
2. **Admin changes car** to "Available"
3. **System triggers** notification
4. **SMS Service checks** for API key:
   - If **configured** → Sends actual SMS via Semaphore
   - If **not configured** → Simulates (logs only)
5. **Semaphore API** delivers SMS to customer's phone
6. **Database updated** with notification result

### **Backend Logs:**

**Success:**
```
📱 Sending SMS to 09171234567...
✅ SMS sent successfully! Message ID: abc123xyz
```

**Failure:**
```
📱 Sending SMS to 09171234567...
❌ SMS Error: Insufficient credits
```

**Not Configured:**
```
⚠️  SMS service not configured (SEMAPHORE_API_KEY missing)
📱 SMS would be sent to 09171234567: "Hi Gregg!..."
```

---

## Testing Instructions

### **Test SMS Notification:**

1. **Customer Side:**
   - Log in as customer
   - Go to Account Settings
   - Set `isRecUpdate = 1` (SMS only) or `3` (Both)
   - Make sure `contact_no` is a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX)
   - Go to Cars page
   - Click "Notify me when available" on a rented/unavailable car

2. **Admin Side:**
   - Log in as admin
   - Go to Manage Cars
   - Change the car's status to "Available"
   - Click Save

3. **Check Backend Logs:**
   ```
   🚗 Car 7 status changed to "Available" - checking waitlist...
   🔔 Checking waitlist for car 7...
      📋 Found 1 customer(s) waiting for this car
   📬 Sending availability notification for Ford Granger to customer 10
      Notification preference: 1 (0=none, 1=SMS, 2=Email, 3=Both)
      → Sending SMS to 09171234567
      📱 Sending SMS to 09171234567...
      ✅ SMS sent successfully! Message ID: abc123xyz
   ```

4. **Check Customer Phone:**
   - Should receive SMS within 5-30 seconds
   - From: **JACarRental**
   - Message: "Hi [Name]! The [Car] is now available..."

---

## Error Handling

### **Possible Issues:**

1. **No SMS Received:**
   - Check if SEMAPHORE_API_KEY is valid
   - Verify phone number format (should be 09XXXXXXXXX or +639XXXXXXXXX)
   - Check Semaphore account credits
   - Check backend logs for error messages

2. **Invalid API Key:**
   ```
   ❌ SMS Error: Invalid API key
   ```
   Solution: Update `.env` with correct API key

3. **Insufficient Credits:**
   ```
   ❌ SMS Error: Insufficient credits
   ```
   Solution: Top up Semaphore account

4. **Invalid Phone Number:**
   ```
   ❌ SMS Error: Invalid number format
   ```
   Solution: Ensure phone number is Philippine mobile (+639XXXXXXXXX or 09XXXXXXXXX)

---

## Semaphore API Response Format

**Success Response:**
```json
[
  {
    "message_id": 123456789,
    "user_id": 98765,
    "user": "user@example.com",
    "account_id": 12345,
    "account": "Account Name",
    "recipient": "639171234567",
    "message": "Hi Gregg! The Ford Granger...",
    "sender_name": "JACarRental",
    "network": "Globe",
    "status": "Pending",
    "type": "Single",
    "source": "Api",
    "created_at": "2025-10-16 12:00:00",
    "updated_at": "2025-10-16 12:00:00"
  }
]
```

**Error Response:**
```json
{
  "message": "Invalid API key",
  "code": "INVALID_API_KEY"
}
```

---

## Phone Number Format

Semaphore accepts:
- ✅ `09171234567` (Philippine format)
- ✅ `+639171234567` (International format)
- ✅ `639171234567` (Without + prefix)

The notification service sends whatever format is stored in `Customer.contact_no`.

---

## Cost per SMS

Typical Semaphore pricing:
- **PHP 1.00** per SMS (standard message)
- Messages over 160 characters may be charged as multiple SMS

Current notification message length: ~100 characters ✅ (1 SMS)

---

## Monitoring

To check SMS delivery status:
1. Log in to Semaphore dashboard: https://semaphore.co/
2. Go to **Messages** → **Sent Messages**
3. View delivery status for each message

---

## Next Steps

1. ✅ SMS service activated and ready
2. ⏳ Test with real phone numbers
3. ⏳ Monitor Semaphore credits
4. ⏳ Consider adding SMS delivery tracking in database
5. ⏳ Add SMS templates for different scenarios

---

## Files Modified

- `backend/src/utils/notificationService.js`
  - Activated actual SMS sending via Semaphore API
  - Added error handling and response validation
  - Falls back to simulated mode if API key not configured
  - Uses sender name: **JACarRental**

---

## Status: ✅ SMS SERVICE ACTIVE

**To activate:** Restart backend server to load the updated code.

**To test:** 
1. Restart server: Type `rs` in backend terminal
2. Set customer `isRecUpdate` to 1 or 3
3. Join waitlist for a car
4. Change car status to "Available"
5. Check your phone for SMS! 📱
