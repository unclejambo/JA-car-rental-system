import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function queryCustomerBookings() {
  try {
    // Find all bookings for customer ID 10 (gregg.marayan@gmail.com)
    const bookings = await prisma.booking.findMany({
      where: {
        customer_id: 10,
        booking_status: {
          in: ['Confirmed', 'In Progress', 'Pending']
        }
      },
      include: {
        extensions: {
          orderBy: { extension_id: 'desc' }
        }
      },
      orderBy: {
        booking_id: 'desc'
      }
    });

    console.log('\n=== CUSTOMER BOOKINGS (ID: 10) ===\n');
    
    if (bookings.length === 0) {
      console.log('No active bookings found.');
      return;
    }

    bookings.forEach(booking => {
      console.log(`\n📋 BOOKING #${booking.booking_id}`);
      console.log(`Status: ${booking.booking_status}`);
      console.log(`Payment Status: ${booking.payment_status}`);
      console.log(`Total Amount: ₱${booking.total_amount}`);
      console.log(`Balance: ₱${booking.balance}`);
      console.log(`Start Date: ${booking.start_date}`);
      console.log(`End Date: ${booking.end_date}`);
      console.log(`isExtend: ${booking.isExtend}`);
      console.log(`isPay: ${booking.isPay}`);
      console.log(`new_end_date: ${booking.new_end_date}`);
      
      if (booking.extensions && booking.extensions.length > 0) {
        console.log(`\nExtensions (${booking.extensions.length}):`);
        booking.extensions.forEach((ext, idx) => {
          console.log(`  ${idx + 1}. Extension #${ext.extension_id}`);
          console.log(`     Status: ${ext.extension_status || 'null'}`);
          console.log(`     Approved: ${ext.approve_time || 'null'}`);
          console.log(`     Old End: ${ext.old_end_date}`);
          console.log(`     New End: ${ext.new_end_date}`);
        });
      } else {
        console.log('\nNo extensions');
      }
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryCustomerBookings();
