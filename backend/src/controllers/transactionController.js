import prisma from "../config/prisma.js";
import { getPaginationParams, getSortingParams, buildPaginationResponse, getSearchParam } from '../utils/pagination.js';

// Shape transaction records for frontend DataGrid
function shapeTransaction(t) {
  const { booking, customer, car, ...rest } = t;
  return {
    transactionId: rest.transaction_id,
    bookingId: rest.booking_id,
    customerId: rest.customer_id,
    carId: rest.car_id,
    customerName: [customer?.first_name, customer?.last_name]
      .filter(Boolean)
      .join(" "),
    carModel: [car?.make, car?.model].filter(Boolean).join(" "),
    bookingDate: booking?.booking_date
      ? booking.booking_date.toISOString().split("T")[0]
      : null,
    startDate: booking?.start_date
      ? booking.start_date.toISOString().split("T")[0]
      : null,
    endDate: booking?.end_date
      ? booking.end_date.toISOString().split("T")[0]
      : null,
    isSelfDriver: booking?.isSelfDriver === true,
    driverName: booking?.driver
      ? [booking.driver.first_name, booking.driver.last_name]
          .filter(Boolean)
          .join(" ")
      : null,
    completionDate: rest.completion_date
      ? rest.completion_date.toISOString().split("T")[0]
      : null,
    cancellationDate: rest.cancellation_date
      ? rest.cancellation_date.toISOString().split("T")[0]
      : null,
  };
}

// @desc    Get all transactions with pagination (Admin)
// @route   GET /transactions?page=1&pageSize=10&sortBy=transaction_id&sortOrder=desc&search=john
// @access  Private/Admin
export const getTransactions = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, 'transaction_id', 'desc');
    const search = getSearchParam(req);

    // Build where clause
    const where = {};

    // Search filter (customer name or car model)
    if (search) {
      where.OR = [
        { customer: { first_name: { contains: search, mode: 'insensitive' } } },
        { customer: { last_name: { contains: search, mode: 'insensitive' } } },
        { car: { make: { contains: search, mode: 'insensitive' } } },
        { car: { model: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get all transactions (no pagination limits)
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        booking: {
          select: {
            booking_date: true,
            start_date: true,
            end_date: true,
            isSelfDriver: true,
            driver: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    // Return all transactions with pagination structure maintained
    res.json(buildPaginationResponse(transactions.map(shapeTransaction), total, 1, total));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// Get customer's own transactions
export const getMyTransactions = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    const transactions = await prisma.transaction.findMany({
      where: { customer_id: parseInt(customerId) },
      include: {
        booking: {
          select: {
            booking_date: true,
            start_date: true,
            end_date: true,
            isSelfDriver: true,
            driver: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
      orderBy: { transaction_id: "desc" },
    });

    res.json(transactions.map(shapeTransaction));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const {
      booking_id,
      customer_id,
      car_id,
      completion_date,
      cancellation_date,
    } = req.body;

    if (!booking_id || !customer_id || !car_id) {
      return res
        .status(400)
        .json({ error: "booking_id, customer_id and car_id are required" });
    }

    const created = await prisma.transaction.create({
      data: {
        booking_id: Number(booking_id),
        customer_id: Number(customer_id),
        car_id: Number(car_id),
        completion_date: completion_date ? new Date(completion_date) : null,
        cancellation_date: cancellation_date
          ? new Date(cancellation_date)
          : null,
      },
      include: {
        booking: {
          select: {
            booking_date: true,
            start_date: true,
            end_date: true,
            isSelfDriver: true,
            driver: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    res.status(201).json(shapeTransaction(created));
  } catch (error) {
    res.status(500).json({ error: "Failed to create transaction" });
  }
};
