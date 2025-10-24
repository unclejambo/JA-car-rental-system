import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { uploadBufferToSupabase } from './storageController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/licenses');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `license-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, and JPG files are allowed'), false);
    }
  }
});

// Validation functions
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const phoneRe = /^[0-9+\-\s()]{7,20}$/;
  return phoneRe.test(phone);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateExpiryDate = (expiryDate) => {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return expiry > now;
};

// Main registration controller
export const registerUser = async (req, res) => {
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
      restrictions
    } = req.body;

    // Validation
    const errors = {};

    if (!email) errors.email = 'Email is required';
    else if (!validateEmail(email)) errors.email = 'Invalid email address';

    if (!username) errors.username = 'Username is required';
    if (!password) errors.password = 'Password is required';
    else if (!validatePassword(password)) errors.password = 'Password must be at least 6 characters';

    if (!firstName) errors.firstName = 'First name is required';
    if (!lastName) errors.lastName = 'Last name is required';
    if (!address) errors.address = 'Address is required';

    if (!contactNumber) errors.contactNumber = 'Contact number is required';
    else if (!validatePhone(contactNumber)) errors.contactNumber = 'Invalid contact number';

    if (!licenseNumber) errors.licenseNumber = 'License number is required';
    if (!licenseExpiry) errors.licenseExpiry = 'License expiry date is required';
    else if (!validateExpiryDate(licenseExpiry)) errors.licenseExpiry = 'License expiry date must be in the future';

    if (!req.file) errors.licenseFile = 'License image is required';

    if (Object.keys(errors).length > 0) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Check if user already exists
    const existingUser = await prisma.customer.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // Check if license number already exists
    const existingLicense = await prisma.driverLicense.findUnique({
      where: { driver_license_no: licenseNumber }
    });

    if (existingLicense) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(409).json({
        success: false,
        message: 'License number already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // ONLY UPLOAD TO SUPABASE AFTER ALL VALIDATIONS PASS
    // Prepare license image URL: upload local disk file to Supabase 'licenses/dl_img'
    let licenseImageUrl = null;
    if (req.file) {
      try {
        const file = req.file;
        const fileBuffer = await fs.promises.readFile(file.path);
        const timestamp = Date.now();
        const fileExt = file.originalname.split('.').pop();
        const filename = `${licenseNumber || 'license'}_${username || 'user'}_${timestamp}.${fileExt}`;
        const pathInBucket = `dl_img/${filename}`;

        const uploadResult = await uploadBufferToSupabase({
          bucket: 'licenses',
          path: pathInBucket,
          buffer: fileBuffer,
          contentType: file.mimetype,
          upsert: false
        });

        licenseImageUrl = uploadResult.publicUrl;
      } catch (uploadErr) {
        // Clean up local file and fail registration
        if (req.file) {
          fs.unlink(req.file.path, () => {});
        }
        return res.status(500).json({
          success: false,
          message: 'Failed to upload license image'
        });
      } finally {
        // remove local file (we don't need it after upload/fail)
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlink(req.file.path, () => {});
        }
      }
    }

    // Create driver license record
    const driverLicense = await prisma.driverLicense.create({
      data: {
        driver_license_no: licenseNumber,
        expiry_date: new Date(licenseExpiry),
        restrictions: restrictions || null,
        dl_img_url: licenseImageUrl
      }
    });

    // Create customer record
    const customer = await prisma.customer.create({
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        username: username,
        password: hashedPassword,
        address: address,
        contact_no: contactNumber,
        driver_license_no: licenseNumber,
        status: 'Active',
        date_created: new Date(),
        isRecUpdate: 3 // Enable both SMS and Email notifications by default
      }
    });

    // Return success response (don't send password back)
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        customer: {
          id: customer.customer_id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          username: customer.username
        }
      }
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// Get terms and conditions
export const getTermsAndConditions = async (req, res) => {
  try {
    const terms = [
      {
        title: "Cancellation Policy",
        content: [
          "1 month or more ahead of rental: FREE",
          "30 – 10 days ahead of rental: 1-day rental fee",
          "9 – 3 days ahead of rental: 50% of the total rental fee",
          "3 days or less & no show: 100% of rental fee",
          "Minimum cancellation fee is 1,000 pesos for any rule"
        ]
      },
      {
        title: "Vehicle Classes",
        content: [
          "Compact Manual (KIA RIO)",
          "Compact Automatic (MIRAGE G4)", 
          "Pick-up 5-seater Manual (NISSAN NAVARA)",
          "SUV 7-Seater Automatic (NISSAN TERRA)",
          "SUV 7-Seater Automatic (TOYOTA AVANZA)"
        ]
      },
      {
        title: "Rental Terms",
        content: [
          "No refund for early return",
          "Late return fee: 250 PHP per hour",
          "Returns over 2 hours late: full daily rate + compensation",
          "Vehicle considered stolen if delayed return exceeds 2 hours without notice"
        ]
      }
    ];

    res.json({
      success: true,
      data: { terms }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch terms and conditions'
    });
  }
};