import express from 'express';
import { registerUser, getTermsAndConditions, upload } from '../controllers/registrationController.js';

const router = express.Router();

// POST /api/registration/register - Create new user account with file upload
router.post('/register', upload.single('licenseFile'), registerUser);

// GET /api/registration/terms - Get terms and conditions
router.get('/terms', getTermsAndConditions);

export default router;