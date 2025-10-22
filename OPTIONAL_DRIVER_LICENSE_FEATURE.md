# Optional Driver's License Feature

**Date:** October 23, 2025  
**Status:** ✅ Complete

## Overview
Modified the registration system to make driver's license optional during account creation. Customers can now register without a driver's license if they plan to book cars with drivers.

## Changes Made

### Frontend Changes (`frontend/src/pages/RegisterPage.jsx`)

#### 1. Added New Form Field
- **Field:** `hasDriverLicense` - Radio button selection ('yes' or 'no')
- **Question:** "DO YOU HAVE AN ACTIVE DRIVER'S LICENSE?"
- **Options:** 
  - "Yes, I have a license"
  - "No, I don't have a license"

#### 2. Conditional License Fields
All license-related fields are now only shown when user selects "Yes":
- **Driver's License Number** (text input)
- **Driver's License Expiry Date** (date input)
- **Restrictions** (text input, optional)
- **License Image Upload** (file upload button)

#### 3. Updated Validation Logic
```javascript
// Basic validation - license is now optional
if (!email || !username || !password || ... || !hasDriverLicense || !agreeTerms) {
  throw new Error('All required fields must be provided');
}

// Validate license fields only if user has a license
if (hasDriverLicense === 'yes') {
  if (!licenseNumber?.trim() || !licenseExpiry?.trim() || !licenseFile) {
    throw new Error('Please provide driver license number, expiry date, and image');
  }
}
```

#### 4. Conditional File Upload
- License image upload only executes if `hasDriverLicense === 'yes'`
- Skips Supabase storage upload when user doesn't have a license

#### 5. Updated Registration Data
```javascript
setPendingRegistrationData({
  // ... other fields
  hasDriverLicense: hasDriverLicense,
  licenseNumber: hasDriverLicense === 'yes' ? licenseNumber.trim() : null,
  licenseExpiry: hasDriverLicense === 'yes' ? licenseExpiry.trim() : null,
  restrictions: hasDriverLicense === 'yes' ? (restrictions?.trim() || '') : null,
  dl_img_url: dl_img_url, // null if no license
  agreeTerms: true,
});
```

### Backend Changes (`backend/src/controllers/authController.js`)

#### 1. Updated Request Body Parsing
```javascript
const {
  // ... existing fields
  hasDriverLicense,  // NEW FIELD
  licenseNumber: licenseNumberBody,
  licenseExpiry,
  restrictions,
  dl_img_url,
  agreeTerms,
} = req.body;
```

#### 2. Modified Validation Logic
```javascript
// Basic validation (license fields are optional)
if (!email || !username || !password || ... || !agreeTerms) {
  return res.status(400).json({ 
    ok: false, 
    message: 'Missing required fields'
  });
}

// If user has a license, validate license fields
if (hasDriverLicense === 'yes') {
  if (!licenseNumber || !licenseExpiry || !dl_img_url) {
    return res.status(400).json({
      ok: false,
      message: 'Driver license information is incomplete'
    });
  }
}
```

#### 3. Conditional License Record Creation
```javascript
// Only check license if user has one
if (licenseNumber) {
  const existingLicense = await prisma.driverLicense.findUnique({
    where: { driver_license_no: licenseNumber },
  });
  if (existingLicense) {
    return res.status(409).json({ 
      ok: false, 
      message: 'Driver license already registered' 
    });
  }
}

// Create driverLicense record only if user has a license
if (licenseNumber && licenseExpiry && dl_img_url) {
  await prisma.driverLicense.create({
    data: {
      driver_license_no: licenseNumber,
      expiry_date: new Date(licenseExpiry),
      restrictions: restrictions || 'None',
      dl_img_url: dl_img_url,
    },
  });
}
```

#### 4. Updated Customer Creation
```javascript
const customer = await prisma.customer.create({
  data: {
    // ... other fields
    driver_license_no: licenseNumber || null, // NULL if no license
    // ... remaining fields
  },
});
```

## Database Schema
The `Customer` table already supports NULL values for the `driver_license_no` column:
```sql
driver_license_no VARCHAR(255) NULL
```

## User Flow

### Scenario 1: User Has a License
1. User selects "Yes, I have a license"
2. License fields appear (number, expiry, restrictions, image upload)
3. User fills in license information and uploads image
4. Backend validates all license fields
5. Creates DriverLicense record in database
6. Creates Customer record with license_no reference

### Scenario 2: User Doesn't Have a License
1. User selects "No, I don't have a license"
2. License fields are hidden
3. User completes remaining required fields
4. Backend skips license validation
5. Skips DriverLicense record creation
6. Creates Customer record with NULL license_no

## Benefits
1. ✅ **Inclusive Registration:** Customers without licenses can now register
2. ✅ **Better UX:** Clear question with radio buttons
3. ✅ **Prevents Errors:** Disabled fields prevent accidental input
4. ✅ **Flexible Business Model:** Supports both self-drive and driver-based rentals
5. ✅ **Database Compatible:** Uses existing NULL-capable column

## Testing Checklist
- [ ] Register with license (full flow)
- [ ] Register without license (simplified flow)
- [ ] Verify license validation only when "Yes" is selected
- [ ] Verify fields are hidden when "No" is selected
- [ ] Verify backend accepts NULL license values
- [ ] Verify database records created correctly in both scenarios
- [ ] Verify login works for both types of accounts
- [ ] Verify booking flow works for customers without licenses (with driver option)

## UI/UX Notes
- Radio buttons styled consistently with existing form elements
- License fields use conditional rendering (`{formData.hasDriverLicense === 'yes' && ...}`)
- Clear labels: "Yes, I have a license" vs "No, I don't have a license"
- Upload button and fields naturally hide/show based on selection
- No confusing disabled states - fields simply don't render

## Future Enhancements
- [ ] Add ability to add license later in customer profile
- [ ] Restrict self-drive bookings for customers without licenses
- [ ] Show driver-with-car options prominently for non-licensed customers
- [ ] Add license expiry reminders for customers with licenses
