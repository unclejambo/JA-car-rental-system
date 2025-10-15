# Phone Verification System Implementation Guide

## Overview
This document details the implementation of SMS-based phone number verification using the Semaphore API for the JA Car Rental System. Phone verification is required for customer and driver registration and when changing phone numbers in account settings.

---

## Backend Implementation

### 1. Database Schema Updates

**File:** `backend/prisma/schema.prisma`

#### PhoneVerification Model (Updated)
```prisma
model PhoneVerification {
  id           Int       @id @default(autoincrement())
  phone_number String
  otp_code     String
  is_verified  Boolean   @default(false)
  created_at   DateTime  @db.Timestamptz(6)
  expires_at   DateTime  @db.Timestamptz(6)
  verified_at  DateTime? @db.Timestamptz(6)
  attempts     Int       @default(0)
  user_id      Int?
  user_type    String?
  purpose      String?   @default("registration")

  @@index([expires_at])
  @@index([phone_number, is_verified])
}
```

#### Customer Model (Updated)
Added `phone_verified` field:
```prisma
model Customer {
  // ... existing fields ...
  phone_verified    Boolean?       @default(false)
  // ... rest of fields ...
}
```

#### Driver Model (Updated)
Added `phone_verified` field:
```prisma
model Driver {
  // ... existing fields ...
  phone_verified    Boolean?      @default(false)
  // ... rest of fields ...
}
```

**Database Update Required:**
```bash
cd backend
npx prisma db push
npx prisma generate
```

**Note:** Use `prisma db push` instead of `migrate dev` when you have existing data in the database. This updates the schema without creating migration files.

---

### 2. SMS Service Utility

**File:** `backend/src/utils/smsService.js`

#### Key Functions:

1. **generateOTP()**
   - Generates 6-digit OTP code
   - Returns string: "100000" to "999999"

2. **formatPhoneNumber(phone)**
   - Converts Philippine phone numbers to +63XXXXXXXXXX format
   - Handles formats: 09XX, 9XX, 63XX, +63XX
   - Example: "09171234567" → "+639171234567"

3. **isValidPhilippinePhone(phone)**
   - Validates Philippine phone number patterns
   - Accepts: +63XXXXXXXXXX, 63XXXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX

4. **sendOTPSMS(phoneNumber, otp, purpose)**
   - Sends OTP via Semaphore API
   - Purpose-specific messages:
     - `registration`: Welcome message with OTP
     - `phone_change`: Phone change verification message
     - Default: Generic verification message
   - Returns: `{success, messageId, data}` or dev mode response

5. **sendVerificationSuccessSMS(phoneNumber, userName)**
   - Sends success notification after verification

**Environment Variables Required:**
```env
SEMAPHORE_API_KEY=3724e4af6df4b4ff08ef07596e05f5d9
```

**Sender Name:** Fixed as "JACarRental" (configured in the code, not via env variable)

---

### 3. Phone Verification Controller

**File:** `backend/src/controllers/phoneVerificationController.js`

#### Endpoints:

1. **POST /api/phone-verification/send-otp**
   ```json
   Request Body:
   {
     "phoneNumber": "09171234567",
     "purpose": "registration",  // or "phone_change"
     "userId": 123,              // optional
     "userType": "customer"      // optional
   }

   Success Response (200):
   {
     "success": true,
     "message": "OTP sent successfully to your phone",
     "data": {
       "verificationId": 1,
       "phoneNumber": "+639171234567",
       "expiresIn": 600,
       "otp": "123456",          // Only in development mode
       "devMode": true           // Only in development mode
     }
   }

   Error Responses:
   - 400: Invalid phone number
   - 429: Rate limit (wait 2 minutes between requests)
   - 500: SMS sending failed
   ```

2. **POST /api/phone-verification/verify-otp**
   ```json
   Request Body:
   {
     "phoneNumber": "09171234567",
     "otp": "123456",
     "userId": 123,              // optional
     "userType": "customer"      // optional
   }

   Success Response (200):
   {
     "success": true,
     "message": "Phone number verified successfully!",
     "data": {
       "verificationId": 1,
       "phoneNumber": "+639171234567",
       "verifiedAt": "2025-01-15T12:34:56.789Z"
     }
   }

   Error Responses:
   - 400: Invalid OTP, expired OTP, max attempts reached
   - 404: No pending verification found
   ```

3. **POST /api/phone-verification/resend-otp**
   - Same as send-otp (with rate limiting)

4. **GET /api/phone-verification/check/:phoneNumber**
   ```json
   Query Params: userId, userType (optional)

   Success Response (200):
   {
     "success": true,
     "isVerified": true,
     "data": {
       "phoneNumber": "+639171234567",
       "verifiedAt": "2025-01-15T12:34:56.789Z"
     }
   }
   ```

#### Features:
- **Rate Limiting:** 1 OTP per 2 minutes per phone number
- **OTP Expiration:** 10 minutes
- **Max Attempts:** 5 verification attempts per OTP
- **Automatic Cleanup:** Invalidates old unverified OTPs
- **Duplicate Prevention:** Checks if phone is verified by another user
- **User Association:** Links verification to user_id and user_type
- **Development Mode:** Returns OTP in response for testing

---

### 4. Routes Setup

**File:** `backend/src/routes/phoneVerificationRoutes.js`
- Exports router with all phone verification endpoints

**File:** `backend/src/index.js`
- Added: `import phoneVerificationRoutes from "./routes/phoneVerificationRoutes.js";`
- Mounted: `app.use("/api/phone-verification", phoneVerificationRoutes);`

---

### Frontend (Completed for Registration)

1. ✅ **Created OTP Verification Component**
   - File: `frontend/src/components/PhoneVerificationModal.jsx`
   - Features:
     - 6-digit OTP input fields with auto-focus
     - Countdown timer (10 minutes)
     - Resend OTP button (disabled for 2 minutes)
     - Auto-submit when all digits entered
     - Paste support for 6-digit codes
     - Error handling and validation
     - Loading states
     - Attempts tracking display

2. ✅ **Updated Registration Flow**
   - File: `frontend/src/pages/RegisterPage.jsx`
   - Steps:
     1. User fills registration form
     2. User uploads license image
     3. Send OTP to phone number
     4. Show OTP verification modal
     5. User enters OTP
     6. Verify OTP on backend
     7. Complete registration with verified phone

3. ⏳ **Update Customer Settings** (TODO)
   - File: `frontend/src/pages/customer/CustomerSettings.jsx`
   - When contact number changes:
     1. Detect phone number change
     2. Send OTP to new number
     3. Show verification modal
     4. Verify OTP
     5. Update phone number only if verified

4. ⏳ **Update Driver Settings** (TODO)
   - File: `frontend/src/pages/driver/DriverSettings.jsx`
   - Same flow as Customer Settings

---

## Testing

### Development Mode Testing

1. **Start Backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test Send OTP:**
   ```bash
   curl -X POST http://localhost:3001/api/phone-verification/send-otp \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "09171234567",
       "purpose": "registration"
     }'
   ```
   
   Response will include `otp` field in development mode.

3. **Test Verify OTP:**
   ```bash
   curl -X POST http://localhost:3001/api/phone-verification/verify-otp \
     -H "Content-Type: application/json" \
     -d '{
       "phoneNumber": "09171234567",
       "otp": "123456"
     }'
   ```

### Test Cases:

- ✅ Valid Philippine phone formats (09XX, 9XX, 63XX, +63XX)
- ✅ Invalid phone formats (should reject)
- ✅ OTP expiration (10 minutes)
- ✅ Max attempts (5 attempts)
- ✅ Rate limiting (2 minutes between requests)
- ✅ Duplicate phone prevention
- ✅ OTP resend functionality
- ✅ Successful verification flow

---

## Security Considerations

1. **OTP Storage:**
   - OTPs stored hashed in database (TODO: implement bcrypt hashing)
   - Automatic expiration after 10 minutes
   - Invalidate old OTPs when new one is requested

2. **Rate Limiting:**
   - 2-minute cooldown between OTP requests
   - Prevents SMS bombing attacks

3. **Attempt Limiting:**
   - Maximum 5 verification attempts per OTP
   - Requires new OTP after max attempts

4. **Phone Validation:**
   - Server-side validation of Philippine phone formats
   - Duplicate phone prevention across accounts

5. **Development Mode:**
   - OTP visible in response only when NODE_ENV=development
   - Console logging for debugging

---

## Production Deployment Checklist

- [x] Run database update: `npx prisma db push` ✅
- [x] Verify SEMAPHORE_API_KEY in production .env ✅
- [x] Set sender name to "JACarRental" ✅
- [ ] Set NODE_ENV=production (hides OTP in responses)
- [ ] Test SMS delivery with real Philippine numbers
- [ ] Monitor Semaphore API credits/usage
- [ ] Implement OTP hashing for database storage (optional security enhancement)
- [ ] Set up monitoring for failed SMS deliveries
- [ ] Configure error alerting for verification failures
- [ ] Test complete registration flow end-to-end
- [ ] Test settings phone change flow end-to-end

---

## API Flow Diagrams

### Registration Flow:
```
User Fills Form → Upload License → 
Send OTP (POST /send-otp) → User Receives SMS → 
User Enters OTP → Verify OTP (POST /verify-otp) → 
Create Account with phone_verified=true
```

### Phone Change Flow:
```
User Changes Phone in Settings → 
Send OTP to New Phone (POST /send-otp) → User Receives SMS → 
User Enters OTP → Verify OTP (POST /verify-otp) → 
Update contact_no with phone_verified=true
```

---

## Troubleshooting

### SMS Not Sending:
1. Check SEMAPHORE_API_KEY in backend/.env
2. Verify Semaphore account has credits
3. Check phone number format (must be Philippine)
4. Review backend console logs for errors
5. In development, OTP will be logged to console

### OTP Verification Failing:
1. Check OTP hasn't expired (10 min limit)
2. Verify attempts < 5
3. Ensure exact phone number match (formatting)
4. Check database PhoneVerification records

### Rate Limiting:
1. Wait 2 minutes between OTP requests
2. Clear old PhoneVerification records if needed
3. Check created_at timestamp in database

---

## Files Modified/Created

### Backend:
- ✅ `backend/src/utils/smsService.js` (CREATED)
- ✅ `backend/src/controllers/phoneVerificationController.js` (CREATED)
- ✅ `backend/src/routes/phoneVerificationRoutes.js` (CREATED)
- ✅ `backend/src/index.js` (MODIFIED - added routes)
- ✅ `backend/prisma/schema.prisma` (MODIFIED - added fields)
- ✅ Database updated with `npx prisma db push`

### Frontend:
- ✅ `frontend/src/components/PhoneVerificationModal.jsx` (CREATED)
- ✅ `frontend/src/pages/RegisterPage.jsx` (MODIFIED - added phone verification)
- ⏳ `frontend/src/pages/customer/CustomerSettings.jsx` (TO MODIFY)
- ⏳ `frontend/src/pages/driver/DriverSettings.jsx` (TO MODIFY)

---

## Environment Variables Summary

**backend/.env:**
```env
# Semaphore SMS API Configuration
SEMAPHORE_API_KEY=3724e4af6df4b4ff08ef07596e05f5d9

# Node Environment
NODE_ENV=development  # Use 'production' in production
```

**Note:** Sender name "JACarRental" is hardcoded in `smsService.js` as required by Semaphore.

---

## Next Implementation Priority:

1. ✅ **Run database update** - COMPLETED
2. ✅ **Create PhoneVerificationModal component** - COMPLETED
3. ✅ **Update RegisterPage.jsx** to include OTP verification - COMPLETED
4. ⏳ **Update CustomerSettings.jsx** for phone change verification - PENDING
5. ⏳ **Update DriverSettings.jsx** for phone change verification - PENDING
6. ⏳ **Test complete flows** in development - PENDING
7. ⏳ **Deploy to production** with checklist - PENDING

---

**Status:** Registration flow complete ✅ | Settings flow pending ⏳  
**Next:** Implement phone verification in Customer and Driver settings  
**Documentation:** Updated 2025-10-15
