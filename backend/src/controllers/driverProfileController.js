import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper function to generate signed URL for license image
 */
async function getSignedLicenseUrl(dl_img_url) {
  if (!dl_img_url) return null;
  
  try {
    // Extract the path from the URL if it's already a full URL
    let path = dl_img_url;
    if (dl_img_url.includes('/licenses/')) {
      path = dl_img_url.split('/licenses/')[1];
      // Decode any URL-encoded characters
      path = decodeURIComponent(path);
    }
    
    console.log('Generating signed URL for path:', path);
    
    const { data, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return dl_img_url; // Return original URL as fallback
    }
    
    console.log('Generated signed URL:', data.signedUrl);
    return data.signedUrl;
  } catch (err) {
    console.error('Exception generating signed URL:', err);
    return dl_img_url; // Return original URL as fallback
  }
}

/**
 * Get driver profile information
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

    // Get driver info
    const driver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Get license info
    const license = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driver.driver_license_no },
    });

    // Generate signed URL for license image if it exists
    const licenseImageUrl = license?.dl_img_url 
      ? await getSignedLicenseUrl(license.dl_img_url)
      : null;

    // Format for frontend
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
      profile_img_url: driver.profile_img_url,
      license_expiry: license?.expiry_date,
      license_restrictions: license?.restrictions,
      license_img_url: licenseImageUrl,
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
    const driverId = parseInt(req.user.sub);
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
      license_restrictions,
      license_expiry,
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !username || !license_number) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email, username, and license number are required",
      });
    }

    // Get current driver
    const currentDriver = await prisma.driver.findUnique({
      where: { drivers_id: driverId },
    });

    if (!currentDriver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Handle password change
    let hashedPassword = currentDriver.password;
    if (password && password.trim() !== "") {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change password",
        });
      }

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

      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Check for duplicate email/username
    const existingDriver = await prisma.driver.findFirst({
      where: {
        AND: [
          { drivers_id: { not: driverId } },
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

    // Ensure license exists
    const licenseRecord = await prisma.driverLicense.findUnique({
      where: { driver_license_no: license_number },
    });
    if (!licenseRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid license number. License not found in system.",
      });
    }

    // ✅ Update driver info
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
        profile_img_url: req.body.profile_img_url || null,
      },
    });

    // ✅ Update driver license info (restrictions + expiry)
    if (license_restrictions !== undefined || license_expiry !== undefined) {
      await prisma.driverLicense.update({
        where: { driver_license_no: license_number },
        data: {
          restrictions:
            license_restrictions !== undefined
              ? license_restrictions
              : licenseRecord.restrictions,
          expiry_date: license_expiry
            ? new Date(license_expiry)
            : licenseRecord.expiry_date,
        },
      });
    }

    // ✅ Re-fetch latest license info
    const refreshedLicense = await prisma.driverLicense.findUnique({
      where: { driver_license_no: license_number },
    });

    // Generate signed URL for license image if it exists
    const licenseImageUrl = refreshedLicense?.dl_img_url 
      ? await getSignedLicenseUrl(refreshedLicense.dl_img_url)
      : null;

    // ✅ Format response
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
      profile_img_url: updatedDriver.profile_img_url,
      license_expiry: refreshedLicense?.expiry_date,
      license_restrictions: refreshedLicense?.restrictions,
      license_img_url: licenseImageUrl,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: formattedDriver,
    });
  } catch (error) {
    console.error("Error updating driver profile:", error);

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
 * Change driver password
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
