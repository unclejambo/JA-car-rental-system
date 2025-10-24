import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupBooking49() {
  try {
    // Step 1: Delete ALL extensions for booking #49
    const deletedExtensions = await prisma.extension.deleteMany({
      where: {
        booking_id: 49
      }
    });
    // Step 2: Reset booking #49 to clean state
    const updatedBooking = await prisma.booking.update({
      where: {
        booking_id: 49
      },
      data: {
        isExtend: false,           // Clear extension flag
        isPay: false,              // Clear payment flag
        new_end_date: null,        // Clear new end date
        extension_payment_deadline: null,  // Clear deadline
        // Keep the balance and total_amount as is for now
      }
    });
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBooking49();
