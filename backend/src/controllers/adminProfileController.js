import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Get all admins/staff (for manage users page)
 */
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        admin_id: true,
        first_name: true,
        last_name: true,
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        isActive: true,
        address: true,
        // Don't return password
      },
      orderBy: {
        admin_id: 'asc'
      }
    });

    // Format data for frontend compatibility
    const formattedAdmins = admins.map(admin => ({
      ...admin,
      id: admin.admin_id, // Required by DataGrid
      contact_number: admin.contact_no,
      status: admin.isActive === true || admin.isActive === null ? 'Active' : 'Inactive'
    }));

    res.json(formattedAdmins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admins' 
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
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        // Don't return password
      }
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
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
      contact_no, 
      email, 
      username, 
      password, 
      currentPassword 
    } = req.body;

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
        contact_no: contact_no || null,
        email,
        username,
        password: hashedPassword,
      },
      select: {
        admin_id: true,
        first_name: true,
        last_name: true,
        contact_no: true,
        email: true,
        username: true,
        user_type: true,
        // Don't return password
      }
    });

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