import prisma from '../config/prisma.js';

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
        payments: { select: { amount: true } },
      },
    });

    // Update balances in database and shape response
    const shaped = await Promise.all(
      bookings.map(async ({ customer, car, payments, ...rest }) => {
        const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
        const remainingBalance = (rest.total_amount || 0) - totalPaid;
        
        // Update the balance in the database if it's different
        if (rest.balance !== remainingBalance) {
          await prisma.booking.update({
            where: { booking_id: rest.booking_id },
            data: { balance: remainingBalance },
          });
        }
        
        return {
          ...rest,
          balance: remainingBalance, // Use the calculated balance
          customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
          car_model: [car?.make, car?.model].filter(Boolean).join(' '),
          total_paid: totalPaid,
          remaining_balance: remainingBalance,
        };
      })
    );

    res.json(shaped);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
        payments: { select: { amount: true } },
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { customer, car, payments, ...rest } = booking;
    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remainingBalance = (rest.total_amount || 0) - totalPaid;
    
    // Update the balance in the database if it's different
    if (rest.balance !== remainingBalance) {
      await prisma.booking.update({
        where: { booking_id: rest.booking_id },
        data: { balance: remainingBalance },
      });
    }
    
    const shaped = {
      ...rest,
      balance: remainingBalance, // Use the calculated balance
      customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
      car_model: [car?.make, car?.model].filter(Boolean).join(' '),
      total_paid: totalPaid,
      remaining_balance: remainingBalance,
    };

    res.json(shaped);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {
        booking_id,
        customer_id,
        car_id,
        booking_date,
        purpose,
        start_date,
        end_date,
        pickup_time,
        pickup_loc,
        dropoff_time,
        dropoff_loc,
        refunds,
        isSelfDriver,
        isExtend,
        new_end_date,
        isCancel,
        total_amount,
        payment_status,
        isRelease,
        isReturned,
        booking_status,
        drivers_id, // This must be an existing driver in the system (FK)
        admin_id,
        extensions,
        payments,
        releases,
        transactions,
    } = req.body;

    const newBooking = await prisma.booking.create({
        data: {
            booking_id,
            customer_id,
            car_id,
            booking_date,
            purpose,
            start_date,
            end_date,
            pickup_time,
            pickup_loc,
            dropoff_time,
            dropoff_loc,
            refunds,
            isSelfDriver,
            isExtend,
            new_end_date,
            isCancel,
            total_amount,
            payment_status,
            isRelease,
            isReturned,
            booking_status,
            drivers_id,
            admin_id,
            extensions,
            payments,
            releases,
            transactions,
        },
    });

    res.status(201).json(newBooking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const updateBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const {
        customer_id,
        car_id,
        booking_date,
        purpose,
        start_date,
        end_date,
        pickup_time,
        pickup_loc,
        dropoff_time,
        dropoff_loc,
        refunds,
        isSelfDriver,
        isExtend,
        new_end_date,
        isCancel,
        total_amount,
        payment_status,
        isRelease,
        isReturned,
        booking_status,
        drivers_id,
        admin_id,
        extensions,
        payments,
        releases,
        transactions,
    } = req.body;

    const updatedBooking = await prisma.booking.update({
        where: { booking_id: bookingId },
        data: {
            customer_id,
            car_id,
            booking_date,
            purpose,
            start_date,
            end_date,
            pickup_time,
            pickup_loc,
            dropoff_time,
            dropoff_loc,
            refunds,
            isSelfDriver,
            isExtend,
            new_end_date,
            isCancel,
            total_amount,
            payment_status,
            isRelease,
            isReturned,
            booking_status,
            drivers_id,
            admin_id,
            extensions,
            payments,
            releases,
            transactions,
        },
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Failed to update booking' });
  }
};



export const deleteBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    await prisma.booking.delete({ where: { booking_id: bookingId } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};