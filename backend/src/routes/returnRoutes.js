import express from 'express';
import multer from 'multer';
import { 
  getReturnData, 
  submitReturn, 
  uploadDamageImage,
  calculateReturnFees 
} from '../controllers/returnController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();
const upload = multer(); // memory storage

// GET /returns/:bookingId - Get return data for a booking
router.get('/:bookingId', verifyToken, getReturnData);

// POST /returns/:bookingId/calculate-fees - Calculate return fees
router.post('/:bookingId/calculate-fees', verifyToken, calculateReturnFees);

// POST /returns/:bookingId/upload-damage-image - Upload damage image
router.post('/:bookingId/upload-damage-image', verifyToken, upload.single('damageImage'), uploadDamageImage);

// POST /returns/:bookingId - Submit return form
router.post('/:bookingId', verifyToken, submitReturn);

// POST /returns/test-cleaning - Test cleaning fee calculation
router.post('/test-cleaning', async (req, res) => {
  try {
    const { isClean, hasStain } = req.body;
    
    // Get fees
    const fees = await prisma.manageFees.findMany();
    const feesObject = {};
    fees.forEach(fee => {
      feesObject[fee.fee_type] = fee.amount;
    });
    
    // Test cleaning fee calculation
    const isNotClean = isClean === false || isClean === 'false';
    const hasStainValue = hasStain === true || hasStain === 'true';
    
    let cleaningFee = 0;
    if (isNotClean) {
      cleaningFee = feesObject.cleaning_fee || 0;
      if (hasStainValue) {
        cleaningFee += feesObject.stain_removal_fee || 0;
      }
    }
    
    res.json({
      received: { isClean, hasStain },
      types: { isCleanType: typeof isClean, hasStainType: typeof hasStain },
      processed: { isNotClean, hasStainValue },
      fees: { 
        cleaning_fee: feesObject.cleaning_fee,
        stain_removal_fee: feesObject.stain_removal_fee,
        calculated_cleaning_fee: cleaningFee
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
