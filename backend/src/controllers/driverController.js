import prisma from '../config/prisma.js';

// @desc    Get all drivers
// @route   GET /drivers
// @access  Public
export const getDrivers = async (req, res) => {
  try {
    console.log('getDrivers endpoint called');
    const drivers = await prisma.driver.findMany({
      select: {
        drivers_id: true,
        first_name: true,
        last_name: true,
        driver_license_no: true,
        contact_no: true,
        email: true,
      },
      orderBy: {
        first_name: 'asc'
      }
    });
    
    // Format driver data for frontend
    const formattedDrivers = drivers.map(driver => ({
      id: driver.drivers_id,
      name: `${driver.first_name} ${driver.last_name}`,
      license: driver.driver_license_no,
      contact: driver.contact_no,
      email: driver.email,
      rating: 4.5 + Math.random() * 0.5, // Mock rating for now
    }));
    
    console.log('Found drivers:', formattedDrivers.length);
    res.json(formattedDrivers);
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