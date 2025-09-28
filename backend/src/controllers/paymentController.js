import prisma from '../config/prisma.js';

function shapePayment(p) {
  const { booking, customer, ...rest } = p;
  return {
    transactionId: rest.payment_id, // unify row id key for DataGrid
    paymentId: rest.payment_id,
    bookingId: rest.booking_id,
    customerId: rest.customer_id,
    customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(' '),
    description: rest.description || null,
    paymentMethod: rest.payment_method || null,
    gCashNo: rest.gcash_no || null,
    referenceNo: rest.reference_no || null,
    totalAmount: rest.amount ?? null,
    paidDate: rest.paid_date ? rest.paid_date.toISOString().split('T')[0] : null,
  };
}

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        customer: { select: { first_name: true, last_name: true } },
        booking: { select: { booking_id: true } },
      },
      orderBy: { payment_id: 'desc' },
    });
    res.json(payments.map(shapePayment));
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const { booking_id, customer_id, description, payment_method, gcash_no, reference_no, amount, paid_date } = req.body;

    if (!booking_id || !customer_id || amount == null) {
      return res.status(400).json({ error: 'booking_id, customer_id and amount are required' });
    }

    const created = await prisma.payment.create({
      data: {
        booking_id: Number(booking_id),
        customer_id: Number(customer_id),
        description,
        payment_method,
        gcash_no,
        reference_no,
        amount: Number(amount),
        paid_date: paid_date ? new Date(paid_date) : new Date(),
      },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        booking: { select: { booking_id: true } },
      },
    });

    res.status(201).json(shapePayment(created));
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};
