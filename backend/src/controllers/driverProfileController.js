import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";

/**
 * Get driver profile information - SIMPLIFIED VERSION
 */
export const getDriverProfile = async (req, res) => {
  try {
    const driverId = parseInt(req.user.sub);
    console.log("Driver profile request - driverId:", driverId);

    if (isNaN(driverId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID",
      });
    }

    // Get driver basic info only - NO INCLUDE OR SELECT CONFLICTS
    const driver = await prisma.driver.findUnique({
      where: {
        drivers_id: driverId,
      },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Get license info separately to avoid conflicts
    const license = await prisma.driverLicense.findUnique({
      where: {
        driver_license_no: driver.driver_license_no,
      },
    });

    // Format response to match frontend expectations
    const formattedDriver = {
      drivers_id: driver.drivers_id,
      first_name: driver.first_name,
      last_name: driver.last_name,
      address: driver.address,
      contact_no: driver.contact_no,
      email: driver.email,
      username: driver.username,
      license_number: driver.driver_license_no,
      user_type: "driver",
      status: driver.status,
      license_expiry: license?.expiry_date,
      license_restrictions: license?.restrictions,
    };

    res.json({
      success: true,
      data: formattedDriver,
    });
  } catch (error) {
    console.error("Error fetching driver profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/**
 * Update driver profile information
 */
export const updateDriverProfile = async (req, res) => {
  try {
    const driverId = parseInt(req.user.sub); // From JWT token middleware - convert to number
    const {
      first_name,
      last_name,
      address,
      contact_no,
      email,
      username,
      license_number,
      password,
      currentPassword,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !username || !license_number) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email, username, and license number are required",
      });
    }

    // Get current driver data
    const currentDriver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!currentDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // If password is being changed, validate current password
    let hashedPassword = currentDriver.password;
    if (password && password.trim() !== "") {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change password",
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        currentDriver.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash new password
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Check if email or username is already taken by another driver
    const existingDriver = await prisma.driver.findFirst({
      where: {
        AND: [
          { drivers_id: { not: driverId } }, // Exclude current driver
          {
            OR: [{ email: email }, { username: username }],
          },
        ],
      },
    });

    if (existingDriver) {
      const field = existingDriver.email === email ? "email" : "username";
      return res.status(400).json({
        success: false,
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already taken`,
      });
    }

    // Check if license number is being changed and if it exists
    if (license_number !== currentDriver.driver_license_no) {
      const licenseExists = await prisma.driverLicense.findUnique({
        where: { driver_license_no: license_number },
      });

      if (!licenseExists) {
        return res.status(400).json({
          success: false,
          message: "Invalid license number. License not found in system.",
        });
      }
    }

    // Update driver profile
    const updatedDriver = await prisma.driver.update({
      where: { drivers_id: driverId },
      data: {
        first_name,
        last_name,
        address: address || null,
        contact_no: contact_no || null,
        email,
        username,
        driver_license_no: license_number,
        password: hashedPassword,
      },
      select: {
        drivers_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        driver_license_no: true,
        status: true,
        driver_license: {
          select: {
            driver_license_no: true,
            expiry_date: true,
            restrictions: true,
          },
        },
        // Don't return password
      },
    });

    // Format response to match frontend expectations
    const formattedDriver = {
      drivers_id: updatedDriver.drivers_id,
      first_name: updatedDriver.first_name,
      last_name: updatedDriver.last_name,
      address: updatedDriver.address,
      contact_no: updatedDriver.contact_no,
      email: updatedDriver.email,
      username: updatedDriver.username,
      license_number: updatedDriver.driver_license_no,
      user_type: "driver",
      status: updatedDriver.status,
      license_expiry: updatedDriver.driver_license?.expiry_date,
      license_restrictions: updatedDriver.driver_license?.restrictions,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: formattedDriver,
    });
  } catch (error) {
    console.error("Error updating driver profile:", error);

    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] || "field";
      return res.status(400).json({
        success: false,
        message: `${
          field.charAt(0).toUpperCase() + field.slice(1)
        } is already taken`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/**
 * Change driver password (alternative endpoint)
 */
export const changeDriverPassword = async (req, res) => {
  try {
    const driverId = parseInt(req.user.sub);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new passwords are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get current driver
    const driver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      driver.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.driver.update({
      where: { drivers_id: driverId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing driver password:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};
