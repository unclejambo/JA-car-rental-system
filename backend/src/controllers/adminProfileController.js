import { createClient } from '@supabase/supabase-js';
import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

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
 * Get all admin/staff profiles (admin only)
 */
export const getAllAdminProfiles = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        admin_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        profile_img_url: true,
        isActive: true,
        // Don't return password
      },
      orderBy: {
        first_name: 'asc'
      }
    });

    // Refresh profile image URLs for all admins
    const adminsWithFreshUrls = await Promise.all(
      admins.map(async (admin) => {
        if (admin.profile_img_url) {
          admin.profile_img_url = await refreshProfileImageUrl(admin.profile_img_url);
        }
        return admin;
      })
    );

    res.json(adminsWithFreshUrls);
  } catch (error) {
    console.error('Error fetching all admin profiles:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admin profiles' 
    });
  }
};

/**
 * Get admin profile information
 */
export const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.sub; // From JWT token middleware
    
    const admin = await prisma.admin.findUnique({
      where: { 
        admin_id: adminId 
      },
      select: {
        admin_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        profile_img_url: true,
        // Don't return password
      }
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Refresh the profile image URL if it exists (for private bucket signed URLs)
    if (admin.profile_img_url) {
      admin.profile_img_url = await refreshProfileImageUrl(admin.profile_img_url);
    }

    res.json({
      success: true,
      data: admin
    });
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch profile' 
    });
  }
};

/**
 * Update admin profile information
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.sub; // From JWT token middleware
    const { 
      first_name, 
      last_name, 
      address,
      contact_no, 
      email, 
      username, 
      password, 
      currentPassword,
      profile_img_url 
    } = req.body;
    
    console.log('🔄 Admin profile update request:', { 
      adminId, 
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
        message: 'First name, last name, email, and username are required'
      });
    }

    // Get current admin data
    const currentAdmin = await prisma.admin.findUnique({
      where: { admin_id: adminId }
    });

    if (!currentAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // If password is being changed, validate current password
    let hashedPassword = currentAdmin.password;
    if (password && password.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentAdmin.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      hashedPassword = await bcrypt.hash(password, 12);
    }

    // Check if email or username is already taken by another admin
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        AND: [
          { admin_id: { not: adminId } }, // Exclude current admin
          {
            OR: [
              { email: email },
              { username: username }
            ]
          }
        ]
      }
    });

    if (existingAdmin) {
      const field = existingAdmin.email === email ? 'email' : 'username';
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`
      });
    }

    // Update admin profile
    const updatedAdmin = await prisma.admin.update({
      where: { admin_id: adminId },
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
        admin_id: true,
        first_name: true,
        last_name: true,
        address: true,
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        profile_img_url: true,
        // Don't return password
      }
    });

    // Refresh the profile image URL if it exists (for private bucket signed URLs)
    if (updatedAdmin.profile_img_url) {
      updatedAdmin.profile_img_url = await refreshProfileImageUrl(updatedAdmin.profile_img_url);
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin profile:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update profile' 
    });
  }
};

/**
 * Change admin password (alternative endpoint)
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user.sub;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Both current and new passwords are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get current admin
    const admin = await prisma.admin.findUnique({
      where: { admin_id: adminId }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await prisma.admin.update({
      where: { admin_id: adminId },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing admin password:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to change password' 
    });
  }
};