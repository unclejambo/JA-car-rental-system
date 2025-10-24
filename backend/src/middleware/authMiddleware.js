import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ ok: false, message: 'Invalid or expired token' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }
};

// Middleware to check if user is customer
export const requireCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    next();
  } else {
    return res.status(403).json({ 
      ok: false, 
      message: 'Customer access required',
      currentRole: req.user?.role,
      hasUser: !!req.user
    });
  }
};

// Middleware to check if user is driver
export const requireDriver = (req, res, next) => {
  if (req.user && req.user.role === 'driver') {
    next();
  } else {
    return res.status(403).json({ ok: false, message: 'Driver access required' });
  }
};

// Combined middleware for admin-only routes
export const adminOnly = [verifyToken, requireAdmin];

// Combined middleware for customer-only routes
export const customerOnly = [verifyToken, requireCustomer];

// Combined middleware for driver-only routes
export const driverOnly = [verifyToken, requireDriver];

// Middleware to check if user is admin or staff
export const requireAdminOrStaff = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    next();
  } else {
    return res.status(403).json({ 
      ok: false, 
      message: 'Admin or staff access required',
      currentRole: req.user?.role,
      hasUser: !!req.user
    });
  }
};

// Combined middleware for admin or staff routes
export const adminOrStaff = [verifyToken, requireAdminOrStaff];