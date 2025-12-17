import prisma from "../config/prisma.js";
import {
  getPaginationParams,
  getSortingParams,
  buildPaginationResponse,
  getSearchParam,
} from "../utils/pagination.js";

/**
 * Get all schedules with pagination (admin/general use)
 * @route GET /schedules?page=1&pageSize=10&sortBy=start_date&sortOrder=desc&status=Confirmed
 */
export const getSchedules = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, "start_date", "desc");
    const search = getSearchParam(req);

    // Build where clause for filtering
    const where = {
      // Filter to show only Confirmed and In Progress bookings
      // Exclude Pending, Completed, and Cancelled bookings
      booking_status: {
        in: ["Confirmed", "In Progress"],
      },
    };

    // Search filter (customer name or car model)
    if (search) {
      where.OR = [
        { customer: { first_name: { contains: search, mode: "insensitive" } } },
        { customer: { last_name: { contains: search, mode: "insensitive" } } },
        { car: { make: { contains: search, mode: "insensitive" } } },
        { car: { model: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Status filter (if provided, it will override the default filter)
    if (req.query.status) {
      where.booking_status = req.query.status;
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated schedules
    const schedules = await prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      select: {
        booking_id: true,
        customer_id: true,
        car_id: true,
        drivers_id: true,
        start_date: true,
        pickup_time: true,
        pickup_loc: true,
        end_date: true,
        dropoff_time: true,
        dropoff_loc: true,
        isSelfDriver: true,
        booking_status: true,
        payment_status: true,
        balance: true,
        customer: {
          select: { first_name: true, last_name: true, contact_no: true },
        },
        car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            hasGPS: true,
            license_plate: true,
          },
        },
        driver: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    const mapped = schedules.map((s) => ({
      booking_id: s.booking_id,
      customer_id: s.customer_id,
      car_id: s.car_id,
      drivers_id: s.drivers_id,
      customer_name: `${s.customer?.first_name ?? ""} ${
        s.customer?.last_name ?? ""
      }`.trim(),
      contact_no: s.customer?.contact_no || null,
      driver_name: `${s.driver?.first_name ?? ""} ${
        s.driver?.last_name ?? ""
      }`.trim(),
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      car_model: `${s.car?.make ?? ""}${
        s.car?.make && s.car?.model ? " " : ""
      }${s.car?.model ?? ""}`.trim(),
      plate_number: s.car?.license_plate || null,
      isSelfDriver: s.isSelfDriver,
      booking_status: s.booking_status,
      payment_status: s.payment_status,
      balance: s.balance,
      car: {
        car_id: s.car?.car_id,
        hasGPS: s.car?.hasGPS || false,
      },
      hasGPS: s.car?.hasGPS || false,
    }));

    res.json(buildPaginationResponse(mapped, total, page, pageSize));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schedules" });
  }
};

/**
 * Get schedules for a specific customer (admin)
 */
export const getSchedulesByCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    if (Number.isNaN(customerId))
      return res.status(400).json({ error: "Invalid customer ID" });

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
        booking_status: true,
        car: {
          select: { make: true, model: true },
        },
      },
      orderBy: { start_date: "desc" },
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
      car_model: `${s.car?.make ?? ""}${
        s.car?.make && s.car?.model ? " " : ""
      }${s.car?.model ?? ""}`.trim(),
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer schedules" });
  }
};

/**
 * Get schedules for the currently authenticated CUSTOMER with pagination
 * @route GET /schedules/my-schedules?page=1&pageSize=10&status=Confirmed
 */
export const getMySchedules = async (req, res) => {
  try {
    const customerId =
      req.user?.customer_id ??
      req.user?.customerId ??
      req.user?.id ??
      req.user?.sub ??
      req.user?.userId;

    if (!customerId) return res.status(401).json({ error: "Unauthorized" });

    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, "start_date", "desc");

    // Build where clause
    const where = { customer_id: Number(customerId) };

    // Status filter
    if (req.query.status) {
      where.booking_status = req.query.status;
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated schedules
    const schedules = await prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
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
          select: { make: true, model: true },
        },
      },
    });

    const mapped = schedules.map((s) => ({
      schedule_id: s.booking_id,
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      booking_status: s.booking_status,
      car_model: `${s.car?.make ?? ""}${
        s.car?.make && s.car?.model ? " " : ""
      }${s.car?.model ?? ""}`.trim(),
    }));

    res.json(buildPaginationResponse(mapped, total, page, pageSize));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer schedules" });
  }
};

/**
 * Get schedules for the currently authenticated DRIVER with pagination
 * @route GET /schedules/my-driver-schedules?page=1&pageSize=10&status=Confirmed
 */
export const getMyDriverSchedules = async (req, res) => {
  try {
    const driverId =
      req.user?.driver_id ??
      req.user?.drivers_id ??
      req.user?.id ??
      req.user?.sub ??
      req.user?.userId;

    if (!driverId) return res.status(401).json({ error: "Unauthorized" });

    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, "start_date", "desc");

    // Build where clause
    const where = { drivers_id: Number(driverId) };

    // Status filter
    if (req.query.status) {
      where.booking_status = req.query.status;
    }

    // Get total count
    const total = await prisma.booking.count({ where });

    // Get paginated schedules
    const schedules = await prisma.booking.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    // Map schedule data
    const mapped = schedules.map((s) => ({
      schedule_id: s.booking_id,
      booking_id: s.booking_id, // Include booking_id for notifications
      start_date: s.start_date,
      pickup_time: s.pickup_time,
      pickup_loc: s.pickup_loc,
      end_date: s.end_date,
      dropoff_time: s.dropoff_time,
      dropoff_loc: s.dropoff_loc,
      booking_status: s.booking_status,
      booking_date: s.booking_date, // Include for notification timestamp
      customer_name: s.customer
        ? `${s.customer.first_name ?? ""} ${s.customer.last_name ?? ""}`.trim()
        : "No Customer",
      car_model: s.car
        ? `${s.car.make ?? ""}${s.car.make && s.car.model ? " " : ""}${
            s.car.model ?? ""
          }`.trim()
        : "Unknown Car",
    }));

    res.json(buildPaginationResponse(mapped, total, page, pageSize));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch driver schedules" });
  }
};

/**
 * Get a specific schedule by ID
 */
export const getScheduleById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const schedule = await prisma.booking.findUnique({
      where: { booking_id: id },
    });
    if (!schedule) return res.status(404).json({ error: "Schedule not found" });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
};

/**
 * Create a new booking schedule
 */
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

    if (!customer_id || !car_id || !pickup_date || !return_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSchedule = await prisma.booking.create({
      data: {
        customer_id,
        car_id,
        pickup_date: new Date(pickup_date),
        return_date: new Date(return_date),
        status: status ?? "Confirmed",
        total_price,
        pickup_location,
        return_location,
        driver_required,
        notes,
      },
    });

    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(500).json({ error: "Failed to create schedule" });
  }
};

/**
 * Update a booking schedule
 */
export const updateSchedule = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = { ...req.body };

    if (updates.pickup_date)
      updates.pickup_date = new Date(updates.pickup_date);
    if (updates.return_date)
      updates.return_date = new Date(updates.return_date);

    const updated = await prisma.booking.update({
      where: { booking_id: id },
      data: updates,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update schedule" });
  }
};

/**
 * Delete a booking schedule
 */
export const deleteSchedule = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.booking.delete({ where: { booking_id: id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};
