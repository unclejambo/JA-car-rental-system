-- AlterTable: Add notification tracking fields to Waitlist table
-- This migration adds fields to track notification attempts and results

-- Add notification_method column (nullable string to track SMS/Email/Both)
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "notification_method" TEXT;

-- Add notification_success column (nullable boolean to track if notification was sent successfully)
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "notification_success" BOOLEAN DEFAULT false;

-- Add created_at column (nullable timestamp with default to now for new records)
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set created_at to date_created if available
UPDATE "Waitlist" 
SET "created_at" = "date_created" 
WHERE "created_at" IS NULL AND "date_created" IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "Waitlist"."notification_method" IS 'Method used to notify customer: SMS, Email, Both, or None';
COMMENT ON COLUMN "Waitlist"."notification_success" IS 'Whether the notification was successfully sent';
COMMENT ON COLUMN "Waitlist"."created_at" IS 'Timestamp when the waitlist entry was created';
