import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

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
        role = 'admin';
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

export { login, validateToken };