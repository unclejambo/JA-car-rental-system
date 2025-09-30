import prisma from '../config/prisma.js';

export const getBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true, year: true } },
      },
    });

    const shaped = bookings.map(({ customer, car, ...rest }) => ({
      ...rest,
      customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
      car_model: [car?.make, car?.model].filter(Boolean).join(' '),
    }));

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
      },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const { customer, car, ...rest } = booking;
    const shaped = {
      ...rest,
      customer_name: `${customer?.first_name ?? ''} ${customer?.last_name ?? ''}`.trim(),
      car_model: [car?.make, car?.model].filter(Boolean).join(' '),
    };

    res.json(shaped);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
};

// @desc    Create a booking request (for customers)
// @route   POST /bookings
// @access  Private/Customer
export const createBookingRequest = async (req, res) => {
  try {
    const {
      car_id,
      customer_id,
      booking_date,
      purpose,
      start_date,
      end_date,
      pickup_time,
      pickup_loc,
      dropoff_loc,
      isSelfDriver,
      drivers_id,
      booking_type, // 'deliver' or 'pickup'
      delivery_location,
    } = req.body;

    console.log('Creating booking request with data:', req.body);

    // Validate required fields
    if (!car_id || !customer_id || !start_date || !end_date || !purpose) {
      return res.status(400).json({ 
        error: 'Missing required fields: car_id, customer_id, start_date, end_date, purpose' 
      });
    }

    // Check if car exists and is available
    const car = await prisma.car.findUnique({
      where: { car_id: parseInt(car_id) }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Create the booking
    const newBooking = await prisma.booking.create({
      data: {
        car_id: parseInt(car_id),
        customer_id: parseInt(customer_id),
        booking_date: new Date(booking_date || new Date()),
        purpose,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        pickup_time: pickup_time ? new Date(pickup_time) : new Date(start_date),
        pickup_loc: pickup_loc || delivery_location,
        dropoff_loc,
        isSelfDriver: Boolean(isSelfDriver),
        drivers_id: isSelfDriver ? null : (drivers_id ? parseInt(drivers_id) : null),
        booking_status: 'Pending', // Admin needs to approve
        payment_status: 'Pending',
        total_amount: null, // Will be calculated by admin
        isExtend: false,
        isCancel: false,
        isRelease: false,
        isReturned: false,
      },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            rent_price: true,
          }
        },
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });

    console.log('Booking created successfully:', newBooking.booking_id);

    res.status(201).json({
      message: 'Booking request submitted successfully',
      booking: newBooking,
    });

  } catch (error) {
    console.error('Error creating booking request:', error);
    res.status(500).json({ error: 'Failed to create booking request' });
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