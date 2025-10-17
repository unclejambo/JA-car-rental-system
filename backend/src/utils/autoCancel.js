import prisma from "../config/prisma.js";

/**
 * Auto-cancel bookings that have passed their payment deadline
 * Runs as a scheduled task to check for expired unpaid bookings
 * 
 * Payment Deadline Rules:
 * - If booking start date is TODAY: 1 hour deadline
 * - If booking start date is within 3 days (but not today): 24 hour deadline
 * - Otherwise: 72 hour (3 day) deadline from booking_date
 */
export const autoCancelExpiredBookings = async () => {
  try {
    console.log('🔍 Checking for expired unpaid bookings...');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Find all bookings that are pending payment
    const pendingBookings = await prisma.booking.findMany({
      where: {
        booking_status: 'Pending',
        OR: [
          { isPay: false },
          { isPay: null }
        ],
        isCancel: false, // Not already in cancellation process
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

    if (pendingBookings.length === 0) {
      console.log('✅ No pending bookings found.');
      return { cancelled: 0, message: 'No pending bookings found' };
    }

    console.log(`🔍 Checking ${pendingBookings.length} pending booking(s) for expiration...`);

    const expiredBookings = [];

    // Check each booking against its specific deadline
    for (const booking of pendingBookings) {
      const bookingDate = new Date(booking.booking_date);
      const startDate = new Date(booking.start_date);
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      
      // Calculate days until start date
      const daysUntilStart = Math.ceil((startDateOnly - today) / (1000 * 60 * 60 * 24));
      
      let deadline;
      let deadlineDescription;
      
      if (daysUntilStart === 0) {
        // Booking start date is TODAY - 1 hour deadline
        deadline = new Date(bookingDate.getTime() + (1 * 60 * 60 * 1000));
        deadlineDescription = '1 hour (same-day booking)';
      } else if (daysUntilStart > 0 && daysUntilStart <= 3) {
        // Booking start date is within 3 days (but not today) - 24 hour deadline
        deadline = new Date(bookingDate.getTime() + (24 * 60 * 60 * 1000));
        deadlineDescription = '24 hours (booking within 3 days)';
      } else {
        // Booking start date is more than 3 days away - 72 hour (3 day) deadline
        deadline = new Date(bookingDate.getTime() + (72 * 60 * 60 * 1000));
        deadlineDescription = '72 hours (standard deadline)';
      }
      
      // Check if payment deadline has passed
      if (now > deadline) {
        console.log(`⏰ Booking #${booking.booking_id} expired (${deadlineDescription}). Booking date: ${bookingDate.toISOString()}, Deadline: ${deadline.toISOString()}`);
        expiredBookings.push(booking);
      }
    }

    if (expiredBookings.length === 0) {
      console.log('✅ No expired bookings found.');
      return { cancelled: 0, message: 'No expired bookings found' };
    }

    console.log(`⚠️ Found ${expiredBookings.length} expired booking(s). Processing cancellation...`);

    let cancelledCount = 0;
    const results = [];

    for (const booking of expiredBookings) {
      try {
        // First, delete any related payments to avoid foreign key constraint violation
        const deletedPayments = await prisma.payment.deleteMany({
          where: { booking_id: booking.booking_id }
        });
        
        if (deletedPayments.count > 0) {
          console.log(`🗑️ Deleted ${deletedPayments.count} payment record(s) for booking #${booking.booking_id}`);
        }

        // Then delete the booking (auto-cancel for non-payment)
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
