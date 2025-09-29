import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function login(req, res, next) {
  try {
    const { identifier, email, username, password } = req.body;
    if (!password || !(identifier || email || username)) {
      return res.status(400).json({ ok: false, message: 'Missing credentials' });
    }

    let user = null;
    let role = null;
    let foundIn = null;

    // Search identifier (email or username) in all three user tables
    const searchTerm = identifier || email || username;

    // Try Admin first
    try {
      user = await prisma.admin.findFirst({
        where: {
          OR: [
            { email: searchTerm },
            { username: searchTerm },
          ],
        },
      });
      if (user) {
        role = user.user_type || 'admin'; // Use user_type from database, default to admin
        foundIn = 'admin';
      }
    } catch (err) {
      console.log('Admin search failed:', err.message);
    }

    // Try Customer if not found in Admin
    if (!user) {
      try {
        user = await prisma.customer.findFirst({
          where: {
            OR: [
              { email: searchTerm },
              { username: searchTerm },
            ],
          },
        });
        if (user) {
          role = 'customer';
          foundIn = 'customer';
        }
      } catch (err) {
        console.log('Customer search failed:', err.message);
      }
    }

    // Try Driver if not found in Admin or Customer
    if (!user) {
      try {
        user = await prisma.driver.findFirst({
          where: {
            OR: [
              { email: searchTerm },
              { username: searchTerm },
            ],
          },
        });
        if (user) {
          role = 'driver';
          foundIn = 'driver';
        }
      } catch (err) {
        console.log('Driver search failed:', err.message);
      }
    }

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    // Check password
    let passwordMatches = false;
    if (user.password) {
      try {
        // preferred: bcrypt hashed
        passwordMatches = await bcrypt.compare(password, user.password);
      } catch (err) {
        // fallback to plain equality (in case seed used plain text)
        passwordMatches = user.password === password;
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    // Check if account is active based on user type
    if (foundIn === 'admin') {
      // For admin and staff, check isActive column and user_type
      if (user.user_type === 'admin' || user.user_type === 'staff') {
        if (!user.isActive) {
          return res.status(403).json({ 
            ok: false, 
            message: 'Account is inactive. Please contact admin to activate your account.' 
          });
        }
      }
    } else if (foundIn === 'customer') {
      // For customers, check status column
      if (user.status !== 'active') {
        return res.status(403).json({ 
          ok: false, 
          message: 'Account is inactive. Please contact admin to activate your account.' 
        });
      }
    } else if (foundIn === 'driver') {
      // For drivers, check status column
      if (user.status !== 'active') {
        return res.status(403).json({ 
          ok: false, 
          message: 'Account is inactive. Please contact admin to activate your account.' 
        });
      }
    }

    // create a small token (avoid putting sensitive info)
    const userId = user.admin_id || user.customer_id || user.drivers_id;
    const tokenPayload = {
      sub: userId,
      role,
      email: user.email,
      foundIn,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // decide redirect (frontend can override)
    const redirectMap = {
      admin: '/admindashboard',
      staff: '/admindashboard', // Staff uses same dashboard as admin
      driver: '/driverdashboard', 
      customer: '/dashboard',
    };
    const redirect = redirectMap[role] || '/';

    return res.json({
      ok: true,
      message: 'Authenticated',
      token,
      role,
      redirect,
      user: {
        id: userId,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        username: user.username,
        ...(foundIn === 'admin' && user.user_type ? { user_type: user.user_type } : {}),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    next(err);
  }
}

async function validateToken(req, res, next) {
  try {
    // Token is already verified by middleware, just return success
    return res.json({
      ok: true,
      message: 'Token is valid',
      user: req.user,
    });
  } catch (err) {
    console.error('Token validation error:', err);
    next(err);
  }
}

async function register(req, res, next) {
  try {
    console.log('--- REGISTER ROUTE CALLED ---');
    console.log('Request URL:', req.originalUrl || req.url);
    console.log('Headers (content-type):', req.headers['content-type'] || req.headers['Content-Type']);
    console.log('Body:', req.body);

    // Accept field variants from frontend
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      address,
      contactNumber,
      licenseNumber: licenseNumberBody,
      licenseExpiry,
      restrictions,
      dl_img_url, // This comes from the separate file upload
      agreeTerms,
    } = req.body;

    const licenseNumber =
      licenseNumberBody || req.body.license_number || req.body.driver_license_no;

    console.log('Extracted dl_img_url:', dl_img_url);

    // Basic validation
    if (
      !email ||
      !username ||
      !password ||
      !firstName ||
      !lastName ||
      !address ||
      !contactNumber ||
      !licenseNumber ||
      !licenseExpiry ||
      !dl_img_url || // Require the image URL
      !agreeTerms
    ) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing required fields',
        missing: {
          email: !email,
          username: !username,
          password: !password,
          firstName: !firstName,
          lastName: !lastName,
          address: !address,
          contactNumber: !contactNumber,
          licenseNumber: !licenseNumber,
          licenseExpiry: !licenseExpiry,
          dl_img_url: !dl_img_url,
          agreeTerms: !agreeTerms
        }
      });
    }

    // Check existing
    const existingCustomer = await prisma.customer.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingCustomer) {
      return res.status(409).json({ ok: false, message: 'Account already exists' });
    }

    const existingLicense = await prisma.driverLicense.findUnique({
      where: { driver_license_no: licenseNumber },
    });
    if (existingLicense) {
      return res.status(409).json({ ok: false, message: 'Driver license already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create driverLicense record with the uploaded image URL
    await prisma.driverLicense.create({
      data: {
        driver_license_no: licenseNumber,
        expiry_date: new Date(licenseExpiry),
        restrictions: restrictions || 'None',
        dl_img_url: dl_img_url, // Store the Supabase URL
      },
    });

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        address,
        contact_no: contactNumber,
        email,
        username,
        password: hashedPassword,
        status: 'active',
        driver_license_no: licenseNumber,
        date_created: new Date(),
      },
    });

    console.log('Registration successful:', {
      customerId: customer.customer_id,
      licenseNumber,
      dl_img_url
    });

    return res.status(201).json({
      ok: true,
      message: 'Account created successfully',
      user: {
        id: customer.customer_id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        username: customer.username,
        license_number: licenseNumber,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ ok: false, message: 'Unique constraint failed' });
    }
    next(err);
  }
}

export { login, validateToken, register };