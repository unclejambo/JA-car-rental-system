import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeBooking49Balance() {
  try {
    console.log('\n💰 Analyzing Booking #49 Balance...\n');

    // Get booking with payments
    const booking = await prisma.booking.findUnique({
      where: { booking_id: 49 },
      include: {
        payments: {
          orderBy: { payment_id: 'desc' }
        },
        car: {
          select: {
            make: true,
            model: true,
            rent_price: true
          }
        }
      }
    });

    if (!booking) {
      console.log('Booking not found');
      return;
    }

    console.log('📋 Booking Details:');
    console.log(`   Car: ${booking.car.make} ${booking.car.model}`);
    console.log(`   Daily Rate: ₱${booking.car.rent_price}`);
    console.log(`   Start: ${booking.start_date.toISOString().split('T')[0]}`);
    console.log(`   End: ${booking.end_date.toISOString().split('T')[0]}`);
    
    const days = Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24));
    console.log(`   Duration: ${days} days`);
    console.log(`   Total Amount: ₱${booking.total_amount}`);

    console.log('\n💳 Payments Made:');
    if (booking.payments.length === 0) {
      console.log('   No payments recorded');
    } else {
      let totalPaid = 0;
      booking.payments.forEach((payment, idx) => {
        console.log(`   ${idx + 1}. ₱${payment.amount} (Payment #${payment.payment_id})`);
        console.log(`      Method: ${payment.payment_method || 'N/A'}`);
        totalPaid += payment.amount;
      });
      console.log(`\n   Total Paid: ₱${totalPaid}`);
    }

    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const calculatedBalance = booking.total_amount - totalPaid;

    console.log('\n📊 Balance Calculation:');
    console.log(`   Total Amount: ₱${booking.total_amount}`);
    console.log(`   Total Paid: ₱${totalPaid}`);
    console.log(`   Calculated Balance: ₱${calculatedBalance}`);
    console.log(`   Stored Balance: ₱${booking.balance}`);
    
    if (calculatedBalance !== booking.balance) {
      console.log(`   ⚠️  Mismatch! Updating balance...`);
      await prisma.booking.update({
        where: { booking_id: 49 },
        data: { balance: calculatedBalance }
      });
      console.log(`   ✅ Balance updated to ₱${calculatedBalance}`);
    } else {
      console.log(`   ✅ Balance is correct`);
    }

    console.log('\n💡 Settlement Info:');
    if (calculatedBalance > 0) {
      console.log(`   Customer needs to pay ₱${calculatedBalance} to settle this booking.`);
      console.log(`   This is the remaining balance from the original booking, not extension-related.`);
    } else if (calculatedBalance < 0) {
      console.log(`   Customer has overpaid by ₱${Math.abs(calculatedBalance)}.`);
    } else {
      console.log(`   Booking is fully paid!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBooking49Balance();
