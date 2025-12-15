import prisma from '../config/prisma.js';
import { sendReturnReminderNotification } from './notificationService.js';

/**
 * Check for bookings that need return reminders (at start of return date 00:00)
 * and send notifications to customers
 */
export async function sendReturnReminders() {
  try {
    console.log('🔔 Checking for return reminders...');
    
    const now = new Date();
    
    // Get start and end of today in Philippine timezone
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    // Find bookings that:
    // 1. Have return date (dropoff_time or end_date) falling on today
    // 2. Are in "Confirmed" or "In Progress" or "Ongoing" status
    // 3. Haven't had the reminder sent yet (return_reminder_sent = false or null)
    // 4. Are not cancelled or completed
    const bookingsNeedingReminder = await prisma.booking.findMany({
      where: {
        OR: [
          {
            dropoff_time: {
              gte: startOfToday,
              lte: endOfToday
            }
          },
          {
            dropoff_time: null,
            end_date: {
              gte: startOfToday,
              lte: endOfToday
            }
          }
        ],
        booking_status: {
          in: ['Confirmed', 'In Progress', 'Ongoing']
        },
        OR: [
          { return_reminder_sent: false },
          { return_reminder_sent: null }
        ]
      },
      include: {
        customer: true,
        car: true
      }
    });

    console.log(`📋 Found ${bookingsNeedingReminder.length} bookings needing return reminders`);

    let successCount = 0;
    let failCount = 0;

    // Send reminders for each booking
    for (const booking of bookingsNeedingReminder) {
      try {
        const { customer, car } = booking;

        // Skip if customer doesn't have notification preferences set
        if (!customer.isRecUpdate || customer.isRecUpdate === 0) {
          console.log(`⏭️ Skipping booking ${booking.booking_id} - customer has notifications disabled`);
          // Mark as sent to avoid checking again
          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: { return_reminder_sent: true }
          });
          continue;
        }

        console.log(`📤 Sending return reminder for booking ${booking.booking_id} to customer ${customer.first_name} ${customer.last_name}`);

        // Send the notification
        const result = await sendReturnReminderNotification(booking, customer, car);

        if (result.success) {
          // Mark the reminder as sent
          await prisma.booking.update({
            where: { booking_id: booking.booking_id },
            data: { return_reminder_sent: true }
          });
          
          successCount++;
          console.log(`✅ Return reminder sent successfully for booking ${booking.booking_id}`);
        } else {
          failCount++;
          console.error(`❌ Failed to send return reminder for booking ${booking.booking_id}:`, result.error);
        }
      } catch (error) {
        failCount++;
        console.error(`❌ Error processing booking ${booking.booking_id}:`, error);
      }
    }

    console.log(`✨ Return reminder check complete: ${successCount} sent, ${failCount} failed`);
    
    return {
      success: true,
      totalChecked: bookingsNeedingReminder.length,
      sent: successCount,
      failed: failCount
    };
  } catch (error) {
    console.error('❌ Error in sendReturnReminders:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
