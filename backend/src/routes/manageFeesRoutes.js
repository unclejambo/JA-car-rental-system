import express from 'express';
import { getFees, updateFees, initializeFees } from '../controllers/manageFeesController.js';
import { adminOrStaff } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

// Test database connection
router.get('/test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection test result:', result);
    
    // Test ManageFees table access
    const count = await prisma.manageFees.count();
    console.log('ManageFees table count:', count);
    
    res.json({ 
      message: 'Database connection successful', 
      test: result,
      feesCount: count
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      error: 'Database connection failed',
      details: error.message 
    });
  }
});

// Get all fees
router.get('/', adminOrStaff, getFees);

// Update fees
router.put('/', adminOrStaff, updateFees);

// Initialize default fees (for setup purposes)
router.post('/initialize', adminOrStaff, initializeFees);

export default router;
