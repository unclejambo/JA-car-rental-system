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
    paidDate: rest.paid_date
      ? rest.paid_date.toISOString().split("T")[0]
      : null,
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
    console.error("Error fetching payments:", error);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

// Utility function to recalculate running balances for all payments of a booking
export const recalculatePaymentBalances = async (bookingId) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        payments: {
          orderBy: { payment_id: "asc" }, // Order by creation to maintain chronological sequence
        },
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
    console.error("Error recalculating payment balances:", error);
  }
};

// Utility function to determine appropriate booking status based on payments
const determineBookingStatus = (totalPaid, totalAmount, currentStatus) => {
  if (totalPaid <= 0) {
    // No payments made - should be pending
    return 'pending';
  } else if (totalPaid >= totalAmount) {
    // Fully paid - should be confirmed or maintain current status if already progressed
    return ['Confirmed', 'In Progress', 'Completed', 'Returned'].includes(currentStatus?.toLowerCase()) 
      ? currentStatus 
      : 'Confirmed';
  } else {
    // Partially paid - should be confirmed
    return 'Confirmed';
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
      update_status
    } = req.body;

    if (!booking_id || !customer_id || amount == null) {
      return res
        .status(400)
        .json({ error: "booking_id, customer_id and amount are required" });
    }

    // First, get the booking and current payments to calculate running balance
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(booking_id) },
      include: {
        payments: {
          select: { amount: true },
          orderBy: { payment_id: "asc" },
        },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const currentTotalPaid =
      booking.payments?.reduce(
        (sum, payment) => sum + (payment.amount || 0),
        0
      ) || 0;
    const runningBalance =
      (booking.total_amount || 0) - (currentTotalPaid + Number(amount));

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

    // Determine appropriate booking status
    const newBookingStatus = determineBookingStatus(newTotalPaid, booking.total_amount, booking.booking_status);
    
    // Prepare booking update data
    const bookingUpdateData = { 
      balance: remainingBalance,
      payment_status: remainingBalance <= 0 ? 'Paid' : 'Unpaid'
    };
    
    // Update booking status based on payment state or explicit flag
    if (update_status || newBookingStatus !== booking.booking_status) {
      bookingUpdateData.booking_status = newBookingStatus;
    }

    await prisma.booking.update({
      where: { booking_id: Number(booking_id) },
      data: bookingUpdateData,
    });

    res.status(201).json(shapePayment(created));
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({ error: "Failed to create payment" });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    // First, get the payment details to know which booking to update
    const payment = await prisma.payment.findUnique({
      where: { payment_id: paymentId },
      include: {
        booking: {
          include: {
            payments: { select: { amount: true, payment_id: true } }
          }
        }
      },
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const booking = payment.booking;
    if (!booking) {
      return res.status(404).json({ error: 'Associated booking not found' });
    }

    // Calculate total paid after removing this payment
    const totalPaidAfterDeletion = booking.payments
      .filter(p => p.payment_id !== paymentId)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calculate new balance
    const newBalance = (booking.total_amount || 0) - totalPaidAfterDeletion;
    
    // Determine new booking status based on remaining payments
    const newBookingStatus = determineBookingStatus(
      totalPaidAfterDeletion, 
      booking.total_amount, 
      booking.booking_status
    );
    
    // Delete the payment
    await prisma.payment.delete({
      where: { payment_id: paymentId },
    });

    // Update booking with new balance and status
    await prisma.booking.update({
      where: { booking_id: booking.booking_id },
      data: {
        balance: newBalance,
        payment_status: newBalance <= 0 ? 'Paid' : 'Unpaid',
        booking_status: newBookingStatus,
      },
    });

    // Recalculate balances for remaining payments
    await recalculatePaymentBalances(booking.booking_id);

    res.status(200).json({
      message: 'Payment deleted successfully',
      booking_update: {
        booking_id: booking.booking_id,
        new_balance: newBalance,
        new_payment_status: newBalance <= 0 ? 'Paid' : 'Unpaid',
        new_booking_status: newBookingStatus,
        total_paid: totalPaidAfterDeletion,
      },
    });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

// Delete payment by booking ID (latest payment)
export const deletePaymentByBookingId = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.bookingId);
    
    // Get the booking with all its payments
    const booking = await prisma.booking.findUnique({
      where: { booking_id: bookingId },
      include: {
        payments: {
          orderBy: { paid_date: 'desc' } // Get latest payment first
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (!booking.payments || booking.payments.length === 0) {
      return res.status(404).json({ error: 'No payments found for this booking' });
    }

    // Get the latest payment
    const latestPayment = booking.payments[0];

    console.log('Deleting payment:', {
      bookingId,
      paymentId: latestPayment.payment_id,
      amount: latestPayment.amount
    });

    // Calculate total paid after removing this payment
    const totalPaidAfterDeletion = booking.payments
      .filter(p => p.payment_id !== latestPayment.payment_id)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    // Calculate new balance
    const newBalance = (booking.total_amount || 0) - totalPaidAfterDeletion;
    
    // Determine new booking status based on remaining payments
    const newBookingStatus = determineBookingStatus(
      totalPaidAfterDeletion, 
      booking.total_amount, 
      booking.booking_status
    );
    
    // Delete the payment
    await prisma.payment.delete({
      where: { payment_id: latestPayment.payment_id },
    });

    // Update booking with new balance and payment status
    // Note: isPay is already set to false by the updateIsPayStatus call from frontend
    await prisma.booking.update({
      where: { booking_id: bookingId },
      data: {
        balance: newBalance,
        payment_status: newBalance <= 0 ? 'Paid' : 'Unpaid',
        booking_status: newBookingStatus,
      },
    });

    // Recalculate balances for remaining payments
    await recalculatePaymentBalances(bookingId);

    console.log('Payment deleted successfully:', {
      bookingId,
      deletedPaymentId: latestPayment.payment_id,
      newBalance,
      newPaymentStatus: newBalance <= 0 ? 'Paid' : 'Unpaid',
      newBookingStatus
    });

    res.status(200).json({
      message: 'Payment deleted successfully',
      deleted_payment: latestPayment,
      booking_update: {
        booking_id: bookingId,
        new_balance: newBalance,
        new_payment_status: newBalance <= 0 ? 'Paid' : 'Unpaid',
        new_booking_status: newBookingStatus,
        total_paid: totalPaidAfterDeletion,
      },
    });
  } catch (error) {
    console.error('Error deleting payment by booking ID:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

// Utility function to fix all booking status inconsistencies
export const fixAllBookingStatusInconsistencies = async (req, res) => {
  try {
    console.log('🔄 Starting booking status consistency check...');
    
    // Get all bookings with their payments
    const bookings = await prisma.booking.findMany({
      include: {
        payments: { select: { amount: true } }
      }
    });
    
    let updatedCount = 0;
    const results = [];
    
    for (const booking of bookings) {
      const totalPaid = booking.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
      const newBalance = (booking.total_amount || 0) - totalPaid;
      
      // Determine correct status based on actual payments
      const correctBookingStatus = determineBookingStatus(
        totalPaid, 
        booking.total_amount, 
        booking.booking_status
      );
      const correctPaymentStatus = newBalance <= 0 ? 'Paid' : 'Unpaid';
      
      // Check if update is needed
      const needsUpdate = (
        booking.booking_status !== correctBookingStatus ||
        booking.payment_status !== correctPaymentStatus ||
        booking.balance !== newBalance
      );
      
      if (needsUpdate) {
        await prisma.booking.update({
          where: { booking_id: booking.booking_id },
          data: {
            booking_status: correctBookingStatus,
            payment_status: correctPaymentStatus,
            balance: newBalance,
          },
        });
        
        updatedCount++;
        results.push({
          booking_id: booking.booking_id,
          old_status: booking.booking_status,
          new_status: correctBookingStatus,
          old_payment_status: booking.payment_status,
          new_payment_status: correctPaymentStatus,
          old_balance: booking.balance,
          new_balance: newBalance,
          total_paid: totalPaid,
          total_amount: booking.total_amount,
        });
      }
    }
    
    console.log(`✅ Fixed ${updatedCount} booking status inconsistencies`);
    
    res.status(200).json({
      message: `Fixed ${updatedCount} booking status inconsistencies`,
      updated_count: updatedCount,
      total_bookings_checked: bookings.length,
      updates: results,
    });
  } catch (error) {
    console.error('Error fixing booking status inconsistencies:', error);
    res.status(500).json({ error: 'Failed to fix booking status inconsistencies' });
  }
};

// @desc    Process payment for customer's booking
// @route   POST /payments/process-booking-payment
// @access  Private (Customer)
export const processBookingPayment = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
    }

    const { booking_id, payment_method, gcash_no, reference_no, amount } =
      req.body;

    if (!booking_id || !amount || !payment_method) {
      return res.status(400).json({
        error: "booking_id, amount, and payment_method are required",
      });
    }

    // Verify booking ownership
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(booking_id) },
      include: {
        car: { select: { make: true, model: true, year: true } },
      },
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.customer_id !== parseInt(customerId)) {
      return res
        .status(403)
        .json({ error: "You can only pay for your own bookings" });
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
        balance: Math.max(0, (booking.total_amount || 0) - parseInt(amount)),
      },
      include: {
        customer: { select: { first_name: true, last_name: true } },
        booking: {
          select: {
            booking_id: true,
            total_amount: true,
          },
        },
      },
    });

    // Update booking payment status if fully paid
    if (payment.balance === 0) {
      await prisma.booking.update({
        where: { booking_id: parseInt(booking_id) },
        data: {
          payment_status: "paid",
          isPay: true,
        },
      });
    } else {
      await prisma.booking.update({
        where: { booking_id: parseInt(booking_id) },
        data: { payment_status: "partial" },
      });
    }

    res.status(201).json({
      success: true,
      message:
        payment.balance === 0
          ? "Payment completed successfully!"
          : `Partial payment received. Remaining balance: ₱${payment.balance.toLocaleString()}`,
      payment: shapePayment(payment),
      remaining_balance: payment.balance,
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

// @desc    Get customer's payment history
// @route   GET /payments/my-payments
// @access  Private (Customer)
export const getMyPayments = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res
        .status(401)
        .json({ error: "Customer authentication required" });
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
                license_plate: true,
              },
            },
          },
        },
        Waitlist: {
          select: {
            waitlist_id: true,
            requested_start_date: true,
            requested_end_date: true,
            total_cost: true,
            Car: {
              select: {
                make: true,
                model: true,
                year: true,
                license_plate: true,
              },
            },
          },
        },
      },
      orderBy: { paid_date: "desc" },
    });

    const shapedPayments = payments.map((payment) => ({
      payment_id: payment.payment_id,
      amount: payment.amount,
      payment_method: payment.payment_method,
      gcash_no: payment.gcash_no,
      reference_no: payment.reference_no,
      paid_date: payment.paid_date,
      balance: payment.balance,
      description: payment.description,
      booking_info: payment.booking
        ? {
            booking_id: payment.booking.booking_id,
            dates: `${
              payment.booking.start_date?.toISOString().split("T")[0]
            } to ${payment.booking.end_date?.toISOString().split("T")[0]}`,
            car_details: payment.booking.car,
            total_amount: payment.booking.total_amount,
            type: "booking",
          }
        : null,
      waitlist_info: payment.waitlist
        ? {
            waitlist_id: payment.waitlist.waitlist_id,
            dates: `${
              payment.waitlist.requested_start_date?.toISOString().split("T")[0]
            } to ${
              payment.waitlist.requested_end_date?.toISOString().split("T")[0]
            }`,
            car_details: payment.waitlist.car,
            total_cost: payment.waitlist.total_cost,
            type: "waitlist",
          }
        : null,
    }));

    res.json(shapedPayments);
  } catch (error) {
    console.error("Error fetching customer payments:", error);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
};
