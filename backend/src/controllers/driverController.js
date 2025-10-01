import prisma from '../config/prisma.js';

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
    const driverId = parseInt(req.params.id);
    const driver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
      include: {
        driver_license: true
      }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const formattedDriver = {
      id: driver.drivers_id,
      name: `${driver.first_name} ${driver.last_name}`,
      firstName: driver.first_name,
      lastName: driver.last_name,
      address: driver.address,
      contactNo: driver.contact_no,
      email: driver.email,
      license: {
        number: driver.driver_license_no,
        expiryDate: driver.driver_license?.expiry_date,
        restrictions: driver.driver_license?.restrictions,
      },
      rating: 4.5 + Math.random() * 0.5, // Mock rating for now
    };

    res.json(formattedDriver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};