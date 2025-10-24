import express from 'express';
import { getFees, updateFees, initializeFees } from '../controllers/manageFeesController.js';
import { verifyToken, adminOrStaff } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Test database connection
router.get('/test', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    // Test ManageFees table access
    const count = await prisma.manageFees.count();
    res.json({ 
      message: 'Database connection successful', 
      test: result,
      feesCount: count
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Get all fees (customers can read, but only admin/staff can update)
router.get('/', verifyToken, getFees);

// Update fees (admin/staff only)
router.put('/', verifyToken, adminOrStaff, updateFees);

// Initialize default fees (for setup purposes)
router.post('/initialize', verifyToken, adminOrStaff, initializeFees);

export default router;
