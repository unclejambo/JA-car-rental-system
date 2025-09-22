import express from 'express';
import { registerUser, getTermsAndConditions } from '../controllers/registrationController.js';

const router = express.Router();

// POST /api/registration/register - Create new user account
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      address,
      contactNumber,
      licenseNumber,
      licenseExpiry,
      restrictions,
      dl_img_url,  // This should come from the previous file upload
      agreeTerms
    } = req.body;

    // Validate required fields
    if (!email || !username || !password || !firstName || !lastName || 
        !address || !contactNumber || !licenseNumber || !licenseExpiry || 
        !dl_img_url || !agreeTerms) {
      return res.status(400).json({ 
        error: 'All required fields must be provided' 
      });
    }

    // Your registration logic here...
    // Save user to database with dl_img_url

    res.status(201).json({ 
      message: 'Registration successful' 
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// GET /api/registration/terms - Get terms and conditions
router.get('/terms', getTermsAndConditions);

export default router;