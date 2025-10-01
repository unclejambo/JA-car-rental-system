import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// @desc    Get all drivers
// @route   GET /drivers
// @access  Public (adjust later if auth needed)
export const getDrivers = async (_req, res) => {
	try {
		const drivers = await prisma.driver.findMany({
			include: { driver_license: true },
		});
		// map to plain object with expected frontend fields
		const sanitized = drivers.map((d) => ({
			...d,
			driver_id: d.drivers_id, // Frontend expects driver_id
			id: d.drivers_id, // DataGrid convenience if reused
			license_number: d.driver_license_no, // Frontend expects license_number
			rating: 4.5, // Default rating since not in schema yet
			password: undefined,
			restriction: d.driver_license?.restrictions || null,
			expiryDate: d.driver_license?.expiry_date || null,
		}));
		res.json(sanitized);
	} catch (error) {
		console.error('Error fetching drivers:', error);
		res.status(500).json({ error: 'Failed to fetch drivers' });
	}
};

// @desc    Get driver by ID
// @route   GET /drivers/:id
// @access  Public
export const getDriverById = async (req, res) => {
	try {
		const id = Number(req.params.id);
		const driver = await prisma.driver.findUnique({
			where: { drivers_id: id },
			include: { driver_license: true },
		});
		if (!driver) return res.status(404).json({ error: 'Driver not found' });
		const { password, ...rest } = driver;
		res.json(rest);
	} catch (error) {
		console.error('Error fetching driver:', error);
		res.status(500).json({ error: 'Failed to fetch driver' });
	}
};

// @desc    Create driver (and driver license if not exists)
// @route   POST /drivers
// @access  Private/Admin
export const createDriver = async (req, res) => {
	try {
		const {
			first_name,
			last_name,
			address,
			contact_no,
			email,
			username,
			password,
			driver_license_no,
			restriction, // optional: restrictions for license
			expiry_date, // ISO string/date for license
			status,
		} = req.body;

		if (!first_name || !last_name || !email || !username || !password || !driver_license_no) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		// ensure unique email/username across driver table
		const existing = await prisma.driver.findFirst({
			where: { OR: [{ email }, { username }] },
		});
		if (existing) return res.status(409).json({ error: 'Driver already exists' });

		// create or upsert driver license
		await prisma.driverLicense.upsert({
			where: { driver_license_no },
			update: {
				restrictions: restriction || undefined,
				expiry_date: expiry_date ? new Date(expiry_date) : undefined,
			},
			create: {
				driver_license_no,
				restrictions: restriction || 'None',
				expiry_date: expiry_date ? new Date(expiry_date) : null,
			},
		});

		const hashed = await bcrypt.hash(password, 10);

		const newDriver = await prisma.driver.create({
			data: {
				first_name,
				last_name,
				address,
				contact_no,
				email,
				username,
				password: hashed,
				driver_license_no,
				status: status?.toLowerCase?.() || 'active',
			},
		});

		const { password: _pw, ...safe } = newDriver;
		res.status(201).json(safe);
	} catch (error) {
		if (error?.code === 'P2002') {
			return res.status(409).json({ error: 'Unique constraint failed' });
		}
		console.error('Error creating driver:', error);
		res.status(500).json({ error: 'Failed to create driver' });
	}
};

// @desc    Update driver
// @route   PUT /drivers/:id
// @access  Private/Admin
export const updateDriver = async (req, res) => {
	try {
		const id = Number(req.params.id);
		const {
			first_name,
			last_name,
			address,
			contact_no,
			email,
			username,
			password,
			driver_license_no,
			restriction,
			expiry_date,
			status,
		} = req.body;

		const existing = await prisma.driver.findUnique({ where: { drivers_id: id } });
		if (!existing) return res.status(404).json({ error: 'Driver not found' });

		const possible = { first_name, last_name, address, contact_no, email, username, driver_license_no };
		const data = {};
		for (const k of Object.keys(possible)) {
			if (possible[k] !== undefined) data[k] = possible[k];
		}
		if (status !== undefined) data.status = status.toLowerCase();
		if (password) data.password = await bcrypt.hash(password, 10);

		const updated = await prisma.driver.update({
			where: { drivers_id: id },
			data,
		});

		// update license if provided
		if (driver_license_no) {
			await prisma.driverLicense.upsert({
				where: { driver_license_no },
				update: {
					restrictions: restriction || undefined,
					expiry_date: expiry_date ? new Date(expiry_date) : undefined,
				},
				create: {
					driver_license_no,
					restrictions: restriction || 'None',
					expiry_date: expiry_date ? new Date(expiry_date) : null,
				},
			});
		}

		const { password: _pw, ...safe } = updated;
		res.json(safe);
	} catch (error) {
		console.error('Error updating driver:', error);
		res.status(500).json({ error: 'Failed to update driver' });
	}
};

// @desc    Delete driver
// @route   DELETE /drivers/:id
// @access  Private/Admin
export const deleteDriver = async (req, res) => {
	try {
		const id = Number(req.params.id);
		await prisma.driver.delete({ where: { drivers_id: id } });
		res.status(204).send();
	} catch (error) {
		console.error('Error deleting driver:', error);
		res.status(500).json({ error: 'Failed to delete driver' });
	}
};
