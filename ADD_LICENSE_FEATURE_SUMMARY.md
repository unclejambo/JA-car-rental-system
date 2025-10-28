# Add Driver's License Feature for Customers

**Date:** October 28, 2025  
**Status:** ✅ Complete

## Overview
Added a new feature that allows customers who registered without a driver's license to add their license information via the Customer Settings page. All license fields are required when adding a new license.

## Problem Statement
Previously, customers could register without a driver's license (with `driver_license_id` set to `null`). However, there was no way for these customers to add their license information after registration. This feature addresses that gap by allowing customers to add their driver's license through the settings page.

## Changes Made

### Backend Changes

#### 1. Driver License Controller (`backend/src/controllers/driverLicenseController.js`)
Added a new endpoint to create a driver's license for customers who don't have one:

**New Function:** `createDriverLicenseForCustomer`
- **Route:** `POST /driver-license/customer/:customerId`
- **Access:** Authenticated customers
- **Validations:**
  - Validates customer ID
  - Ensures all required fields are present (license number, expiry date, license image)
  - Checks if customer exists
  - Verifies customer doesn't already have a license
  - Validates license number is unique in the system
  - Validates expiry date is in the future
- **Process:**
  1. Creates new `DriverLicense` record with provided data
  2. Updates `Customer` record with the new `driver_license_id`
  3. Returns success response with signed URL for the license image

**Code Example:**
```javascript
export const createDriverLicenseForCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const { driver_license_no, restrictions, expiry_date, dl_img_url } = req.body;
    
    // Validation checks...
    
    // Create the driver license record
    const newLicense = await prisma.driverLicense.create({
      data: {
        driver_license_no: driver_license_no.trim(),
        restrictions: restrictions?.trim() || null,
        expiry_date: expiryDate,
        dl_img_url: dl_img_url.trim()
      }
    });

    // Update customer with the new license_id
    await prisma.customer.update({
      where: { customer_id: customerId },
      data: { driver_license_id: newLicense.license_id }
    });

    res.status(201).json({
      success: true,
      message: "Driver's license added successfully",
      license: { ...newLicense }
    });
  } catch (error) {
    // Error handling...
  }
};
```

#### 2. Driver License Routes (`backend/src/routes/driverLicenseRoutes.js`)
Added new route for creating customer licenses:

```javascript
// POST /driver-license/customer/:customerId - Create license for customer
router.post("/customer/:customerId", createDriverLicenseForCustomer);
```

### Frontend Changes

#### 1. License Store (`frontend/src/store/license.js`)
Added function to create a license for a customer:

```javascript
export const createLicenseForCustomer = async (customerId, data) => {
  const url = `${getLicenseUrl()}/customer/${customerId}`;
  const response = await axios.post(url, data);
  return response.data;
};
```

#### 2. Customer Settings Component (`frontend/src/pages/customer/CustomerSettings.jsx`)

**New State Variables:**
```javascript
const [hasNoLicense, setHasNoLicense] = useState(false);
```

**Updated `useEffect` to detect if customer has no license:**
```javascript
const hasLicense = customer.driver_license_id !== null && customer.driver_license !== null;
setHasNoLicense(!hasLicense);
```

**Modified `handleLicenseSaveConfirm` function:**
- Now handles both adding new licenses and updating existing ones
- Validates all required fields (License Number, Expiry Date, License Image)
- Shows different success messages based on action (add vs update)
- Updates `hasNoLicense` state after successful license addition

**Updated License Tab UI:**
- Shows empty state with "Add Driver's License" button when customer has no license
- Displays badge icon and informative message about needing a license for self-drive bookings
- All fields marked as required when adding a new license (License No *, Expiration Date *, Upload Image *)
- Button text changes from "Add License" to "Save Changes" based on context
- Conditional rendering: shows different UI for adding vs editing license

**Enhanced Confirmation Modal:**
- Different title and message for adding vs updating license
- Shows proper "from" and "to" values for new licenses
- Displays "None" → "New Value" for adding licenses
- Shows actual changes for updating existing licenses

## UI Flow

### For Customers Without a License:
1. Customer navigates to Settings → License tab
2. Sees empty state with:
   - Badge icon
   - "No Driver's License on Record" message
   - Information about self-drive bookings
   - "Add Driver's License" button
3. Clicks "Add Driver's License"
4. Form appears with required fields:
   - License No * (with format validation)
   - Restrictions (optional)
   - Expiration Date *
   - Upload Image * button
5. Customer fills all required fields
6. Clicks "Add License" button
7. Confirmation modal shows all new values
8. Upon confirmation:
   - License image uploads to Supabase
   - New license record created in database
   - Customer record updated with license_id
   - Success message displayed
   - UI switches to "edit license" view

### For Customers With a License:
1. Customer sees their existing license information
2. Can click Edit button to modify license details
3. Same validation applies as adding a license
4. Confirmation modal shows changed fields only
5. Updates are saved to existing license record

## Validation Rules

### Required Fields (when adding or updating):
- ✅ **License Number**: Must match Philippine license format (NXX-YY-ZZZZZZ)
- ✅ **Expiration Date**: Must be a future date
- ✅ **License Image**: Must be uploaded (JPG, PNG, or WEBP, max 5MB)

### Optional Fields:
- Restrictions: Can be empty or contain restriction codes

### Backend Validations:
- License number must be unique across the system
- Customer must not already have a license (for creation)
- Customer must exist in the database
- Expiry date must be in the future
- All required fields must be present

### Frontend Validations:
- License number format validation with real-time formatting
- Image file type and size validation
- Required field checks before submission
- Clear error messages for validation failures

## Database Schema

The existing schema already supports this feature:

```prisma
model Customer {
  customer_id       Int            @id @default(autoincrement())
  // ... other fields ...
  driver_license_id Int?           // Nullable - can be null on registration
  driver_license    DriverLicense? @relation("CustomerDriverLicense", fields: [driver_license_id], references: [license_id])
}

model DriverLicense {
  driver_license_no String     @unique
  expiry_date       DateTime?  @db.Timestamptz(6)
  restrictions      String?
  dl_img_url        String?
  license_id        Int        @id @default(autoincrement())
  customers         Customer[] @relation("CustomerDriverLicense")
  drivers           Driver[]
}
```

## Security Considerations

1. **Authentication**: All endpoints require user authentication via JWT token
2. **Authorization**: Customers can only add/update their own license
3. **Validation**: Server-side validation prevents invalid or malicious data
4. **File Upload**: License images validated for type and size
5. **Unique Constraints**: Prevents duplicate license numbers in the system

## Error Handling

### Backend Error Responses:
- `400 Bad Request`: Missing or invalid required fields
- `404 Not Found`: Customer not found
- `409 Conflict`: License number already exists or customer already has a license
- `500 Internal Server Error`: Database or server errors

### Frontend Error Handling:
- Displays user-friendly error messages via Snackbar
- Validates input before API calls
- Handles upload failures gracefully
- Prevents duplicate submissions with loading states

## Testing Checklist

- ✅ Customer without license can see "Add License" button
- ✅ Customer with license sees their license details
- ✅ All required fields validated (License No, Expiry Date, Image)
- ✅ License number format validation works
- ✅ Expiry date must be in future
- ✅ Image upload works correctly
- ✅ Duplicate license numbers rejected
- ✅ Confirmation modal shows correct information
- ✅ Success messages displayed after add/update
- ✅ Customer can edit license after adding it
- ✅ UI updates immediately after successful addition
- ✅ Cancel button works properly

## Benefits

1. **Complete User Journey**: Customers can now complete their profile after registration
2. **Self-Service**: No need for admin intervention to add license
3. **Self-Drive Bookings**: Enables customers to book cars without drivers
4. **Data Integrity**: All required validations ensure clean, valid data
5. **User Experience**: Clear UI with helpful messages and validation feedback
6. **Flexibility**: Supports both registration with and without license

## Future Enhancements

Potential improvements for future iterations:
- Email notification when license is about to expire
- OCR to automatically extract license details from image
- License verification integration with government databases
- Multi-image support (front and back of license)
- Automatic license expiry date validation against image
- License renewal reminders

## Files Modified

### Backend:
1. `backend/src/controllers/driverLicenseController.js` - Added `createDriverLicenseForCustomer` function
2. `backend/src/routes/driverLicenseRoutes.js` - Added POST route for creating licenses

### Frontend:
1. `frontend/src/store/license.js` - Added `createLicenseForCustomer` function
2. `frontend/src/pages/customer/CustomerSettings.jsx` - Major updates to handle add/edit license functionality

## API Endpoints

### Create Driver License for Customer
```
POST /api/driver-license/customer/:customerId
Authorization: Bearer <token>

Request Body:
{
  "driver_license_no": "N01-23-456789",
  "restrictions": "1, 2",
  "expiry_date": "2030-12-31",
  "dl_img_url": "https://storage.url/license.jpg"
}

Response (201 Created):
{
  "success": true,
  "message": "Driver's license added successfully",
  "license": {
    "license_id": 123,
    "driver_license_no": "N01-23-456789",
    "restrictions": "1, 2",
    "expiry_date": "2030-12-31T00:00:00.000Z",
    "dl_img_url": "https://signed.url/license.jpg"
  }
}

Error Response (400):
{
  "success": false,
  "error": "License number, expiry date, and license image are required"
}

Error Response (409):
{
  "success": false,
  "error": "This license number is already registered in the system"
}
```

### Update Driver License (existing endpoint)
```
PUT /api/driver-license/:licenseId
Authorization: Bearer <token>

Request Body:
{
  "driver_license_no": "N01-23-456789",
  "restrictions": "1, 2, 3",
  "expiry_date": "2031-12-31",
  "dl_img_url": "https://storage.url/new-license.jpg"
}
```

## Conclusion

This feature successfully enables customers who registered without a driver's license to add their license information through the Customer Settings page. All license details are properly validated to ensure data integrity, and the user experience is intuitive with clear feedback and helpful messages.
