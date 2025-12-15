import prisma from '../config/prisma.js';
import { sendReturnReminderNotification } from './notificationService.js';

/**
 * Check for bookings that need return reminders (at 12:00 AM Philippine time on return date)
 * and send notifications to customers
 */
export async function sendReturnReminders() {
  try {
    console.log('🔔 Checking for return reminders...');
    
    // Get current time in Philippine timezone
    const nowInPH = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
    const now = new Date(nowInPH);
    
    // Get start and end of today in Philippine timezone
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    
    console.log(`📅 Checking for returns on: ${startOfToday.toDateString()} (Philippine Time)`);
    
    // Find bookings that:
    // 1. Have return date (dropoff_time or end_date, or new_end_date if extended) falling on today
    // 2. Are in "Confirmed" or "In Progress" or "Ongoing" status
    // 3. Haven't had the reminder sent yet (return_reminder_sent = false or null)
    // 4. Are not cancelled or completed
    const bookingsNeedingReminder = await prisma.booking.findMany({
      where: {
        booking_status: {
          in: ['Confirmed', 'In Progress', 'Ongoing']
        },
        isCancel: false,
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

    // Filter bookings where the effective return date is today (in Philippine timezone)
    const bookingsForToday = bookingsNeedingReminder.filter((booking) => {
      // Use new_end_date if extended, otherwise use dropoff_time or end_date
      let returnDate;
      if (booking.isExtended && booking.new_end_date) {
        returnDate = new Date(booking.new_end_date);
      } else {
        returnDate = new Date(booking.dropoff_time || booking.end_date);
      }
      
      // Convert to Philippine timezone for comparison
      const returnDateInPH = new Date(returnDate.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      returnDateInPH.setHours(0, 0, 0, 0);
      
      return returnDateInPH.getTime() === startOfToday.getTime();
    });

    console.log(`📋 Found ${bookingsForToday.length} bookings needing return reminders for today`);

    let successCount = 0;
    let failCount = 0;

    // Send reminders for each booking
    for (const booking of bookingsForToday) {
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
      totalChecked: bookingsForToday.length,
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
