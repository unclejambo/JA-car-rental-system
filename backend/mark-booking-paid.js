import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function markBooking49AsPaid() {
  try {
    // Get current booking state
    const booking = await prisma.booking.findUnique({
      where: { booking_id: 49 },
      include: {
        payments: true
      }
    });

    if (!booking) {
      return;
    }
    // Create a payment to cover the remaining balance
    if (booking.balance > 0) {
      const paymentAmount = booking.balance;
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
    }

    // Update booking to fully paid
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: 49 },
      data: {
        balance: 0,
        payment_status: 'Paid'
      }
    });
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

markBooking49AsPaid();
