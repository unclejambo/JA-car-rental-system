import prisma from '../config/prisma.js';

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany();
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};



export const getBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { booking_id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
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