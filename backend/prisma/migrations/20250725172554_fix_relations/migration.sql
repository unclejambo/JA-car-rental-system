/*
  Warnings:

  - The primary key for the `Car` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `gpsDeviceId` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Car` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Car` table. All the data in the column will be lost.
  - Added the required column `no_of_seat` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rent_price` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Car" DROP CONSTRAINT "Car_pkey",
DROP COLUMN "gpsDeviceId",
DROP COLUMN "id",
DROP COLUMN "name",
ADD COLUMN     "car_id" SERIAL NOT NULL,
ADD COLUMN     "car_img_url" TEXT,
ADD COLUMN     "car_status" TEXT,
ADD COLUMN     "license_plate" TEXT,
ADD COLUMN     "make" TEXT,
ADD COLUMN     "mileage" INTEGER,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "no_of_seat" INTEGER NOT NULL,
ADD COLUMN     "rent_price" INTEGER NOT NULL,
ADD COLUMN     "year" INTEGER,
ADD CONSTRAINT "Car_pkey" PRIMARY KEY ("car_id");

-- CreateTable
CREATE TABLE "Admin" (
    "admin_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "contact_no" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "customer_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT,
    "contact_no" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fb_link" TEXT,
    "date_created" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT,
    "driver_license_no" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "DriverLicense" (
    "driver_license_no" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "restrictions" TEXT,
    "dl_img_url" TEXT,

    CONSTRAINT "DriverLicense_pkey" PRIMARY KEY ("driver_license_no")
);

-- CreateTable
CREATE TABLE "Driver" (
    "drivers_id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT,
    "contact_no" TEXT,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "driver_license_no" TEXT NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("drivers_id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "booking_id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "booking_date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "pickup_time" TIMESTAMP(3),
    "pickup_loc" TEXT,
    "dropoff_time" TIMESTAMP(3),
    "dropoff_loc" TEXT,
    "isSelfDriver" BOOLEAN DEFAULT false,
    "isExtend" BOOLEAN DEFAULT false,
    "new_end_date" TIMESTAMP(3),
    "isCancel" BOOLEAN DEFAULT false,
    "total_amount" INTEGER,
    "payment_status" TEXT,
    "isRelease" BOOLEAN DEFAULT false,
    "isReturned" BOOLEAN DEFAULT false,
    "booking_status" TEXT,
    "drivers_id" INTEGER,
    "admin_id" INTEGER,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("booking_id")
);

-- CreateTable
CREATE TABLE "Extension" (
    "extension_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "extension_date" TIMESTAMP(3) NOT NULL,
    "payment_status" TEXT,
    "status" TEXT,

    CONSTRAINT "Extension_pkey" PRIMARY KEY ("extension_id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "payment_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "description" TEXT,
    "payment_method" TEXT,
    "gcash_no" TEXT,
    "reference_no" TEXT,
    "amount" INTEGER NOT NULL,
    "paid_date" TIMESTAMP(3),

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "refund_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "refund_method" TEXT,
    "gcash_no" TEXT,
    "reference_no" TEXT,
    "refund_amount" INTEGER NOT NULL,
    "refund_date" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("refund_id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "transaction_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "car_id" INTEGER NOT NULL,
    "completion_date" TIMESTAMP(3),
    "cancellation_date" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "maintenance_id" SERIAL NOT NULL,
    "car_id" INTEGER NOT NULL,
    "maintenance_start_date" TIMESTAMP(3),
    "maintenance_end_date" TIMESTAMP(3),
    "description" TEXT,
    "maintenance_cost" INTEGER,
    "maintenance_shop_name" TEXT,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("maintenance_id")
);

-- CreateTable
CREATE TABLE "Release" (
    "release_id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "drivers_id" INTEGER NOT NULL,
    "valid_id_img1" TEXT,
    "valid_id_img2" TEXT,
    "agreement_form" TEXT,
    "equipment" TEXT,
    "others" TEXT,
    "gas_level" TEXT,

    CONSTRAINT "Release_pkey" PRIMARY KEY ("release_id")
);

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_driver_license_no_fkey" FOREIGN KEY ("driver_license_no") REFERENCES "DriverLicense"("driver_license_no") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_driver_license_no_fkey" FOREIGN KEY ("driver_license_no") REFERENCES "DriverLicense"("driver_license_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("car_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_drivers_id_fkey" FOREIGN KEY ("drivers_id") REFERENCES "Driver"("drivers_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "Admin"("admin_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extension" ADD CONSTRAINT "Extension_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("car_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_car_id_fkey" FOREIGN KEY ("car_id") REFERENCES "Car"("car_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Booking"("booking_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Release" ADD CONSTRAINT "Release_drivers_id_fkey" FOREIGN KEY ("drivers_id") REFERENCES "Driver"("drivers_id") ON DELETE RESTRICT ON UPDATE CASCADE;
