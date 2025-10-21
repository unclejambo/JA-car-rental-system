import prisma from "../config/prisma.js";
import { getPaginationParams, getSortingParams, buildPaginationResponse, getSearchParam } from '../utils/pagination.js';

// @desc    Get all drivers with pagination (Admin)
// @route   GET /drivers?page=1&pageSize=10&sortBy=drivers_id&sortOrder=desc&search=john&status=active
// @access  Private/Admin
export const getDrivers = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, 'drivers_id', 'desc');
    const search = getSearchParam(req);
    
    // Build where clause
    const where = {};
    
    // Search filter (name, email, or username)
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Status filter
    if (req.query.status) {
      where.status = req.query.status;
    }

    // Get total count
    const total = await prisma.driver.count({ where });

    // Get paginated drivers
    const drivers = await prisma.driver.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: { driver_license: true },
    });
    
    // Map to plain object with expected frontend fields
    const sanitized = drivers.map((d) => ({
      ...d,
      driver_id: d.drivers_id,
      id: d.drivers_id,
      license_number: d.driver_license_no,
      rating: 4.5,
      password: undefined,
      restriction: d.driver_license?.restrictions || null,
      expiryDate: d.driver_license?.expiry_date || null,
    }));
    
    res.json(buildPaginationResponse(sanitized, total, page, pageSize));
  } catch (error) {
    console.error("Error fetching drivers:", error);
    res.status(500).json({ error: "Failed to fetch drivers" });
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
        driver_license: true,
      },
    });

    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
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
    console.error("Error fetching driver:", error);
    res.status(500).json({ error: "Failed to fetch driver" });
  }
};

// @desc    Create a new driver
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
      status,
    } = req.body;

    // Validate required fields
    if (
      !first_name ||
      !last_name ||
      !email ||
      !username ||
      !password ||
      !driver_license_no
    ) {
      return res.status(400).json({
        error:
          "Missing required fields: first_name, last_name, email, username, password, driver_license_no",
      });
    }

    // Check if email or username already exists
    const existingDriver = await prisma.driver.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingDriver) {
      const field = existingDriver.email === email ? "email" : "username";
      return res.status(400).json({
        error: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already taken`,
      });
    }

    // Check if license exists
    const licenseExists = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driver_license_no },
    });

    if (!licenseExists) {
      return res.status(400).json({
        error: "Invalid license number. License not found in system.",
      });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash(password, 12);

    const newDriver = await prisma.driver.create({
      data: {
        first_name,
        last_name,
        address,
        contact_no,
        email,
        username,
        password: hashedPassword,
        driver_license_no,
        status: status || "active",
      },
      include: {
        driver_license: true,
      },
    });

    // Don't return password
    const { password: _, ...driverResponse } = newDriver;

    res.status(201).json({
      message: "Driver created successfully",
      driver: driverResponse,
    });
  } catch (error) {
    console.error("Error creating driver:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return res.status(400).json({
        error: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already taken`,
      });
    }

    res.status(500).json({ error: "Failed to create driver" });
  }
};

// @desc    Update driver
// @route   PUT /drivers/:id
// @access  Private/Admin
export const updateDriver = async (req, res) => {
  try {
    const driverId = parseInt(req.params.id);
    const {
      first_name,
      last_name,
      address,
      contact_no,
      email,
      username,
      password,
      driver_license_no,
      status,
    } = req.body;

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check if email or username is already taken by another driver
    if (email || username) {
      const conflictDriver = await prisma.driver.findFirst({
        where: {
          AND: [
            { drivers_id: { not: driverId } },
            {
              OR: [
                ...(email ? [{ email: email }] : []),
                ...(username ? [{ username: username }] : []),
              ],
            },
          ],
        },
      });

      if (conflictDriver) {
        const field = conflictDriver.email === email ? "email" : "username";
        return res.status(400).json({
          error: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } is already taken`,
        });
      }
    }

    // Check if license number is valid (if being changed)
    if (
      driver_license_no &&
      driver_license_no !== existingDriver.driver_license_no
    ) {
      const licenseExists = await prisma.driverLicense.findUnique({
        where: { driver_license_no: driver_license_no },
      });

      if (!licenseExists) {
        return res.status(400).json({
          error: "Invalid license number. License not found in system.",
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (first_name) updateData.first_name = first_name;
    if (last_name) updateData.last_name = last_name;
    if (address !== undefined) updateData.address = address;
    if (contact_no !== undefined) updateData.contact_no = contact_no;
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (driver_license_no) updateData.driver_license_no = driver_license_no;
    if (status) updateData.status = status;

    // Hash password if provided
    if (password && password.trim() !== "") {
      const bcrypt = await import("bcryptjs");
      updateData.password = await bcrypt.default.hash(password, 12);
    }

    const updatedDriver = await prisma.driver.update({
      where: { drivers_id: driverId },
      data: updateData,
      include: {
        driver_license: true,
      },
    });

    // Don't return password
    const { password: _, ...driverResponse } = updatedDriver;

    res.json({
      message: "Driver updated successfully",
      driver: driverResponse,
    });
  } catch (error) {
    console.error("Error updating driver:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return res.status(400).json({
        error: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already taken`,
      });
    }

    res.status(500).json({ error: "Failed to update driver" });
  }
};

// @desc    Delete driver
// @route   DELETE /drivers/:id
// @access  Private/Admin
export const deleteDriver = async (req, res) => {
  try {
    const driverId = parseInt(req.params.id);

    // Check if driver exists
    const existingDriver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!existingDriver) {
      return res.status(404).json({ error: "Driver not found" });
    }

    // Check if driver has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        drivers_id: driverId,
        booking_status: {
          in: ["pending", "confirmed", "ongoing"],
        },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error:
          "Cannot delete driver with active bookings. Please complete or reassign bookings first.",
      });
    }

    await prisma.driver.delete({
      where: { drivers_id: driverId },
    });

    res.json({
      message: "Driver deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting driver:", error);
    res.status(500).json({ error: "Failed to delete driver" });
  }
};
