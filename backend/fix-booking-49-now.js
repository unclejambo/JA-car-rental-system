import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixBooking49Now() {
  try {
    console.log('\n🔧 Fixing Booking #49 Current Issues...\n');

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
    console.log(`✅ Marked ${completedExtensions.count} approved extension(s) as completed`);

    // Step 2: Apply the extension to the booking
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: 49 },
      data: {
        end_date: new Date('2025-10-23T00:00:00.000Z'), // Apply the new end date
        isExtend: false, // Clear extension flag
        isPay: false, // Clear payment flag
        new_end_date: null, // Clear new_end_date
        isExtended: true, // Mark as extended
      },
    });

    console.log('✅ Booking #49 extension applied');
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

    console.log('\n✨ Extension applied successfully! The booking now ends on Oct 23.\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBooking49Now();
