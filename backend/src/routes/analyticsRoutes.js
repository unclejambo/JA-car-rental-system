import express from 'express';
import {
  getIncomeData,
  getExpensesData,
  getRefundsData,
  getTopCarsData,
  getTopCustomersData,
  getAvailableYears
} from '../controllers/analyticsController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all analytics routes with authentication
router.use(verifyToken);

// GET /analytics/income?period=monthly&year=2024&month=5
router.get('/income', getIncomeData);

// GET /analytics/expenses?period=quarterly&year=2024&quarter=1
router.get('/expenses', getExpensesData);

// GET /analytics/refunds?period=quarterly&year=2024&quarter=1
router.get('/refunds', getRefundsData);

// GET /analytics/top-cars?period=yearly&year=2024
router.get('/top-cars', getTopCarsData);

// GET /analytics/top-customers?period=monthly&year=2024&month=3
router.get('/top-customers', getTopCustomersData);

// GET /analytics/years - Get available years for dropdown
router.get('/years', getAvailableYears);

export default router;