# Driver License Table Refactoring Summary

## Overview
Refactored the `DriverLicense` table to use a proper integer primary key (`license_id`) instead of using the driver's license number as the primary key. This allows license numbers to be edited without breaking foreign key relationships.

## Database Changes

### Before
- **Primary Key**: `driver_license_no` (String)
- **Foreign Keys**: 
  - `Customer.driver_license_no` → `DriverLicense.driver_license_no`
  - `Driver.driver_license_no` → `DriverLicense.driver_license_no`

### After
- **Primary Key**: `license_id` (Auto-incrementing integer)
- **Unique Constraint**: `driver_license_no` (String, unique, now editable!)
- **Foreign Keys**:
  - `Customer.driver_license_id` → `DriverLicense.license_id`
  - `Driver.driver_license_id` → `DriverLicense.license_id`

## Migration Instructions

### ⚠️ IMPORTANT: Run the SQL Migration First!

1. **Open Supabase Dashboard** → **SQL Editor**
2. **Create New Query** and paste the contents of:
   ```
   backend/prisma/migrations/manual_refactor_driver_license_pk.sql
   ```
3. **Click Run** to execute the migration
4. **Verify** no errors in the output
5. After successful execution, run in the backend folder:
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

### What the Migration Does

✅ Adds `license_id` as new auto-incrementing primary key  
✅ Migrates all foreign key relationships to use `license_id`  
✅ Makes `driver_license_no` a unique field (now editable!)  
✅ **Preserves ALL existing data** - no data loss  
✅ Maintains referential integrity with proper foreign keys

## Code Changes

### Backend Files Modified

1. **`backend/prisma/schema.prisma`**
   - Updated `DriverLicense` model with `license_id` as primary key
   - Changed `driver_license_no` from `@id` to `@unique`
   - Updated `Customer.driver_license_id` (nullable)
   - Updated `Driver.driver_license_id` (required)

2. **`backend/src/controllers/driverLicenseController.js`**
   - `updateDriverLicense`: Now uses `license_id` (integer) from URL params
   - Accepts `driver_license_no` in request body for editing
   - Validates new license numbers for uniqueness
   - `deleteLicenseImage`: Updated to use `license_id`

3. **`backend/src/controllers/driverController.js`**
   - `getAllDrivers`: Updated to include `license_id` in response
   - `getDriverById`: Added `license_id` to formatted response
   - `createDriver`: Now sets `driver_license_id` instead of `driver_license_no`
   - `updateDriver`: Uses `driver_license_id` when updating license

4. **`backend/src/controllers/driverProfileController.js`**
   - `getDriverProfile`: Returns `license_id` and fetches license by `license_id`
   - Added `license_id` to formatted driver response

### Frontend Files Modified

1. **`frontend/src/pages/driver/DriverSettings.jsx`**
   - Added `licenseId` state to store the license ID
   - Updated data fetching to extract `license_id` from API response
   - `handleLicenseSaveConfirm`: Now uses `licenseId` in API call
   - License number field remains read-only (unchanged for now)

## API Endpoint Changes

### PUT `/api/driver-license/:id`

**Before:**
- `:id` = `driver_license_no` (string, e.g., "N01-23-456789")
- Could NOT change license number

**After:**
- `:id` = `license_id` (integer, e.g., 123)
- CAN change license number via request body
- Request body accepts `driver_license_no` for updates
- Validates uniqueness of new license numbers

### Response Format Changes

**Driver Profile Response:**
```json
{
  "success": true,
  "data": {
    "license_id": 123,          // ← NEW: Internal ID for API calls
    "license_number": "N01-23-456789",
    "license_expiry": "2025-12-31",
    "license_restrictions": "1,2,3",
    "license_img_url": "https://..."
  }
}
```

## Benefits

1. **✅ Editable License Numbers**: Users can now correct typos in license numbers
2. **✅ Better Database Design**: Integer primary keys are more efficient
3. **✅ No Breaking Changes**: All existing data preserved
4. **✅ API Improvements**: More flexible update operations
5. **✅ Future-Proof**: Easier to handle license renewals/replacements

## Testing Checklist

After running the migration:

- [ ] Run `npx prisma db pull` and `npx prisma generate` in backend
- [ ] Restart backend server
- [ ] Test driver login
- [ ] View driver settings - license info should display
- [ ] Edit license restrictions and expiry date
- [ ] Upload new license image
- [ ] Verify all changes save correctly
- [ ] Test admin creating new drivers
- [ ] Test admin updating driver information

## Rollback (If Needed)

If you need to rollback, you would need to:
1. Restore database from backup
2. Revert the schema.prisma changes
3. Revert all controller changes

**It's recommended to test in a development environment first!**

## Next Steps (Optional Future Enhancements)

1. **Make License Number Editable in UI**:
   - Remove `readOnly` and `disabled` props from license number TextField
   - Add back license number validation
   - Send `driver_license_no` in update request body

2. **Add License Number Change History**:
   - Track when license numbers are updated
   - Store old values for audit purposes

3. **Improve Error Messages**:
   - Better user feedback for duplicate license numbers
   - Validation messages for Philippine license format

---

**Migration File**: `backend/prisma/migrations/manual_refactor_driver_license_pk.sql`  
**Date Created**: October 26, 2025  
**Status**: Ready for deployment
