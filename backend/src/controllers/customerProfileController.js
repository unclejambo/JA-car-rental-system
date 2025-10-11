import { createClient } from '@supabase/supabase-js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Generate fresh signed URL for profile image if it exists
 */
const refreshProfileImageUrl = async (profileImgUrl) => {
  if (!profileImgUrl) return null;
  
  try {
    // Extract the path from the existing URL
    // Format: https://...supabase.co/storage/v1/object/sign/licenses/profile_img/filename?token=...
    const urlParts = profileImgUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'licenses');
    
    if (bucketIndex === -1) return profileImgUrl; // Return original if can't parse
    
    const path = urlParts.slice(bucketIndex + 1).join('/').split('?')[0]; // Remove query params
    
    const { data: signedUrlData, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration
    
    if (error) {
      console.error('Error refreshing signed URL:', error);
      return profileImgUrl; // Return original URL if refresh fails
    }
    
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error parsing profile image URL:', error);
    return profileImgUrl; // Return original URL if parsing fails
  }
};

/**
 * Get customer profile information
 */
export const getCustomerProfile = async (req, res) => {
  try {
    const customerId = parseInt(req.user.sub);
    console.log('Customer profile request - customerId:', customerId);

    if (isNaN(customerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID',
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
      select: {
        customer_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        profile_img_url: true,
        // Don't return password
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Refresh the profile image URL if it exists (for private bucket signed URLs)
    if (customer.profile_img_url) {
      customer.profile_img_url = await refreshProfileImageUrl(customer.profile_img_url);
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

/**
 * Update customer profile information
 */
export const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = parseInt(req.user.sub);
    const {
      first_name,
      last_name,
      address,
      contact_no,
      email,
      username,
      password,
      currentPassword,
      profile_img_url,
    } = req.body;

    console.log('🔄 Customer profile update request:', { 
      customerId, 
      first_name, 
      last_name, 
      email, 
      username, 
      profile_img_url: profile_img_url ? 'URL provided' : 'No URL' 
    });

    // Validate required fields
    if (!first_name || !last_name || !email || !username) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, and username are required',
      });
    }

    // Get current customer
    const currentCustomer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!currentCustomer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Handle password change
    let hashedPassword = currentCustomer.password;
    if (password && password.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        currentCustomer.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Check for duplicate email/username
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        AND: [
          { customer_id: { not: customerId } },
          {
            OR: [{ email: email }, { username: username }],
          },
        ],
      },
    });

    if (existingCustomer) {
      const field = existingCustomer.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`,
      });
    }

    // Update customer profile
    const updatedCustomer = await prisma.customer.update({
      where: { customer_id: customerId },
      data: {
        first_name,
        last_name,
        address: address || null,
        contact_no: contact_no || null,
        email,
        username,
        password: hashedPassword,
        profile_img_url: profile_img_url || null,
      },
      select: {
        customer_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        profile_img_url: true,
        // Don't return password
      }
    });

    // Refresh the profile image URL if it exists (for private bucket signed URLs)
    if (updatedCustomer.profile_img_url) {
      updatedCustomer.profile_img_url = await refreshProfileImageUrl(updatedCustomer.profile_img_url);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

/**
 * Change customer password
 */
export const changeCustomerPassword = async (req, res) => {
  try {
    const customerId = parseInt(req.user.sub);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new passwords are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    // Get current customer
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      customer.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.customer.update({
      where: { customer_id: customerId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Error changing customer password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};
