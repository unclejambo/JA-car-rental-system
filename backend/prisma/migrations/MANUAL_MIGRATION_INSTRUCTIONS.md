# Manual Migration Instructions

## IMPORTANT: Run this migration in Supabase SQL Editor

This migration refactors the `DriverLicense` table to use a proper integer primary key instead of using the license number as the primary key. This allows license numbers to be edited.

### Steps to Execute:

1. Go to your Supabase Dashboard
2. Navigate to: **SQL Editor** → **New Query**
3. Copy and paste the SQL from `manual_refactor_driver_license_pk.sql`
4. Click **Run** to execute the migration
5. After successful execution, run: `npx prisma db pull` and `npx prisma generate` in the backend folder

### What This Migration Does:

- ✅ Adds `license_id` as new auto-incrementing primary key
- ✅ Changes `driver_license_no` from primary key to unique field (now editable!)
- ✅ Updates `Customer` table to use `driver_license_id` instead of `driver_license_no`
- ✅ Updates `Driver` table to use `driver_license_id` instead of `driver_license_no`
- ✅ Preserves ALL existing data and relationships
- ✅ Maintains referential integrity with proper foreign keys

### After Migration:

You can now edit license numbers in the UI without errors! The system will use the internal `license_id` to track records.
