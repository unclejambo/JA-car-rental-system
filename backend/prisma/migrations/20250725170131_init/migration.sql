-- CreateTable
CREATE TABLE "Car" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "gpsDeviceId" TEXT,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);
