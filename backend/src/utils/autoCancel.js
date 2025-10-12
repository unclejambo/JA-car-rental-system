import prisma from "../config/prisma.js";

/**
 * Auto-cancel bookings that have passed their payment deadline
 * Runs as a scheduled task to check for expired unpaid bookings
 */
export const autoCancelExpiredBookings = async () => {
  try {
    console.log('🔍 Checking for expired unpaid bookings...');
    
    const now = new Date();
    
    // Find all bookings that:
    // 1. Are still in "Pending" status (not yet confirmed/paid)
    // 2. Have not been paid (isPay = false or null)
    // 3. Have a payment_deadline that has passed
    // 4. Are not already cancelled
    const expiredBookings = await prisma.booking.findMany({
      where: {
        booking_status: 'Pending',
        OR: [
          { isPay: false },
          { isPay: null }
        ],
        payment_deadline: {
          lt: now // Less than current time = expired
        },
        isCancel: false, // Not already in cancellation process
        booking_date: {
          gte: new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)) // Within last 30 days
        }
      },
      include: {
        car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            car_status: true
          }
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings found.');
      return { cancelled: 0, message: 'No expired bookings found' };
    }

    console.log(`⚠️ Found ${expiredBookings.length} expired booking(s). Processing cancellation...`);

    let cancelledCount = 0;
    const results = [];

    for (const booking of expiredBookings) {
      try {
        // Delete the booking (auto-cancel for non-payment)
        await prisma.booking.delete({
          where: { booking_id: booking.booking_id }
        });

        // Update car status back to 'Available'
        if (booking.car?.car_id) {
          await prisma.car.update({
            where: { car_id: booking.car.car_id },
            data: { car_status: 'Available' }
          });
          
          console.log(`✅ Booking #${booking.booking_id} deleted and car ${booking.car.car_id} set to Available`);
        }

        // Create a transaction record for the auto-cancellation
        try {
          await prisma.transaction.create({
            data: {
              booking_id: booking.booking_id,
              customer_id: booking.customer.customer_id,
              car_id: booking.car.car_id,
              completion_date: null,
              cancellation_date: now,
              // Note: Could add a description field if needed
            },
          });
        } catch (transactionError) {
          console.error(`Error creating transaction for booking ${booking.booking_id}:`, transactionError);
        }

        // TODO: Send email notification to customer
        // Could use nodemailer here to notify customer their booking was auto-cancelled

        cancelledCount++;
        results.push({
          booking_id: booking.booking_id,
          customer: `${booking.customer.first_name} ${booking.customer.last_name}`,
          car: `${booking.car.make} ${booking.car.model}`,
          status: 'cancelled'
        });

      } catch (error) {
        console.error(`❌ Error cancelling booking #${booking.booking_id}:`, error);
        results.push({
          booking_id: booking.booking_id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Auto-cancel completed: ${cancelledCount} booking(s) cancelled`);
    
    return {
      cancelled: cancelledCount,
      total: expiredBookings.length,
      results: results
    };

  } catch (error) {
    console.error('❌ Error in auto-cancel process:', error);
    return {
      cancelled: 0,
      error: error.message
    };
  }
};

/**
 * Manual trigger for auto-cancel (for testing or admin use)
 */
export const manualTriggerAutoCancel = async (req, res) => {
  try {
    const result = await autoCancelExpiredBookings();
    res.json({
      success: true,
      message: 'Auto-cancel process completed',
      ...result
    });
  } catch (error) {
    console.error('Error in manual auto-cancel trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run auto-cancel process',
      details: error.message
    });
  }
};
