import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupBooking49() {
  try {
    console.log('\n🧹 Cleaning up Booking #49...\n');

    // Step 1: Delete ALL extensions for booking #49
    const deletedExtensions = await prisma.extension.deleteMany({
      where: {
        booking_id: 49
      }
    });
    console.log(`✅ Deleted ${deletedExtensions.count} extension records`);

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

    console.log('✅ Booking #49 reset to clean state');
    console.log('\n📋 Updated Booking State:');
    console.log(`   booking_id: ${updatedBooking.booking_id}`);
    console.log(`   booking_status: ${updatedBooking.booking_status}`);
    console.log(`   payment_status: ${updatedBooking.payment_status}`);
    console.log(`   isExtend: ${updatedBooking.isExtend}`);
    console.log(`   isPay: ${updatedBooking.isPay}`);
    console.log(`   new_end_date: ${updatedBooking.new_end_date}`);
    console.log(`   balance: ₱${updatedBooking.balance}`);
    console.log(`   total_amount: ₱${updatedBooking.total_amount}`);
    console.log(`   end_date: ${updatedBooking.end_date}`);

    console.log('\n✨ Cleanup complete! Booking #49 is ready for testing.\n');
    console.log('💡 You can now test the extension flow from scratch:\n');
    console.log('   1. Customer requests extension');
    console.log('   2. Admin approves extension');
    console.log('   3. Customer pays extension');
    console.log('   4. Admin confirms payment\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupBooking49();
