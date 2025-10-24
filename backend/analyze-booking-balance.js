import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeBooking49Balance() {
  try {
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
      return;
    }
    const days = Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24));
    if (booking.payments.length === 0) {
    } else {
      let totalPaid = 0;
      booking.payments.forEach((payment, idx) => {
        totalPaid += payment.amount;
      });
    }

    const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
    const calculatedBalance = booking.total_amount - totalPaid;
    if (calculatedBalance !== booking.balance) {
      await prisma.booking.update({
        where: { booking_id: 49 },
        data: { balance: calculatedBalance }
      });
    } else {
    }
    if (calculatedBalance > 0) {
    } else if (calculatedBalance < 0) {
    } else {
    }

  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBooking49Balance();
