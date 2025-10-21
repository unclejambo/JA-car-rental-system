import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markBooking49AsPaid() {
  try {
    console.log('\n💰 Marking Booking #49 as Fully Paid...\n');

    // Get current booking state
    const booking = await prisma.booking.findUnique({
      where: { booking_id: 49 },
      include: {
        payments: true
      }
    });

    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('📋 Current State:');
    console.log(`   Total Amount: ₱${booking.total_amount}`);
    console.log(`   Current Balance: ₱${booking.balance}`);
    console.log(`   Payment Status: ${booking.payment_status}`);

    // Create a payment to cover the remaining balance
    if (booking.balance > 0) {
      const paymentAmount = booking.balance;
      
      console.log(`\n💳 Creating payment of ₱${paymentAmount} to settle balance...`);
      
      await prisma.payment.create({
        data: {
          booking_id: 49,
          customer_id: booking.customer_id,
          amount: paymentAmount,
          payment_method: 'Cash',
          description: 'Balance payment (for testing purposes)',
          paid_date: new Date(),
        }
      });

      console.log('✅ Payment recorded');
    }

    // Update booking to fully paid
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: 49 },
      data: {
        balance: 0,
        payment_status: 'Paid'
      }
    });

    console.log('\n✅ Booking #49 marked as fully paid!');
    console.log('\n📋 Updated State:');
    console.log(`   Total Amount: ₱${updatedBooking.total_amount}`);
    console.log(`   Balance: ₱${updatedBooking.balance}`);
    console.log(`   Payment Status: ${updatedBooking.payment_status}`);

    console.log('\n✨ Perfect! Now you can test extension flow without payment confusion:\n');
    console.log('   1. Customer requests extension (will ADD new cost)');
    console.log('   2. Admin approves extension');
    console.log('   3. Customer pays EXTENSION fee only');
    console.log('   4. Admin confirms extension payment\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

markBooking49AsPaid();
