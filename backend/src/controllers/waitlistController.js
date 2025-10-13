import prisma from '../config/prisma.js';

// @desc    Get waitlist entries for a car
// @route   GET /cars/:carId/waitlist
// @access  Private
export const getCarWaitlist = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    
    const waitlistEntries = await prisma.waitlist.findMany({
      where: { 
        car_id: carId,
        status: 'waiting'
      },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      },
      orderBy: {
        position: 'asc'
      }
    });
    
    res.json(waitlistEntries);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist' });
  }
};

// @desc    Add customer to waitlist
// @route   POST /cars/:carId/waitlist
// @access  Private (Customer)
export const joinWaitlist = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    if (req.user?.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can join waitlist' });
    }

    const {
      requested_start_date,
      requested_end_date,
      purpose,
      pickup_time,
      dropoff_time,
      pickup_location,
      dropoff_location,
      delivery_type,
      is_self_drive,
      selected_driver_id,
      special_requests,
      total_cost,
      notification_preference // Optional: can be '1' (SMS), '2' (Email), '3' (Both)
    } = req.body;

    // Check if customer is already on waitlist for this car
    const existingEntry = await prisma.waitlist.findFirst({
      where: {
        customer_id: parseInt(customerId),
        car_id: carId,
        status: 'waiting'
      }
    });

    if (existingEntry) {
      return res.status(400).json({ error: 'You are already on the waitlist for this car' });
    }

    // Get next position in waitlist
    const lastPosition = await prisma.waitlist.findFirst({
      where: { car_id: carId, status: 'waiting' },
      orderBy: { position: 'desc' }
    });

    const nextPosition = (lastPosition?.position || 0) + 1;

    // If no booking details provided (simple waitlist join), create basic entry
    if (!requested_start_date || !requested_end_date) {
      const waitlistEntry = await prisma.waitlist.create({
        data: {
          customer_id: parseInt(customerId),
          car_id: carId,
          position: nextPosition,
          status: 'waiting',
          payment_status: 'Unpaid'
        },
        include: {
          customer: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              contact_no: true,
              isRecUpdate: true
            }
          },
          car: {
            select: {
              make: true,
              model: true,
              year: true
            }
          }
        }
      });

      return res.status(201).json({
        success: true,
        message: `You have been added to the waitlist. You are position #${nextPosition}. You will be notified when this car becomes available.`,
        waitlist_entry: waitlistEntry
      });
    }

    // Create full waitlist entry with booking details
    const waitlistEntry = await prisma.waitlist.create({
      data: {
        customer_id: parseInt(customerId),
        car_id: carId,
        requested_start_date: new Date(requested_start_date),
        requested_end_date: new Date(requested_end_date),
        purpose,
        pickup_time,
        dropoff_time,
        pickup_location,
        dropoff_location,
        delivery_type,
        is_self_drive: is_self_drive ?? true,
        selected_driver_id: selected_driver_id ? parseInt(selected_driver_id) : null,
        special_requests,
        total_cost,
        position: nextPosition,
        status: 'waiting',
        payment_status: 'Unpaid'
      },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            contact_no: true,
            isRecUpdate: true
          }
        },
        car: {
          select: {
            make: true,
            model: true,
            year: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `You have been added to the waitlist. You are position #${nextPosition}`,
      waitlist_entry: waitlistEntry
    });
  } catch (error) {
    console.error('Error joining waitlist:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
};

// @desc    Get available dates for a car (considering existing bookings)
// @route   GET /cars/:carId/available-dates
// @access  Public
export const getAvailableDates = async (req, res) => {
  try {
    const carId = parseInt(req.params.carId);
    const { start_date, end_date } = req.query;
    
    // Get car details
    const car = await prisma.car.findUnique({
      where: { car_id: carId }
    });
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // If car is in maintenance, return no available dates (except maintenance status)
    if (car.car_status?.toLowerCase().includes('maint')) {
      return res.json({
        car_status: car.car_status,
        available_dates: [],
        next_available_date: null,
        message: 'Car is currently under maintenance. No dates available.'
      });
    }

    // Get all confirmed bookings for this car
    const existingBookings = await prisma.booking.findMany({
      where: {
        car_id: carId,
        booking_status: { not: 'cancelled' },
        OR: [
          { booking_status: 'confirmed' },
          { booking_status: 'ongoing' },
          { booking_status: 'pending' }
        ]
      },
      select: {
        start_date: true,
        end_date: true,
        booking_status: true
      },
      orderBy: {
        start_date: 'asc'
      }
    });

    // Get paid waitlist entries that should block dates
    const paidWaitlistEntries = await prisma.waitlist.findMany({
      where: {
        car_id: carId,
        payment_status: 'Paid', // Capitalized for consistency
        status: { not: 'cancelled' }
      },
      select: {
        requested_start_date: true,
        requested_end_date: true,
        status: true,
        payment_status: true,
        paid_date: true
      },
      orderBy: {
        requested_start_date: 'asc'
      }
    });

    // Combine bookings and paid waitlist entries for date blocking
    const allBlockedRanges = [
      ...existingBookings.map(booking => ({
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        status: booking.booking_status,
        type: 'booking'
      })),
      ...paidWaitlistEntries.map(waitlist => ({
        start: new Date(waitlist.requested_start_date),
        end: new Date(waitlist.requested_end_date),
        status: waitlist.status,
        payment_status: waitlist.payment_status,
        type: 'paid_waitlist'
      }))
    ];

    // Sort all blocked ranges by start date
    allBlockedRanges.sort((a, b) => a.start - b.start);

    // If car is rented or has paid waitlist entries, find the earliest available date
    let nextAvailableDate = null;
    if (car.car_status?.toLowerCase().includes('rent') || allBlockedRanges.length > 0) {
      // Find the latest end date from all blocked ranges
      const latestEndDate = allBlockedRanges.reduce((latest, range) => {
        return range.end > latest ? range.end : latest;
      }, allBlockedRanges.length > 0 ? allBlockedRanges[0].end : new Date());
      
      // Add one day for maintenance after rental/reservation
      nextAvailableDate = new Date(latestEndDate);
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
    }

    res.json({
      car_status: car.car_status,
      existing_bookings: existingBookings.map(booking => ({
        start: new Date(booking.start_date),
        end: new Date(booking.end_date),
        status: booking.booking_status
      })),
      paid_waitlist_reservations: paidWaitlistEntries.map(waitlist => ({
        start: new Date(waitlist.requested_start_date),
        end: new Date(waitlist.requested_end_date),
        status: waitlist.status,
        payment_status: waitlist.payment_status,
        paid_date: waitlist.paid_date
      })),
      blocked_ranges: allBlockedRanges,
      next_available_date: nextAvailableDate,
      message: nextAvailableDate 
        ? `Car has reservations. Next available date: ${nextAvailableDate.toISOString().split('T')[0]}`
        : car.car_status === 'Available' 
          ? 'Car is available for booking'
          : `Car status: ${car.car_status}`
    });
  } catch (error) {
    console.error('Error getting available dates:', error);
    res.status(500).json({ error: 'Failed to get available dates' });
  }
};

// @desc    Remove customer from waitlist
// @route   DELETE /waitlist/:waitlistId
// @access  Private (Customer - own entries only)
export const leaveWaitlist = async (req, res) => {
  try {
    const waitlistId = parseInt(req.params.waitlistId);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    // Find the waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { waitlist_id: waitlistId }
    });

    if (!waitlistEntry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Check if customer owns this waitlist entry (or is admin)
    if (waitlistEntry.customer_id !== parseInt(customerId) && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'You can only remove your own waitlist entries' });
    }

    // Remove the entry
    await prisma.waitlist.delete({
      where: { waitlist_id: waitlistId }
    });

    // Reorder remaining positions
    await prisma.waitlist.updateMany({
      where: {
        car_id: waitlistEntry.car_id,
        position: { gt: waitlistEntry.position },
        status: 'waiting'
      },
      data: {
        position: { decrement: 1 }
      }
    });

    res.json({ 
      success: true, 
      message: 'Successfully removed from waitlist' 
    });
  } catch (error) {
    console.error('Error leaving waitlist:', error);
    res.status(500).json({ error: 'Failed to leave waitlist' });
  }
};

// @desc    Get customer's waitlist entries
// @route   GET /customers/me/waitlist
// @access  Private (Customer)
export const getMyWaitlistEntries = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    const waitlistEntries = await prisma.waitlist.findMany({
      where: {
        customer_id: parseInt(customerId),
        status: 'waiting'
      },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true,
            license_plate: true,
            car_status: true
          }
        }
      },
      orderBy: {
        date_created: 'desc'
      }
    });

    res.json(waitlistEntries);
  } catch (error) {
    console.error('Error fetching customer waitlist:', error);
    res.status(500).json({ error: 'Failed to fetch waitlist entries' });
  }
};

// @desc    Process payment for waitlist entry
// @route   POST /waitlist/:waitlistId/payment
// @access  Private (Customer - own entries only)
export const processWaitlistPayment = async (req, res) => {
  try {
    const waitlistId = parseInt(req.params.waitlistId);
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    const {
      payment_method,
      gcash_no,
      reference_no,
      amount
    } = req.body;

    // Find the waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { waitlist_id: waitlistId },
      include: {
        car: {
          select: {
            make: true,
            model: true,
            year: true
          }
        }
      }
    });

    if (!waitlistEntry) {
      return res.status(404).json({ error: 'Waitlist entry not found' });
    }

    // Check if customer owns this waitlist entry
    if (waitlistEntry.customer_id !== parseInt(customerId)) {
      return res.status(403).json({ error: 'You can only pay for your own waitlist entries' });
    }

    // Check if already paid
    if (waitlistEntry.payment_status === 'Paid') { // Capitalized for consistency
      return res.status(400).json({ error: 'Waitlist entry is already paid' });
    }

    // Validate payment amount
    if (amount !== waitlistEntry.total_cost) {
      return res.status(400).json({ 
        error: `Payment amount (₱${amount}) does not match total cost (₱${waitlistEntry.total_cost})` 
      });
    }

    // Start transaction to update waitlist and create payment record
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.payment.create({
        data: {
          waitlist_id: waitlistId,
          customer_id: parseInt(customerId),
          description: `Waitlist reservation for ${waitlistEntry.car.make} ${waitlistEntry.car.model} ${waitlistEntry.car.year}`,
          payment_method,
          gcash_no,
          reference_no,
          amount,
          paid_date: new Date(),
          balance: 0
        }
      });

      // Update waitlist entry payment status
      const updatedWaitlist = await tx.waitlist.update({
        where: { waitlist_id: waitlistId },
        data: {
          payment_status: 'Paid', // Capitalized for consistency
          paid_date: new Date()
        },
        include: {
          customer: {
            select: {
              first_name: true,
              last_name: true,
              email: true
            }
          },
          car: {
            select: {
              make: true,
              model: true,
              year: true
            }
          }
        }
      });

      return { payment, waitlist: updatedWaitlist };
    });

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully. Your dates are now reserved!',
      payment: result.payment,
      waitlist_entry: result.waitlist
    });
  } catch (error) {
    console.error('Error processing waitlist payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};