import prisma from "../config/prisma.js";

/**
 * Auto-cancel (reject) extensions that have passed their payment deadline
 * Runs before checking for expired bookings
 * Only rejects the extension, keeps the original booking active
 */
export const autoCancelExpiredExtensions = async () => {
  try {
    console.log('🔍 Checking for expired extension payment deadlines...');
    
    const now = new Date();
    
    // Find bookings with expired extension payment deadline
    const expiredExtensions = await prisma.booking.findMany({
      where: {
        isExtend: true, // Has pending extension
        extension_payment_deadline: { 
          lte: now  // Deadline has passed
        },
        booking_status: 'In Progress' // Still active booking
      },
      include: {
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true
          }
        },
        car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            year: true,
            license_plate: true,
            rent_price: true
          }
        },
        extensions: {
          where: {
            approve_time: null // Pending extension
          },
          orderBy: { extension_id: 'desc' },
          take: 1
        }
      }
    });

    if (expiredExtensions.length === 0) {
      console.log('✅ No expired extension payment deadlines found.');
      return { cancelled: 0, message: 'No expired extensions found' };
    }

    console.log(`⚠️ Found ${expiredExtensions.length} extension(s) with expired payment deadline. Auto-rejecting...`);

    let cancelledCount = 0;
    const results = [];

    for (const booking of expiredExtensions) {
      try {
        const pendingExtension = booking.extensions[0];
        
        if (!pendingExtension) {
          console.log(`⚠️ No pending extension found for booking ${booking.booking_id}, skipping...`);
          continue;
        }

        // Calculate amounts to revert
        const originalEndDate = new Date(booking.end_date);
        const newEndDate = new Date(booking.new_end_date);
        const additionalDays = Math.ceil(
          (newEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
        );
        const additionalCost = additionalDays * (booking.car.rent_price || 0);
        const restoredTotalAmount = (booking.total_amount || 0) - additionalCost;
        const restoredBalance = (booking.balance || 0) - additionalCost;
        const paymentStatus = restoredBalance <= 0 ? 'Paid' : 'Unpaid';

        console.log(`🚫 Auto-cancelling extension for booking ${booking.booking_id}`);
        console.log(`   Original end date: ${booking.end_date}`);
        console.log(`   Requested new end date: ${booking.new_end_date}`);
        console.log(`   Payment deadline expired: ${booking.extension_payment_deadline}`);
        console.log(`   Additional cost: ₱${additionalCost}`);

        // 1. Update Extension record
        await prisma.extension.update({
          where: { extension_id: pendingExtension.extension_id },
          data: {
            extension_status: 'Auto-Cancelled',
            rejection_reason: `Payment deadline expired (${booking.extension_payment_deadline?.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true 
            })})`
          }
        });

        // 2. Revert Booking to original state
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            new_end_date: null,
            isExtend: false,
            total_amount: restoredTotalAmount,
            balance: restoredBalance,
            payment_status: paymentStatus,
            extension_payment_deadline: null,
            // Keep original end_date - booking continues until original date
          }
        });

        // 3. TODO: Send notification to customer
        // Could use sendExtensionRejectedNotification here with auto-cancel reason
        console.log(`📧 TODO: Send auto-cancel notification to customer ${booking.customer.email}`);

        // 4. TODO: Send notification to admin
        console.log(`📧 TODO: Send auto-cancel notification to admin`);

        console.log(`✅ Extension auto-cancelled for booking ${booking.booking_id}`);
        console.log(`   Booking continues until: ${booking.end_date}`);

        cancelledCount++;
        results.push({
          booking_id: booking.booking_id,
          customer: `${booking.customer.first_name} ${booking.customer.last_name}`,
          car: `${booking.car.make} ${booking.car.model}`,
          original_end_date: booking.end_date,
          requested_end_date: booking.new_end_date,
          status: 'extension_auto_cancelled'
        });

      } catch (error) {
        console.error(`❌ Error auto-cancelling extension for booking ${booking.booking_id}:`, error);
        results.push({
          booking_id: booking.booking_id,
          status: 'error',
          error: error.message
        });
      }
    }

    console.log(`✅ Auto-cancel extensions completed: ${cancelledCount} extension(s) cancelled`);
    
    return {
      cancelled: cancelledCount,
      total: expiredExtensions.length,
      results: results
    };

  } catch (error) {
    console.error('❌ Error in auto-cancel extensions process:', error);
    return {
      cancelled: 0,
      error: error.message
    };
  }
};

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
 * Checks both extensions and bookings
 */
export const manualTriggerAutoCancel = async (req, res) => {
  try {
    console.log('🤖 Running manual auto-cancel check...');
    
    // 1. Check for expired EXTENSION payment deadlines first
    const extensionResult = await autoCancelExpiredExtensions();
    
    // 2. Check for expired BOOKING payment deadlines
    const bookingResult = await autoCancelExpiredBookings();
    
    res.json({
      success: true,
      message: 'Auto-cancel process completed',
      extensions: extensionResult,
      bookings: bookingResult,
      summary: {
        total_extensions_cancelled: extensionResult.cancelled || 0,
        total_bookings_cancelled: bookingResult.cancelled || 0
      }
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
