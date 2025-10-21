import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fullCleanup() {
  try {
    console.log('\n🧹 Full Cleanup of Booking #49...\n');

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
    console.log(`✅ Marked ${cancelledExtensions.count} approved extension(s) as cancelled`);

    // Step 2: Delete any extension with null status (incomplete test data)
    const deletedNull = await prisma.extension.deleteMany({
      where: {
        booking_id: 49,
        extension_status: null,
      },
    });
    console.log(`✅ Deleted ${deletedNull.count} extension(s) with null status`);

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

    console.log('✅ Booking #49 reset to clean state');
    console.log('\n📋 Final State:');
    console.log(`   booking_id: ${updatedBooking.booking_id}`);
    console.log(`   booking_status: ${updatedBooking.booking_status}`);
    console.log(`   payment_status: ${updatedBooking.payment_status}`);
    console.log(`   end_date: ${updatedBooking.end_date}`);
    console.log(`   isExtend: ${updatedBooking.isExtend}`);
    console.log(`   isPay: ${updatedBooking.isPay}`);
    console.log(`   new_end_date: ${updatedBooking.new_end_date}`);
    console.log(`   isExtended: ${updatedBooking.isExtended}`);
    console.log(`   balance: ₱${updatedBooking.balance}`);
    console.log(`   total_amount: ₱${updatedBooking.total_amount}`);

    // Step 4: Show extension summary
    const allExtensions = await prisma.extension.findMany({
      where: { booking_id: 49 },
      orderBy: { extension_id: 'desc' },
    });

    console.log(`\n📊 Extensions Summary (${allExtensions.length} total):`);
    allExtensions.forEach((ext, idx) => {
      console.log(`   ${idx + 1}. Extension #${ext.extension_id}: ${ext.extension_status || 'null'}`);
    });

    console.log('\n✨ Cleanup complete! Ready for clean testing.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullCleanup();
