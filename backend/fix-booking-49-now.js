import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixBooking49Now() {
  try {
    // Step 1: Mark ALL approved extensions as completed
    const completedExtensions = await prisma.extension.updateMany({
      where: {
        booking_id: 49,
        extension_status: "approved",
      },
      data: {
        extension_status: "completed",
      },
    });

    // Step 2: Apply the extension to the booking
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: 49 },
      data: {
        end_date: new Date("2025-10-23T00:00:00.000Z"), // Apply the new end date
        isExtend: false, // Clear extension flag
        isPay: false, // Clear payment flag
        new_end_date: null, // Clear new_end_date
        isExtended: true, // Mark as extended
      },
    });
  } catch (error) {
    // Error handling
  } finally {
    await prisma.$disconnect();
  }
}

fixBooking49Now();
