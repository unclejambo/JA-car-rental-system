import express from 'express';
import { getAdmins, getAdminById, createAdmin, deleteAdmin, updateAdmin } from '../controllers/adminController.js';
import { adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/', adminOnly, getAdmins);
router.get('/:id', getAdminById);
router.post('/', createAdmin);
router.delete('/:id', deleteAdmin);
router.put('/:id', updateAdmin);

export default router;