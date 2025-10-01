import prisma from "../config/prisma.js";

function shapePayment(p) {
  const { booking, customer, ...rest } = p;
  return {
    transactionId: rest.payment_id, // unify row id key for DataGrid
    paymentId: rest.payment_id,
    bookingId: rest.booking_id,
    customerId: rest.customer_id,
    customerName: [customer?.first_name, customer?.last_name]
      .filter(Boolean)
      .join(" "),
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
      orderBy: { payment_id: "desc" },
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
    const {
      booking_id,
      customer_id,
      description,
      payment_method,
      gcash_no,
      reference_no,
      amount,
      paid_date,
    } = req.body;

    if (!booking_id || !customer_id || amount == null) {
      return res.status(400).json({ error: 'booking_id, customer_id and amount are required' });
    }

    // First, get the booking and current payments to calculate running balance
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(booking_id) },
      include: { 
        payments: { 
          select: { amount: true },
          orderBy: { payment_id: 'asc' } 
        } 
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const currentTotalPaid = booking.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const runningBalance = (booking.total_amount || 0) - (currentTotalPaid + Number(amount));

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
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
};

// @desc    Process payment for customer's booking
// @route   POST /payments/process-booking-payment
// @access  Private (Customer)
export const processBookingPayment = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    const {
      booking_id,
      payment_method,
      gcash_no,
      reference_no,
      amount
    } = req.body;

    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({ 
        error: 'booking_id, amount, and payment_method are required' 
      });
    }

    // Verify booking ownership
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(booking_id) },
      include: {
        car: { select: { make: true, model: true, year: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.customer_id !== parseInt(customerId)) {
      return res.status(403).json({ error: 'You can only pay for your own bookings' });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        booking_id: parseInt(booking_id),
        customer_id: parseInt(customerId),
        description: `Payment for ${booking.car.make} ${booking.car.model} ${booking.car.year}`,
        payment_method,
        gcash_no,
        reference_no,
        amount: parseInt(amount),
        paid_date: new Date(),
        balance: Math.max(0, (booking.total_amount || 0) - parseInt(amount))
      },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        booking: { 
          select: { 
            booking_id: true,
            total_amount: true 
          } 
        }
      }
    });

    // Update booking payment status if fully paid
    if (payment.balance === 0) {
      await prisma.booking.update({
        where: { booking_id: parseInt(booking_id) },
        data: { 
          payment_status: 'paid',
          isPay: true
        }
      });
    } else {
      await prisma.booking.update({
        where: { booking_id: parseInt(booking_id) },
        data: { payment_status: 'partial' }
      });
    }

    res.status(201).json({
      success: true,
      message: payment.balance === 0 
        ? 'Payment completed successfully!' 
        : `Partial payment received. Remaining balance: ₱${payment.balance.toLocaleString()}`,
      payment: shapePayment(payment),
      remaining_balance: payment.balance
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
};

// @desc    Get customer's payment history
// @route   GET /payments/my-payments
// @access  Private (Customer)
export const getMyPayments = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;
    
    if (!customerId) {
      return res.status(401).json({ error: 'Customer authentication required' });
    }

    const payments = await prisma.payment.findMany({
      where: { customer_id: parseInt(customerId) },
      include: {
        booking: {
          select: {
            booking_id: true,
            start_date: true,
            end_date: true,
            total_amount: true,
            car: {
              select: {
                make: true,
                model: true,
                year: true,
                license_plate: true
              }
            }
          }
        },
        waitlist: {
          select: {
            waitlist_id: true,
            requested_start_date: true,
            requested_end_date: true,
            total_cost: true,
            car: {
              select: {
                make: true,
                model: true,
                year: true,
                license_plate: true
              }
            }
          }
        }
      },
      orderBy: { paid_date: 'desc' }
    });

    const shapedPayments = payments.map(payment => ({
      payment_id: payment.payment_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      gcash_no: payment.gcash_no,
      reference_no: payment.reference_no,
      paid_date: payment.paid_date,
      balance: payment.balance,
      description: payment.description,
      booking_info: payment.booking ? {
        booking_id: payment.booking.booking_id,
        dates: `${payment.booking.start_date?.toISOString().split('T')[0]} to ${payment.booking.end_date?.toISOString().split('T')[0]}`,
        car_details: payment.booking.car,
        total_amount: payment.booking.total_amount,
        type: 'booking'
      } : null,
      waitlist_info: payment.waitlist ? {
        waitlist_id: payment.waitlist.waitlist_id,
        dates: `${payment.waitlist.requested_start_date?.toISOString().split('T')[0]} to ${payment.waitlist.requested_end_date?.toISOString().split('T')[0]}`,
        car_details: payment.waitlist.car,
        total_cost: payment.waitlist.total_cost,
        type: 'waitlist'
      } : null
    }));

    res.json(shapedPayments);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
};
