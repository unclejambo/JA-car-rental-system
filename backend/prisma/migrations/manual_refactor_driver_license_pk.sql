-- Manual migration to refactor DriverLicense table
-- This migration adds a proper integer primary key and preserves all existing data

-- Step 1: Add the new license_id column to DriverLicense table
ALTER TABLE "DriverLicense" ADD COLUMN "license_id" SERIAL;

-- Step 2: Add new driver_license_id columns to Customer and Driver tables
ALTER TABLE "Customer" ADD COLUMN "driver_license_id" INTEGER;
ALTER TABLE "Driver" ADD COLUMN "driver_license_id" INTEGER;

-- Step 3: Populate the new foreign key columns with matching license_id values
-- For Customer table
UPDATE "Customer" c
SET "driver_license_id" = dl."license_id"
FROM "DriverLicense" dl
WHERE c."driver_license_no" = dl."driver_license_no";

-- For Driver table
UPDATE "Driver" d
SET "driver_license_id" = dl."license_id"
FROM "DriverLicense" dl
WHERE d."driver_license_no" = dl."driver_license_no";

-- Step 4: Drop the old foreign key constraints
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_driver_license_no_fkey";
ALTER TABLE "Driver" DROP CONSTRAINT IF EXISTS "Driver_driver_license_no_fkey";

-- Step 5: Drop the old primary key constraint on DriverLicense
ALTER TABLE "DriverLicense" DROP CONSTRAINT "DriverLicense_pkey";

-- Step 6: Set the new license_id as the primary key
ALTER TABLE "DriverLicense" ADD PRIMARY KEY ("license_id");

-- Step 7: Make driver_license_no unique instead of primary key
ALTER TABLE "DriverLicense" ADD CONSTRAINT "DriverLicense_driver_license_no_key" UNIQUE ("driver_license_no");

-- Step 8: Create new foreign key constraints
ALTER TABLE "Customer" 
  ADD CONSTRAINT "Customer_driver_license_id_fkey" 
  FOREIGN KEY ("driver_license_id") 
  REFERENCES "DriverLicense"("license_id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

ALTER TABLE "Driver" 
  ADD CONSTRAINT "Driver_driver_license_id_fkey" 
  FOREIGN KEY ("driver_license_id") 
  REFERENCES "DriverLicense"("license_id") 
  ON DELETE RESTRICT 
  ON UPDATE CASCADE;

-- Step 9: Make driver_license_id NOT NULL for Driver table (required field)
ALTER TABLE "Driver" ALTER COLUMN "driver_license_id" SET NOT NULL;

-- Step 10: Drop the old driver_license_no columns from Customer and Driver
ALTER TABLE "Customer" DROP COLUMN "driver_license_no";
ALTER TABLE "Driver" DROP COLUMN "driver_license_no";

-- Migration complete!
-- The DriverLicense table now uses license_id as primary key
-- driver_license_no is now a unique field that can be edited
