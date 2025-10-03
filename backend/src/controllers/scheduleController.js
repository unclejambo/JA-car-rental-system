import prisma from '../config/prisma.js';

// Get all schedules (bookings)
export const getSchedules = async (req, res) => {
  try {
    const schedules = await prisma.booking.findMany({
      select: {
        booking_id: true,
        customer_id: true,
        drivers_id: true,
        start_date: true,
        pickup_time: true,
        pickup_loc: true,
        end_date: true,
        dropoff_time: true,
        dropoff_loc: true,
        isSelfDriver: true,
        booking_status: true,
        customer: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });

    // Normalize shape: merge customer first/last name into single customer_name field
    const mapped = schedules.map((s) => ({
      booking_id: s.booking_id,
      customer_id: s.customer_id,
      drivers_id: s.drivers_id,
      customer_name: `${s.customer?.first_name ?? ''} ${s.customer?.last_name ?? ''}`.trim(),
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      isSelfDriver: s.isSelfDriver,
      booking_status: s.booking_status,
      customer: {
        first_name: s.customer?.first_name,
        last_name: s.customer?.last_name,
      },
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Get schedules for a specific customer
export const getSchedulesByCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer id' });
    }

    const schedules = await prisma.booking.findMany({
      where: { customer_id: customerId },
      select: {
        booking_id: true,
        start_date: true,
        pickup_time: true,
        pickup_loc: true,
        end_date: true,
        dropoff_time: true,
        dropoff_loc: true,
        car: {
          select: {
            make: true,
            model: true,
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });

    const mapped = schedules.map((s) => ({
      booking_id: s.booking_id,
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      car_model: `${s.car?.make ?? ''}${s.car?.make && s.car?.model ? ' ' : ''}${s.car?.model ?? ''}`.trim(),
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching customer schedules:', error);
    res.status(500).json({ error: 'Failed to fetch customer schedules' });
  }
};

// New: get schedules for the currently authenticated customer
export const getMySchedules = async (req, res) => {
  try {
    // verifyToken sets req.user; adjust if your token uses a different claim
    const customerId =
      req.user?.customer_id ??
      req.user?.customerId ??
      req.user?.id ??
      req.user?.sub ??
      req.user?.userId;

    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const schedules = await prisma.booking.findMany({
      where: { customer_id: Number(customerId) },
      select: {
        booking_id: true,
        start_date: true,
        pickup_time: true,
        pickup_loc: true,
        end_date: true,
        dropoff_time: true,
        dropoff_loc: true,
        booking_status: true,
        car: {
          select: {
            make: true,
            model: true,
          },
        },
      },
      orderBy: { start_date: 'desc' },
    });

    const mapped = schedules.map((s) => ({
      booking_id: s.booking_id,
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      booking_status: s.booking_status,
      car_model: `${s.car?.make ?? ''}${s.car?.make && s.car?.model ? ' ' : ''}${s.car?.model ?? ''}`.trim(),
    }));

    res.json(mapped);
  } catch (error) {
    console.error('Error fetching my schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
};

// Get a schedule (booking) by ID
export const getScheduleById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const schedule = await prisma.booking.findUnique({ where: { booking_id: id } });
    if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
};

// Create a new schedule (booking)
export const createSchedule = async (req, res) => {
  try {
    const {
      customer_id,
      car_id,
      pickup_date,
      return_date,
      status,
      total_price,
      pickup_location,
      return_location,
      driver_required,
      notes,
    } = req.body;

    // Basic validation (adjust fields based on your prisma schema)
    if (!customer_id || !car_id || !pickup_date || !return_date) {
      return res.status(400).json({ error: 'customer_id, car_id, pickup_date and return_date are required' });
    }

    const newSchedule = await prisma.booking.create({
      data: {
        customer_id,
        car_id,
        pickup_date: new Date(pickup_date),
        return_date: new Date(return_date),
        status: status ?? 'Confirmed',
        total_price,
        pickup_location,
        return_location,
        driver_required,
        notes,
      },
    });

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ error: 'Failed to create schedule' });
  }
};

// Update a schedule (booking)
export const updateSchedule = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = { ...req.body };

    // If dates are present, convert to Date objects
    if (updates.pickup_date) updates.pickup_date = new Date(updates.pickup_date);
    if (updates.return_date) updates.return_date = new Date(updates.return_date);

    const updated = await prisma.booking.update({
      where: { booking_id: id },
      data: updates,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// Delete a schedule (booking)
export const deleteSchedule = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.booking.delete({ where: { booking_id: id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};