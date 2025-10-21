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

    // Get paginated transactions
    const transactions = await prisma.transaction.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        booking: { select: { booking_date: true } },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    res.json(buildPaginationResponse(transactions.map(shapeTransaction), total, page, pageSize));
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
        booking: { select: { booking_date: true } },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
      orderBy: { transaction_id: "desc" },
    });

    res.json(transactions.map(shapeTransaction));
  } catch (error) {
    console.error("Error fetching customer transactions:", error);
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
        booking: { select: { booking_date: true } },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    res.status(201).json(shapeTransaction(created));
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};
