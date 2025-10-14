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
      // Decode any URL-encoded characters
      path = decodeURIComponent(path);
    }
    
    const { data, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
    
    if (error) {
      console.error('Error generating signed URL:', error);
      return dl_img_url; // Return original URL as fallback
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Exception generating signed URL:', err);
    return dl_img_url; // Return original URL as fallback
  }
}

// @desc    Update a driver license
// @route   PUT /driver-license/:id
// @access  Authenticated
export const updateDriverLicense = async (req, res) => {
  try {
    const driverLicenseNo = req.params.id;
    const { restrictions, expiry_date, dl_img_url } = req.body;

    console.log("🟢 Incoming update request:", req.body);

    // Find current record for comparison
    const existing = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driverLicenseNo },
    });

    if (!existing) {
      return res.status(404).json({ error: "License not found" });
    }

    const updated = await prisma.driverLicense.update({
      where: { driver_license_no: driverLicenseNo },
      data: {
        restrictions:
          typeof restrictions === "string"
            ? restrictions.trim()
            : existing.restrictions,
        expiry_date: expiry_date ? new Date(expiry_date) : existing.expiry_date,
        dl_img_url: dl_img_url?.trim() || existing.dl_img_url,
      },
    });

    console.log("✅ Prisma updated license:", updated);
    
    // Generate signed URL for the response
    const signedUrl = await getSignedLicenseUrl(updated.dl_img_url);
    const response = {
      ...updated,
      dl_img_url: signedUrl || updated.dl_img_url,
    };
    
    res.json(response);
  } catch (error) {
    console.error("❌ Error updating driver license:", error);
    res.status(500).json({ error: "Failed to update driver license" });
  }
};

// @desc    Delete driver license image
// @route   DELETE /driver-license/:id/image
// @access  Authenticated
export const deleteLicenseImage = async (req, res) => {
  try {
    const driverLicenseNo = req.params.id;
    
    console.log("🗑️ License image delete request for:", driverLicenseNo);

    // Find current record
    const existing = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driverLicenseNo },
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

    console.log("Deleting from Supabase:", imagePath);

    // Delete the file from Supabase
    const { error: deleteError } = await supabase.storage
      .from('licenses')
      .remove([imagePath]);

    if (deleteError) {
      console.error('❌ Supabase delete error:', deleteError);
      return res.status(500).json({ 
        success: false,
        error: "Failed to delete image from storage" 
      });
    }

    console.log("✅ Image deleted from Supabase, updating database...");

    // Update database to set dl_img_url to null
    const updated = await prisma.driverLicense.update({
      where: { driver_license_no: driverLicenseNo },
      data: { dl_img_url: null },
    });

    console.log("✅ Database updated, image URL set to null");

    res.json({
      success: true,
      message: "License image deleted successfully",
      license: {
        ...updated,
        dl_img_url: null,
      }
    });
  } catch (error) {
    console.error("❌ Error deleting license image:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to delete license image" 
    });
  }
};
