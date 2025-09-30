import prisma from '../config/prisma.js';

// Get all fees
export const getFees = async (req, res) => {
  try {
    console.log('Attempting to fetch fees from database...');
    const fees = await prisma.manageFees.findMany({
      orderBy: {
        fee_type: 'asc'
      }
    });
    console.log('Fetched fees from database:', fees);

    // Default fees in case database is empty
    const defaultFees = {
      reservation_fee: 1000,
      cleaning_fee: 200,
      driver_fee: 500,
      overdue_fee: 250,
      damage_fee: 5000,
      equipment_loss_fee: 500,
      gas_level_fee: 500,
      stain_removal_fee: 500,
      security_deposit_fee: 3000
    };

    // Convert array to object with fee_type as key for easier frontend usage
    const feesObject = { ...defaultFees };
    fees.forEach(fee => {
      feesObject[fee.fee_type] = fee.amount;
    });

    res.json(feesObject);
  } catch (error) {
    console.error('Error fetching fees:', error);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
};

// Update fees
export const updateFees = async (req, res) => {
  try {
    const feesData = req.body;
    
    // Validate that all required fee types are provided
    const requiredFeeTypes = [
      'reservation_fee',
      'cleaning_fee',
      'driver_fee',
      'overdue_fee',
      'damage_fee',
      'equipment_loss_fee',
      'gas_level_fee',
      'stain_removal_fee',
      'security_deposit_fee'
    ];

    // Validate input
    for (const feeType of requiredFeeTypes) {
      if (!feesData.hasOwnProperty(feeType)) {
        return res.status(400).json({ 
          error: `Missing required fee type: ${feeType}` 
        });
      }
      
      if (!Number.isInteger(Number(feesData[feeType])) || Number(feesData[feeType]) <= 0) {
        return res.status(400).json({ 
          error: `Invalid amount for ${feeType}. Must be a positive integer.` 
        });
      }
    }

    // Update or create each fee
    const updatePromises = requiredFeeTypes.map(async (feeType) => {
      try {
        // Try to find existing fee first
        const existingFee = await prisma.manageFees.findFirst({
          where: { fee_type: feeType }
        });

        if (existingFee) {
          // Update existing fee
          return await prisma.manageFees.update({
            where: { fee_id: existingFee.fee_id },
            data: { amount: parseInt(feesData[feeType]) }
          });
        } else {
          // Create new fee
          return await prisma.manageFees.create({
            data: {
              fee_type: feeType,
              amount: parseInt(feesData[feeType])
            }
          });
        }
      } catch (error) {
        console.error(`Error updating fee ${feeType}:`, error);
        throw error;
      }
    });

    await Promise.all(updatePromises);

    // Return updated fees
    const updatedFees = await prisma.manageFees.findMany({
      orderBy: {
        fee_type: 'asc'
      }
    });

    const feesObject = {};
    updatedFees.forEach(fee => {
      feesObject[fee.fee_type] = fee.amount;
    });

    res.json({
      message: 'Fees updated successfully',
      fees: feesObject
    });

  } catch (error) {
    console.error('Error updating fees:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to update fees',
      details: error.message 
    });
  }
};

// Initialize default fees if they don't exist
export const initializeFees = async (req, res) => {
  try {
    const defaultFees = [
      { fee_type: 'reservation_fee', amount: 500 },
      { fee_type: 'cleaning_fee', amount: 200 },
      { fee_type: 'driver_fee', amount: 1000 },
      { fee_type: 'overdue_fee', amount: 100 },
      { fee_type: 'damage_fee', amount: 10000 },
      { fee_type: 'equipment_loss_fee', amount: 1000 },
      { fee_type: 'gas_level_fee', amount: 300 },
      { fee_type: 'stain_removal_fee', amount: 500 },
      { fee_type: 'security_deposit_fee', amount: 5000 }
    ];

    const createPromises = defaultFees.map(async (fee) => {
      try {
        // Try to find existing fee first
        const existingFee = await prisma.manageFees.findFirst({
          where: { fee_type: fee.fee_type }
        });

        if (!existingFee) {
          // Create new fee only if it doesn't exist
          return await prisma.manageFees.create({
            data: fee
          });
        }
        return existingFee;
      } catch (error) {
        console.error(`Error initializing fee ${fee.fee_type}:`, error);
        throw error;
      }
    });

    await Promise.all(createPromises);

    res.json({ message: 'Default fees initialized successfully' });
  } catch (error) {
    console.error('Error initializing fees:', error);
    res.status(500).json({ error: 'Failed to initialize fees' });
  }
};
