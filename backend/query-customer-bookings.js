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
    if (bookings.length === 0) {
      return;
    }

    bookings.forEach(booking => {
      if (booking.extensions && booking.extensions.length > 0) {
        booking.extensions.forEach((ext, idx) => {
        });
      } else {
      }
    });

  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

queryCustomerBookings();
