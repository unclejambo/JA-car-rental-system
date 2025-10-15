import prisma from '../config/prisma.js';

function shapeRefund(r) {
	const { booking, customer, ...rest } = r;
	return {
		transactionId: rest.refund_id, // unify for DataGrid
		refundId: rest.refund_id,
		bookingId: rest.booking_id,
		customerId: rest.customer_id,
		customerName: [customer?.first_name, customer?.last_name].filter(Boolean).join(' '),
		refundMethod: rest.refund_method || null,
		gCashNo: rest.gcash_no || null,
		referenceNo: rest.reference_no || null,
		refundAmount: rest.refund_amount ?? null,
		refundDate: rest.refund_date ? rest.refund_date.toISOString().split('T')[0] : null,
		description: rest.description || null,
	};
}

export const getRefunds = async (req, res) => {
	try {
		const refunds = await prisma.refund.findMany({
			include: {
				customer: { select: { first_name: true, last_name: true } },
				booking: { select: { booking_id: true } },
			},
			orderBy: { refund_id: 'desc' },
		});
		res.json(refunds.map(shapeRefund));
	} catch (error) {
		console.error('Error fetching refunds:', error);
		res.status(500).json({ error: 'Failed to fetch refunds' });
	}
};

export const createRefund = async (req, res) => {
	try {
		const { booking_id, customer_id, refund_method, gcash_no, reference_no, refund_amount, refund_date, description } = req.body;

		if (!booking_id || !customer_id || refund_amount == null) {
			return res.status(400).json({ error: 'booking_id, customer_id and refund_amount are required' });
		}

		// Get the booking with payments and existing refunds
		const booking = await prisma.booking.findUnique({
			where: { booking_id: Number(booking_id) },
			include: {
				payments: {
					select: { amount: true },
				},
				refunds: {
					select: { refund_amount: true },
				},
			},
		});

		if (!booking) {
			return res.status(404).json({ error: 'Booking not found' });
		}

		// Check if booking has paid status
		if (booking.payment_status !== 'Paid') {
			return res.status(400).json({
				error: 'Refund can only be issued for paid bookings',
				details: {
					currentPaymentStatus: booking.payment_status
				}
			});
		}

		// Calculate total paid and total refunded
		const totalPaid = booking.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
		const totalRefunded = booking.refunds?.reduce((sum, refund) => sum + (refund.refund_amount || 0), 0) || 0;
		const availableForRefund = totalPaid - totalRefunded;
		const refundAmountNum = Number(refund_amount);

		// Special handling for security deposit fee
		const isSecurityDeposit = description && description.toLowerCase().includes('security deposit');

		if (!isSecurityDeposit) {
			// For regular refunds, validate against available amount
			if (refundAmountNum > availableForRefund) {
				return res.status(400).json({
					error: 'Refund amount exceeds available refund balance',
					details: {
						totalPaid: totalPaid,
						totalRefunded: totalRefunded,
						availableForRefund: availableForRefund,
						attemptedRefund: refundAmountNum
					}
				});
			}
		} else {
			// For security deposit refund, deduct from booking total_amount
			await prisma.booking.update({
				where: { booking_id: Number(booking_id) },
				data: {
					total_amount: booking.total_amount - refundAmountNum
				}
			});
		}

		const created = await prisma.refund.create({
			data: {
				booking_id: Number(booking_id),
				customer_id: Number(customer_id),
				refund_method,
				gcash_no,
				reference_no,
				refund_amount: refundAmountNum,
				refund_date: refund_date ? new Date(refund_date) : new Date(),
				description,
			},
			include: {
				customer: { select: { first_name: true, last_name: true } },
				booking: { select: { booking_id: true } },
			},
		});

		res.status(201).json(shapeRefund(created));
	} catch (error) {
		console.error('Error creating refund:', error);
		res.status(500).json({ error: 'Failed to create refund' });
	}
};


