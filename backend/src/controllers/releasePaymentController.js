import prisma from '../config/prisma.js';

export const createReleasePayment = async (req, res) => {
  try {
    console.log('--- CREATE RELEASE PAYMENT REQUEST ---');
    console.log('Request body:', req.body);
    
    const { 
      booking_id, 
      customer_id, 
      amount, 
      payment_method, 
      gcash_no, 
      reference_no 
    } = req.body;

    if (!booking_id || !customer_id || amount == null) {
      console.log('Missing required fields:', { booking_id, customer_id, amount });
      return res.status(400).json({ 
        error: 'booking_id, customer_id, and amount are required' 
      });
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(booking_id) },
      include: { 
        payments: { select: { amount: true } },
        customer: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Calculate current total paid (before this payment)
    const currentTotalPaid = booking.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Calculate running balance after this payment
    const paymentAmount = Number(amount);
    const newTotalPaid = currentTotalPaid + paymentAmount;
    const remainingBalance = (booking.total_amount || 0) - newTotalPaid;

    // Create payment record with "Release Payment" description
    const payment = await prisma.payment.create({
      data: {
        booking_id: Number(booking_id),
        customer_id: Number(customer_id),
        description: 'Release Payment',
        payment_method: payment_method || 'Cash',
        gcash_no: payment_method === 'GCash' ? gcash_no : null,
        reference_no: payment_method === 'GCash' ? reference_no : null,
        amount: paymentAmount,
        paid_date: new Date(),
        balance: remainingBalance
      },
      include: {
        customer: { 
          select: { 
            first_name: true, 
            last_name: true 
          } 
        },
        booking: { 
          select: { 
            booking_id: true 
          } 
        }
      }
    });

    // Determine payment status based on remaining balance
    const paymentStatus = remainingBalance <= 0 ? 'Paid' : 'Unpaid';

    // Update booking with new balance and payment status
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: Number(booking_id) },
      data: { 
        balance: remainingBalance,
        payment_status: paymentStatus,
        // Change booking status from 'Confirmed' to 'In Progress' after successful payment
        booking_status: 'In Progress'
      }
    });

    // Format response
    const response = {
      success: true,
      message: 'Release payment processed successfully',
      payment: {
        payment_id: payment.payment_id,
        booking_id: payment.booking_id,
        customer_id: payment.customer_id,
        customer_name: `${payment.customer.first_name} ${payment.customer.last_name}`,
        description: payment.description,
        payment_method: payment.payment_method,
        gcash_no: payment.gcash_no,
        reference_no: payment.reference_no,
        amount: payment.amount,
        balance: payment.balance,
        paid_date: payment.paid_date
      },
      booking_status: {
        previous_status: booking.booking_status,
        new_status: updatedBooking.booking_status,
        payment_status: updatedBooking.payment_status,
        remaining_balance: remainingBalance,
        total_amount: booking.total_amount,
        total_paid: newTotalPaid
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating release payment:', error);
    res.status(500).json({ 
      error: 'Failed to create release payment',
      details: error.message 
    });
  }
};

export const getReleasePayments = async (req, res) => {
  try {
    const { booking_id } = req.query;

    let whereClause = {
      description: 'Release Payment'
    };

    if (booking_id) {
      whereClause.booking_id = Number(booking_id);
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        customer: { 
          select: { 
            first_name: true, 
            last_name: true 
          } 
        },
        booking: { 
          select: { 
            booking_id: true,
            booking_status: true,
            payment_status: true,
            total_amount: true,
            balance: true
          } 
        }
      },
      orderBy: { payment_id: 'desc' }
    });

    const formattedPayments = payments.map(payment => ({
      payment_id: payment.payment_id,
      booking_id: payment.booking_id,
      customer_id: payment.customer_id,
      customer_name: `${payment.customer.first_name} ${payment.customer.last_name}`,
      description: payment.description,
      payment_method: payment.payment_method,
      gcash_no: payment.gcash_no,
      reference_no: payment.reference_no,
      amount: payment.amount,
      balance: payment.balance,
      paid_date: payment.paid_date,
      booking_status: payment.booking.booking_status,
      payment_status: payment.booking.payment_status,
      total_amount: payment.booking.total_amount
    }));

    res.json({
      success: true,
      payments: formattedPayments
    });

  } catch (error) {
    console.error('Error fetching release payments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch release payments',
      details: error.message 
    });
  }
};
