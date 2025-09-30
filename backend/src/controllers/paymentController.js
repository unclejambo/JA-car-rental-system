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
    runningBalance: rest.balance ?? null, // Include running balance
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

// Utility function to recalculate running balances for all payments of a booking
export const recalculatePaymentBalances = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: { 
        payments: { 
          orderBy: { payment_id: 'asc' } // Order by creation to maintain chronological sequence
        } 
      },
    });

    if (!booking) return;

    let runningTotal = 0;
    
    // Update each payment with the correct running balance
    for (const payment of booking.payments) {
      runningTotal += payment.amount || 0;
      const runningBalance = (booking.total_amount || 0) - runningTotal;
      
      await prisma.payment.update({
        where: { payment_id: payment.payment_id },
        data: { balance: runningBalance },
      });
    }
  } catch (error) {
    console.error('Error recalculating payment balances:', error);
  }
};

export const createPayment = async (req, res) => {
  try {
    const { booking_id, customer_id, description, payment_method, gcash_no, reference_no, amount, paid_date } = req.body;

    if (!booking_id || !customer_id || amount == null) {
      return res.status(400).json({ error: 'booking_id, customer_id and amount are required' });
    }

    // Get booking details to calculate running balance
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(booking_id) },
      include: { payments: { select: { amount: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Calculate current total paid (before this payment)
    const currentTotalPaid = booking.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate running balance after this payment
    const runningBalance = (booking.total_amount || 0) - currentTotalPaid - Number(amount);

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
        balance: runningBalance, // Store the running balance
      },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        booking: { select: { booking_id: true } },
      },
    });

    // Update the booking balance after payment creation
    const newTotalPaid = currentTotalPaid + Number(amount);
    const remainingBalance = (booking.total_amount || 0) - newTotalPaid;

    await prisma.booking.update({
      where: { booking_id: Number(booking_id) },
      data: { balance: remainingBalance },
    });

    res.status(201).json(shapePayment(created));
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};
