import express from 'express';
import {
    getCustomers,
    getCustomerById,
    createCustomer,
    deleteCustomer,
    updateCustomer,
} from '../controllers/customerController.js';

const router = express.Router();

// Customer routes
// Use "/customers" as the base path for these routes
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.delete('/:id', deleteCustomer);
router.put('/:id', updateCustomer);

export default router;