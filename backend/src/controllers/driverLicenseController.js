import prisma from "../config/prisma.js";
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
      // Remove query parameters if present
      path = path.split('?')[0];
      // Decode any URL-encoded characters
      path = decodeURIComponent(path);
    }

    // First check if the file exists before creating signed URL
    const { data: fileData, error: listError } = await supabase.storage
      .from('licenses')
      .list('', {
        search: path
      });

    // If file doesn't exist, return original URL (might be a new upload)
    if (listError || !fileData || fileData.length === 0) {
      return dl_img_url;
    }

    const { data, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    if (error) {
      return dl_img_url; // Return original URL as fallback
    }

    return data.signedUrl;
  } catch (err) {
    return dl_img_url; // Return original URL as fallback
  }
}

// @desc    Update a driver license
// @route   PUT /driver-license/:id
// @access  Authenticated
export const updateDriverLicense = async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id, 10);
    const { restrictions, expiry_date, dl_img_url, driver_license_no } = req.body;
    
    // Validate license_id
    if (isNaN(licenseId)) {
      return res.status(400).json({ error: "Invalid license ID" });
    }

    // Find current record for comparison
    const existing = await prisma.driverLicense.findUnique({
      where: { license_id: licenseId },
    });

    if (!existing) {
      return res.status(404).json({ error: "License not found" });
    }

    // If updating license number, check if it's already in use by another record
    if (driver_license_no && driver_license_no !== existing.driver_license_no) {
      const duplicate = await prisma.driverLicense.findUnique({
        where: { driver_license_no: driver_license_no },
      });
      
      if (duplicate && duplicate.license_id !== licenseId) {
        return res.status(400).json({ error: "License number already exists" });
      }
    }

    const updated = await prisma.driverLicense.update({
      where: { license_id: licenseId },
      data: {
        driver_license_no: driver_license_no?.trim() || existing.driver_license_no,
        restrictions:
          typeof restrictions === "string"
            ? restrictions.trim()
            : existing.restrictions,
        expiry_date: expiry_date ? new Date(expiry_date) : existing.expiry_date,
        dl_img_url: dl_img_url?.trim() || existing.dl_img_url,
      },
    });
    // Generate signed URL for the response
    const signedUrl = await getSignedLicenseUrl(updated.dl_img_url);
    const response = {
      ...updated,
      dl_img_url: signedUrl || updated.dl_img_url,
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to update driver license" });
  }
};

// @desc    Delete driver license image
// @route   DELETE /driver-license/:id/image
// @access  Authenticated
export const deleteLicenseImage = async (req, res) => {
  try {
    const licenseId = parseInt(req.params.id, 10);
    
    // Validate license_id
    if (isNaN(licenseId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid license ID" 
      });
    }

    // Find current record
    const existing = await prisma.driverLicense.findUnique({
      where: { license_id: licenseId },
    });

    if (!existing) {
      return res.status(404).json({ 
        success: false,
        error: "License not found" 
      });
    }

    if (!existing.dl_img_url) {
      return res.status(404).json({ 
        success: false,
        error: "No license image to delete" 
      });
    }

    // Extract the path from the URL
    let imagePath = existing.dl_img_url;
    if (imagePath.includes('/licenses/')) {
      imagePath = imagePath.split('/licenses/')[1];
      // Remove any query parameters (from signed URLs)
      imagePath = imagePath.split('?')[0];
      imagePath = decodeURIComponent(imagePath);
    }
    // Delete the file from Supabase
    const { error: deleteError } = await supabase.storage
      .from('licenses')
      .remove([imagePath]);

    if (deleteError) {
      return res.status(500).json({ 
        success: false,
        error: "Failed to delete image from storage" 
      });
    }
    // Update database to set dl_img_url to null
    const updated = await prisma.driverLicense.update({
      where: { license_id: licenseId },
      data: { dl_img_url: null },
    });
    res.json({
      success: true,
      message: "License image deleted successfully",
      license: {
        ...updated,
        dl_img_url: null,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Failed to delete license image" 
    });
  }
};

// @desc    Create a new driver license for a customer
// @route   POST /driver-license/customer/:customerId
// @access  Authenticated
export const createDriverLicenseForCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const { driver_license_no, restrictions, expiry_date, dl_img_url } = req.body;
    
    // Validate customer ID
    if (isNaN(customerId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid customer ID" 
      });
    }

    // Validate required fields
    if (!driver_license_no || !expiry_date || !dl_img_url) {
      return res.status(400).json({ 
        success: false,
        error: "License number, expiry date, and license image are required" 
      });
    }

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
      include: { driver_license: true }
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        error: "Customer not found" 
      });
    }

    // Check if customer already has a license
    if (customer.driver_license_id) {
      return res.status(400).json({ 
        success: false,
        error: "Customer already has a driver's license on record" 
      });
    }

    // Check if license number already exists
    const existingLicense = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driver_license_no.trim() }
    });

    if (existingLicense) {
      return res.status(409).json({ 
        success: false,
        error: "This license number is already registered in the system" 
      });
    }

    // Validate expiry date is in the future
    const expiryDate = new Date(expiry_date);
    const now = new Date();
    if (expiryDate <= now) {
      return res.status(400).json({ 
        success: false,
        error: "License expiry date must be in the future" 
      });
    }

    // Create the driver license record
    const newLicense = await prisma.driverLicense.create({
      data: {
        driver_license_no: driver_license_no.trim(),
        restrictions: restrictions?.trim() || null,
        expiry_date: expiryDate,
        dl_img_url: dl_img_url.trim()
      }
    });

    // Update customer with the new license_id
    await prisma.customer.update({
      where: { customer_id: customerId },
      data: { driver_license_id: newLicense.license_id }
    });

    // Generate signed URL for the response
    const signedUrl = await getSignedLicenseUrl(newLicense.dl_img_url);
    
    res.status(201).json({
      success: true,
      message: "Driver's license added successfully",
      license: {
        ...newLicense,
        dl_img_url: signedUrl || newLicense.dl_img_url,
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: "Failed to create driver license" 
    });
  }
};
