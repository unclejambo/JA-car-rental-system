-- Add payment integration fields to existing Waitlist table
ALTER TABLE "Waitlist" ADD COLUMN "payment_status" TEXT DEFAULT 'unpaid';
ALTER TABLE "Waitlist" ADD COLUMN "paid_date" TIMESTAMP(3);

-- Create index for payment status queries
CREATE INDEX "Waitlist_payment_status_idx" ON "Waitlist"("payment_status");

-- Update Payment table to support waitlist payments
ALTER TABLE "Payment" ALTER COLUMN "booking_id" DROP NOT NULL;
ALTER TABLE "Payment" ADD COLUMN "waitlist_id" INTEGER;

-- Add foreign key constraint for waitlist payments
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_waitlist_id_fkey" FOREIGN KEY ("waitlist_id") REFERENCES "Waitlist"("waitlist_id") ON DELETE SET NULL ON UPDATE CASCADE;