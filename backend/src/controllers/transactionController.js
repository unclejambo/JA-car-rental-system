import prisma from '../config/prisma.js';

// Shape transaction records for frontend DataGrid
function shapeTransaction(t) {
  const { booking, customer, car, ...rest } = t;
  return {
    transactionId: rest.transaction_id,
    bookingId: rest.booking_id,
    customerId: rest.customer_id,
    carId: rest.car_id,
    customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(' '),
    carModel: [car?.make, car?.model].filter(Boolean).join(' '),
    bookingDate: booking?.booking_date ? booking.booking_date.toISOString().split('T')[0] : null,
    completionDate: rest.completion_date ? rest.completion_date.toISOString().split('T')[0] : null,
    cancellationDate: rest.cancellation_date ? rest.cancellation_date.toISOString().split('T')[0] : null,
  };
}

export const getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        booking: { select: { booking_date: true } },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
      orderBy: { transaction_id: 'desc' },
    });

    res.json(transactions.map(shapeTransaction));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { booking_id, customer_id, car_id, completion_date, cancellation_date } = req.body;

    if (!booking_id || !customer_id || !car_id) {
      return res.status(400).json({ error: 'booking_id, customer_id and car_id are required' });
    }

    const created = await prisma.transaction.create({
      data: {
        booking_id: Number(booking_id),
        customer_id: Number(customer_id),
        car_id: Number(car_id),
        completion_date: completion_date ? new Date(completion_date) : null,
        cancellation_date: cancellation_date ? new Date(cancellation_date) : null,
      },
      include: {
        booking: { select: { booking_date: true } },
        customer: { select: { first_name: true, last_name: true } },
        car: { select: { make: true, model: true } },
      },
    });

    res.status(201).json(shapeTransaction(created));
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};
