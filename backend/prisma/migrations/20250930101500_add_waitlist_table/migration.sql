-- Create waitlist table for managing car booking queues
CREATE TABLE "Waitlist" (
    "waitlist_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "requested_start_date" TIMESTAMP(3) NOT NULL,
    "requested_end_date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "pickup_time" TEXT,
    "dropoff_time" TEXT,
    "pickup_location" TEXT,
    "dropoff_location" TEXT,
    "delivery_type" TEXT,
    "is_self_drive" BOOLEAN DEFAULT true,
    "selected_driver_id" INTEGER,
    "special_requests" TEXT,
    "total_cost" INTEGER,
    "status" TEXT DEFAULT 'waiting',
    "position" INTEGER NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified_date" TIMESTAMP(3),

    CONSTRAINT "Waitlist_pkey" PRIMARY KEY ("waitlist_id")
);

-- Add foreign key constraints
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("car_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_selected_driver_id_fkey" FOREIGN KEY ("selected_driver_id") REFERENCES "Driver"("drivers_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX "Waitlist_car_id_status_position_idx" ON "Waitlist"("car_id", "status", "position");
CREATE INDEX "Waitlist_customer_id_idx" ON "Waitlist"("customer_id");