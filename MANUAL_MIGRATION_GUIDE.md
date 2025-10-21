# Manual Database Migration Guide - Supabase SQL Editor

**Date:** October 20, 2025  
**Purpose:** Manually add extension cancellation fields in Supabase (instead of Prisma migrate)

---

## 🎯 Quick Solution: Run This SQL in Supabase

### **Step 1: Go to Supabase SQL Editor**
1. Login to your Supabase dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

---

### **Step 2: Copy and Run This SQL**

```sql
-- ============================================
-- Extension Cancellation Fields Migration
-- Date: October 20, 2025
-- ============================================

-- 1. Add extension_status column to Extension table
ALTER TABLE "public"."Extension" 
ADD COLUMN IF NOT EXISTS "extension_status" TEXT;

-- 2. Add rejection_reason column to Extension table
ALTER TABLE "public"."Extension" 
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- 3. Add extension_payment_deadline column to Booking table
ALTER TABLE "public"."Booking" 
ADD COLUMN IF NOT EXISTS "extension_payment_deadline" TIMESTAMPTZ(6);

-- ============================================
-- Verification queries (optional - run to verify)
-- ============================================

-- Verify Extension table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Extension'
  AND column_name IN ('extension_status', 'rejection_reason')
ORDER BY column_name;

-- Verify Booking table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Booking'
  AND column_name = 'extension_payment_deadline';
```

---

### **Step 3: Click "Run" or Press F5**

You should see:
```
Success. No rows returned
```

This means the columns were added successfully! ✅

---

## 📋 Detailed Field Specifications

### **Extension Table** (add 2 columns)

#### **1. extension_status**
```sql
Column Name:  extension_status
Data Type:    TEXT
Nullable:     YES (NULL allowed)
Default:      NULL
```

**Purpose:** Track status of extension request
**Values:** 
- `NULL` or `"Pending"` - Awaiting admin approval
- `"Approved"` - Admin approved extension
- `"Rejected"` - Admin rejected extension
- `"Cancelled by Customer"` - Customer cancelled own request
- `"Auto-Cancelled"` - System auto-cancelled (payment expired)

---

#### **2. rejection_reason**
```sql
Column Name:  rejection_reason
Data Type:    TEXT
Nullable:     YES (NULL allowed)
Default:      NULL
```

**Purpose:** Store reason why extension was rejected/cancelled
**Example Values:**
- `"Vehicle needed for another booking"`
- `"Customer cancelled the extension request"`
- `"Payment deadline expired (Oct 20, 2025 6:00 PM)"`
- `"Extension request rejected by admin"`

---

### **Booking Table** (add 1 column)

#### **3. extension_payment_deadline**
```sql
Column Name:  extension_payment_deadline
Data Type:    TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ(6))
Nullable:     YES (NULL allowed)
Default:      NULL
Precision:    6 (microseconds)
```

**Purpose:** Deadline for customer to pay extension fee
**Example Values:**
- `NULL` - No pending extension
- `2025-10-20 18:00:00+00` - Must pay by Oct 20, 6:00 PM
- `2025-10-22 09:30:00+00` - Must pay by Oct 22, 9:30 AM

---

## 🔍 Before & After Table Structure

### **Extension Table**

#### **BEFORE:**
```
extension_id      | INTEGER    | NOT NULL | PRIMARY KEY
booking_id        | INTEGER    | NOT NULL | FOREIGN KEY
old_end_date      | TIMESTAMPTZ(6) | NOT NULL
new_end_date      | TIMESTAMPTZ(6) | NULL
approve_time      | TIMESTAMPTZ(6) | NULL
```

#### **AFTER:**
```
extension_id      | INTEGER    | NOT NULL | PRIMARY KEY
booking_id        | INTEGER    | NOT NULL | FOREIGN KEY
old_end_date      | TIMESTAMPTZ(6) | NOT NULL
new_end_date      | TIMESTAMPTZ(6) | NULL
approve_time      | TIMESTAMPTZ(6) | NULL
extension_status  | TEXT       | NULL     | ✅ NEW
rejection_reason  | TEXT       | NULL     | ✅ NEW
```

---

### **Booking Table**

#### **BEFORE:**
```
booking_id        | INTEGER    | NOT NULL | PRIMARY KEY
customer_id       | INTEGER    | NOT NULL
car_id            | INTEGER    | NOT NULL
... (many other fields)
isExtend          | BOOLEAN    | NULL
new_end_date      | TIMESTAMPTZ(6) | NULL
```

#### **AFTER:**
```
booking_id        | INTEGER    | NOT NULL | PRIMARY KEY
customer_id       | INTEGER    | NOT NULL
car_id            | INTEGER    | NOT NULL
... (many other fields)
isExtend          | BOOLEAN    | NULL
new_end_date      | TIMESTAMPTZ(6) | NULL
extension_payment_deadline | TIMESTAMPTZ(6) | NULL | ✅ NEW
```

---

## 🧪 Verification Steps

### **After running the SQL, verify with these queries:**

#### **1. Check Extension table:**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Extension'
ORDER BY ordinal_position;
```

**Expected to see:**
- `extension_status` | `text` | `YES` | `NULL`
- `rejection_reason` | `text` | `YES` | `NULL`

---

#### **2. Check Booking table:**
```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Booking'
  AND column_name = 'extension_payment_deadline';
```

**Expected to see:**
- `extension_payment_deadline` | `timestamp with time zone` | `YES` | `NULL`

---

#### **3. Test with sample data (optional):**
```sql
-- Test Extension table
SELECT 
  extension_id,
  booking_id,
  extension_status,
  rejection_reason
FROM "Extension"
LIMIT 5;

-- Test Booking table
SELECT 
  booking_id,
  isExtend,
  new_end_date,
  extension_payment_deadline
FROM "Booking"
WHERE isExtend = true
LIMIT 5;
```

---

## 🔄 Update Prisma Client After Manual Migration

After adding columns manually in Supabase, you need to sync Prisma:

### **Step 1: Pull schema from database**
```bash
cd backend
npx prisma db pull
```

This will update your `schema.prisma` file to match the database.

### **Step 2: Generate Prisma Client**
```bash
npx prisma generate
```

This regenerates the Prisma client with the new fields.

### **Step 3: Restart your backend**
```bash
npm run dev
```

---

## ⚠️ Important Notes

### **1. Field Names Must Match Exactly**

Prisma expects these exact column names:
- ❌ `extensionStatus` (wrong - camelCase)
- ✅ `extension_status` (correct - snake_case)

- ❌ `rejectionReason` (wrong)
- ✅ `rejection_reason` (correct)

- ❌ `extensionPaymentDeadline` (wrong)
- ✅ `extension_payment_deadline` (correct)

### **2. Case Sensitivity**

PostgreSQL/Supabase is case-sensitive for quoted identifiers:
- ✅ `"Extension"` (correct - capital E)
- ❌ `"extension"` (wrong - will fail)

- ✅ `"Booking"` (correct - capital B)
- ❌ `"booking"` (wrong - will fail)

### **3. Nullable Fields**

All 3 fields are **nullable** (can be NULL):
- ✅ This is intentional
- ✅ Existing records won't break
- ✅ New fields will be NULL for existing data
- ✅ Backend code handles NULL values

### **4. No Default Values**

These fields don't have default values:
- ✅ This is correct
- ✅ Backend sets values when needed
- ✅ NULL means "not set yet"

---

## 🎯 Complete SQL Script (Copy-Paste Ready)

```sql
-- ============================================
-- EXTENSION CANCELLATION FIELDS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

BEGIN;

-- Add columns to Extension table
ALTER TABLE "public"."Extension" 
ADD COLUMN IF NOT EXISTS "extension_status" TEXT,
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

-- Add column to Booking table
ALTER TABLE "public"."Booking" 
ADD COLUMN IF NOT EXISTS "extension_payment_deadline" TIMESTAMPTZ(6);

COMMIT;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count of Extension records (should match before migration)
SELECT COUNT(*) as total_extensions FROM "Extension";

-- Count of Booking records (should match before migration)
SELECT COUNT(*) as total_bookings FROM "Booking";

-- Show new columns exist
SELECT 
  'Extension' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Extension'
  AND column_name IN ('extension_status', 'rejection_reason')
UNION ALL
SELECT 
  'Booking' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Booking'
  AND column_name = 'extension_payment_deadline';

-- Expected output: Extension = 2, Booking = 1
```

---

## ✅ Success Checklist

After running the SQL:

- [ ] SQL executed without errors
- [ ] Verification query shows 2 new columns in Extension
- [ ] Verification query shows 1 new column in Booking
- [ ] Ran `npx prisma db pull` successfully
- [ ] Ran `npx prisma generate` successfully
- [ ] Restarted backend server
- [ ] Backend starts without errors
- [ ] Can test extension cancellation features

---

## 🚨 If Something Goes Wrong

### **Rollback Script (if needed):**

```sql
-- Remove the columns (CAUTION: This deletes data!)
BEGIN;

ALTER TABLE "public"."Extension" 
DROP COLUMN IF EXISTS "extension_status",
DROP COLUMN IF EXISTS "rejection_reason";

ALTER TABLE "public"."Booking" 
DROP COLUMN IF EXISTS "extension_payment_deadline";

COMMIT;
```

### **Common Errors:**

**Error: relation "extension" does not exist**
- ✅ Fix: Use `"Extension"` with capital E (case-sensitive)

**Error: column "extension_status" already exists**
- ✅ Fix: Column already added, skip to verification step

**Error: permission denied**
- ✅ Fix: Make sure you're logged in as admin in Supabase

---

## 📝 Summary

### **What You're Adding:**

| Table | Column Name | Type | Nullable |
|-------|-------------|------|----------|
| Extension | extension_status | TEXT | YES |
| Extension | rejection_reason | TEXT | YES |
| Booking | extension_payment_deadline | TIMESTAMPTZ(6) | YES |

### **Why Manual Migration is OK:**

✅ Same result as Prisma migrate  
✅ Faster (no migration file issues)  
✅ Direct control over database  
✅ Can verify immediately  
✅ Prisma will sync with `db pull`

### **Next Steps:**

1. Run SQL in Supabase ✅
2. Verify columns added ✅
3. Run `npx prisma db pull` ✅
4. Run `npx prisma generate` ✅
5. Restart backend ✅
6. Test features 🎉

---

**Ready to copy-paste into Supabase SQL Editor!** 🚀
