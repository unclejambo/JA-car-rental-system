# Safe Manual Database Update for Payment Integration

## 🛡️ SAFE APPROACH: Manual SQL Execution (Recommended)

Since you want to avoid any risk to existing data, execute these SQL commands directly in your Supabase SQL Editor:

### Step 1: Add Payment Fields to Waitlist Table
```sql
-- Add payment status field (safe - only adds new column)
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "payment_status" TEXT DEFAULT 'unpaid';

-- Add paid date field (safe - only adds new column)
ALTER TABLE "Waitlist" ADD COLUMN IF NOT EXISTS "paid_date" TIMESTAMP(3);

-- Create performance index (safe - doesn't affect data)
CREATE INDEX IF NOT EXISTS "Waitlist_payment_status_idx" ON "Waitlist"("payment_status");
```

### Step 2: Update Payment Table for Waitlist Support
```sql
-- Make booking_id optional (safe - allows NULL values)
ALTER TABLE "Payment" ALTER COLUMN "booking_id" DROP NOT NULL;

-- Add waitlist_id field (safe - only adds new column)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "waitlist_id" INTEGER;

-- Add foreign key constraint (safe - just adds relationship)
ALTER TABLE "Payment" ADD CONSTRAINT IF NOT EXISTS "Payment_waitlist_id_fkey" 
FOREIGN KEY ("waitlist_id") REFERENCES "Waitlist"("waitlist_id") 
ON DELETE SET NULL ON UPDATE CASCADE;
```

### Step 3: Verify Changes
```sql
-- Check Waitlist table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Waitlist' 
ORDER BY ordinal_position;

-- Check Payment table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Payment' 
ORDER BY ordinal_position;
```

## 🔄 Alternative: Prisma Migrate Approach

If you prefer to use Prisma migrations (after manual verification):

```bash
cd backend

# This will apply our pre-created migration
npx prisma migrate deploy

# Generate updated Prisma client
npx prisma generate
```

## ✅ What These Changes Do

### Safe Additions Only:
1. **Waitlist.payment_status** - Tracks if waitlist entry is paid
2. **Waitlist.paid_date** - Records when payment was made  
3. **Payment.waitlist_id** - Links payments to waitlist entries
4. **Payment.booking_id** - Made optional to support waitlist payments

### No Data Loss:
- ✅ All existing bookings remain intact
- ✅ All existing payments remain intact
- ✅ All existing waitlist entries get default `payment_status: 'unpaid'`
- ✅ No columns are dropped or modified destructively

## 🧪 Test After Changes

Once applied, test with a simple query:
```sql
-- Should show all waitlist entries with new payment fields
SELECT waitlist_id, customer_id, car_id, payment_status, paid_date 
FROM "Waitlist" 
LIMIT 5;
```

## Next Steps

1. **Execute SQL manually in Supabase** (safest approach)
2. **Run `npx prisma generate`** (to update Prisma client)
3. **Test the payment-based date blocking**
4. **Verify everything works as expected**

This approach ensures zero data loss while adding the payment integration functionality!