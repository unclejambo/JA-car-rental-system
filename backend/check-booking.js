import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBooking() {
  try {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: 49 },
      include: { 
        extensions: {
          orderBy: {
            extension_id: 'desc'
          }
        } 
      }
    });

    console.log('\n=== BOOKING #49 ===');
    console.log('booking_id:', booking.booking_id);
    console.log('booking_status:', booking.booking_status);
    console.log('payment_status:', booking.payment_status);
    console.log('isExtend:', booking.isExtend);
    console.log('isPay:', booking.isPay);
    console.log('isExtended:', booking.isExtended);
    console.log('end_date:', booking.end_date);
    console.log('new_end_date:', booking.new_end_date);
    console.log('total_amount:', booking.total_amount);
    console.log('balance:', booking.balance);
    console.log('extension_payment_deadline:', booking.extension_payment_deadline);
    
    console.log('\n=== EXTENSIONS FOR BOOKING #49 ===');
    console.log('Total extensions:', booking.extensions.length);
    booking.extensions.forEach((ext, index) => {
      console.log(`\nExtension ${index + 1}:`);
      console.log('  extension_id:', ext.extension_id);
      console.log('  old_end_date:', ext.old_end_date);
      console.log('  new_end_date:', ext.new_end_date);
      console.log('  approve_time:', ext.approve_time);
      console.log('  extension_status:', ext.extension_status);
      console.log('  rejection_reason:', ext.rejection_reason);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();
