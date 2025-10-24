import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullCleanup() {
  try {
    // Step 1: Mark ALL approved extensions as "Cancelled by Admin"
    const cancelledExtensions = await prisma.extension.updateMany({
      where: {
        booking_id: 49,
        extension_status: "approved",
      },
      data: {
        extension_status: "Cancelled by Admin",
        rejection_reason: "Cleanup - testing new extension flow",
      },
    });
    // Step 2: Delete any extension with null status (incomplete test data)
    const deletedNull = await prisma.extension.deleteMany({
      where: {
        booking_id: 49,
        extension_status: null,
      },
    });
    // Step 3: Reset booking to clean state  
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: 49 },
      data: {
        end_date: new Date('2025-10-23T00:00:00.000Z'), // Keep last successful extension
        isExtend: false, // Clear extension flag
        isPay: false, // Clear payment flag
        new_end_date: null, // Clear new_end_date
        isExtended: true, // Mark as extended
        balance: 0, // Clear balance
        payment_status: "Paid", // Mark as paid
      },
    });
    // Step 4: Show extension summary
    const allExtensions = await prisma.extension.findMany({
      where: { booking_id: 49 },
      orderBy: { extension_id: 'desc' },
    });
    allExtensions.forEach((ext, idx) => {
    });
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

fullCleanup();
