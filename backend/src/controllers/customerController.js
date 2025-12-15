import prisma from "../config/prisma.js";
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { getPaginationParams, getSortingParams, buildPaginationResponse, getSearchParam } from '../utils/pagination.js';

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
      return dl_img_url; // Return original URL as fallback
    }

    return data.signedUrl;
  } catch (err) {
    return dl_img_url; // Return original URL as fallback
  }
}

// @desc    Get all customers with pagination (Admin)
// @route   GET /api/customers?page=1&pageSize=10&sortBy=customer_id&sortOrder=desc&search=john&status=active
// @access  Private/Admin
export const getCustomers = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, 'customer_id', 'desc');
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
    const total = await prisma.customer.count({ where });

    // Get paginated customers
    const users = await prisma.customer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        driver_license: true,
      },
    });

    res.json(buildPaginationResponse(users, total, page, pageSize));

  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// @desc    Get a customer by ID
// @route   GET /customers/:id
// @access  Public
export const getCustomerById = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId }, // ✅ fixed variable
      include: {
        driver_license: true, // ✅ include relation
      },
    });

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // Generate signed URL for license image if it exists
    if (customer.driver_license?.dl_img_url) {
      const signedUrl = await getSignedLicenseUrl(customer.driver_license.dl_img_url);
      customer.driver_license.dl_img_url = signedUrl || customer.driver_license.dl_img_url;
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer" });
  }
};

// @desc    Create a new customer
// @route   POST /customers
// @access  Private/Admin
export const createCustomer = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      address,
      contact_no,
      email,
      username,
      password,
      fb_link,
      date_created,
      status,
      driver_license_no, // -> Must exist as FK
    } = req.body;

    if (!first_name || !last_name || !email || !username || !password) {
      return res.status(400).json({
        error:
          "first_name, last_name, email, username and password are required",
      });
    }

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    const newCustomer = await prisma.customer.create({
      data: {
        first_name,
        last_name,
        address,
        contact_no,
        email,
        username,
        password: hashedPassword,
        fb_link,
        date_created,
        status,
        driver_license_no,
        isRecUpdate: 3, // Enable both SMS and Email notifications by default
      },
      include: {
        driver_license: true, // ✅ include after create
      },
    });

    const { password: _pw, ...safeCustomer } = newCustomer;
    res.status(201).json(safeCustomer);
  } catch (error) {
    if (error?.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Record already exists (unique constraint)" });
    }
    res.status(500).json({ error: "Failed to create customer" });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    await prisma.customer.delete({
      where: { customer_id: customerId },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Failed to delete customer" });
  }
};

export const updateCustomer = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const existing = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });
    if (!existing) return res.status(404).json({ error: "Customer not found" });

    const allowed = [
      "first_name",
      "last_name",
      "address",
      "contact_no",
      "email",
      "username",
      "password",
      "currentPassword",
      "fb_link",
      "date_created",
      "status",
      "driver_license_no",
      "profile_img_url",
    ];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }

    // Handle password change with proper hashing
    if (data.password && data.password.trim() !== '') {
      // If currentPassword is provided, verify it first
      if (data.currentPassword) {
        const isCurrentPasswordValid = await bcrypt.compare(
          data.currentPassword,
          existing.password
        );
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ 
            error: "Current password is incorrect" 
          });
        }
      }

      // Hash the new password
      data.password = await bcrypt.hash(data.password, 12);
    } else {
      // If no password provided or empty string, don't update it
      delete data.password;
    }

    // Remove currentPassword from data (it's not a database field)
    delete data.currentPassword;

    const updatedCustomer = await prisma.customer.update({
      where: { customer_id: customerId },
      data,
      include: {
        driver_license: true, // ✅ include after update
      },
    });

    const { password: _pw, ...safeCustomer } = updatedCustomer;
    res.json(safeCustomer);
  } catch (error) {
    res.status(500).json({ error: "Failed to update customer" });
  }
};

// @desc    Get current logged-in customer's profile
// @route   GET /api/customers/me
// @access  Private (Customer only)
export const getCurrentCustomer = async (req, res) => {
  try {
    // req.user is set by authMiddleware
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized - No customer ID found" });
    }

    const customer = await prisma.customer.findUnique({
      where: { customer_id: parseInt(customerId) },
      select: {
        customer_id: true,
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        contact_no: true,
        address: true,
        fb_link: true,
        status: true,
        isRecUpdate: true,
        profile_img_url: true,
        driver_license_id: true,
        driver_license: {
          select: {
            license_id: true,
            driver_license_no: true,
            expiry_date: true,
            restrictions: true,
            dl_img_url: true,
          },
        },
        date_created: true
        // Exclude password for security
      }
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customer profile" });
  }
};

// @desc    Update current customer's notification settings
// @route   PUT /api/customers/me/notification-settings
// @access  Private (Customer only)
export const updateNotificationSettings = async (req, res) => {
  try {
    const customerId = req.user?.sub || req.user?.customer_id || req.user?.id;

    if (!customerId) {
      return res.status(401).json({ error: "Unauthorized - No customer ID found" });
    }
    const { isRecUpdate } = req.body;

    // Validate isRecUpdate value (should be 0, 1, 2, or 3)
    const validValues = [0, 1, 2, 3];
    const parsedValue = parseInt(isRecUpdate);

    if (!validValues.includes(parsedValue)) {
      return res.status(400).json({ 
        error: "Invalid notification setting. Must be 0 (none), 1 (SMS), 2 (Email), or 3 (Both)" 
      });
    }

    const updatedCustomer = await prisma.customer.update({
      where: { customer_id: parseInt(customerId) },
      data: { isRecUpdate: parsedValue },
      select: {
        customer_id: true,
        first_name: true,
        last_name: true,
        isRecUpdate: true
      }
    });
    res.json({
      message: "Notification settings updated successfully",
      customer: updatedCustomer
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update notification settings" });
  }
};

/**
 * Create a quick walk-in customer account (simplified registration)
 */
export const createWalkInCustomer = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      contact_no,
      email,
      driver_license_no,
    } = req.body;

    // Validate required fields for walk-in
    if (!first_name || !last_name || !contact_no) {
      return res.status(400).json({
        error: "first_name, last_name, and contact_no are required for walk-in customers",
      });
    }

    // Generate a unique username for walk-in (format: walkin_timestamp)
    const username = `walkin_${Date.now()}`;
    
    // Generate a random temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const newWalkInCustomer = await prisma.customer.create({
      data: {
        first_name,
        last_name,
        contact_no,
        email: email || `${username}@walkin.temp`, // Temporary email if not provided
        username,
        password: hashedPassword,
        is_walk_in: true,
        isRecUpdate: 1, // SMS only for walk-ins by default
        status: "active",
        date_created: new Date(),
        driver_license_no,
      },
      include: {
        driver_license: true,
      },
    });

    const { password: _pw, ...safeCustomer } = newWalkInCustomer;
    
    res.status(201).json({
      success: true,
      message: "Walk-in customer created successfully",
      customer: safeCustomer,
      tempPassword: tempPassword, // Send to admin/staff only, not to customer
    });
  } catch (error) {
    console.error("Failed to create walk-in customer:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ 
        error: "Customer with this contact number or email already exists" 
      });
    }
    res.status(500).json({ 
      error: "Failed to create walk-in customer",
      details: error.message 
    });
  }
};

/**
 * Convert walk-in customer to full registered account
 */
export const convertWalkInToRegistered = async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const { 
      username, 
      password, 
      email, 
      address, 
      fb_link 
    } = req.body;

    // Validate required fields for full registration
    if (!username || !password || !email) {
      return res.status(400).json({
        error: "username, password, and email are required to convert to full account",
      });
    }

    // Check if customer exists and is walk-in
    const existingCustomer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!existingCustomer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    if (!existingCustomer.is_walk_in) {
      return res.status(400).json({ 
        error: "Customer is already a registered account" 
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update to full account
    const updatedCustomer = await prisma.customer.update({
      where: { customer_id: customerId },
      data: {
        username,
        password: hashedPassword,
        email,
        address,
        fb_link,
        is_walk_in: false,
        isRecUpdate: 3, // Enable both SMS and Email for full accounts
      },
      include: {
        driver_license: true,
      },
    });

    const { password: _pw, ...safeCustomer } = updatedCustomer;
    
    res.status(200).json({
      success: true,
      message: "Walk-in customer converted to full account successfully",
      customer: safeCustomer,
    });
  } catch (error) {
    console.error("Failed to convert walk-in customer:", error);
    if (error?.code === "P2002") {
      return res.status(409).json({ 
        error: "Username or email already exists" 
      });
    }
    res.status(500).json({ 
      error: "Failed to convert walk-in customer",
      details: error.message 
    });
  }
};
