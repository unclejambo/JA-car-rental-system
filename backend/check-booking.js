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
    booking.extensions.forEach((ext, index) => {
    });

  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

checkBooking();
