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
		const { booking_id, customer_id, refund_method, gcash_no, reference_no, refund_amount, refund_date } = req.body;

		if (!booking_id || !customer_id || refund_amount == null) {
			return res.status(400).json({ error: 'booking_id, customer_id and refund_amount are required' });
		}

		const created = await prisma.refund.create({
			data: {
				booking_id: Number(booking_id),
				customer_id: Number(customer_id),
				refund_method,
				gcash_no,
				reference_no,
				refund_amount: Number(refund_amount),
				refund_date: refund_date ? new Date(refund_date) : new Date(),
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


