import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get return data for a specific booking
export const getReturnData = async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    // Get booking with release data
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(bookingId) },
      include: {
        releases: true,
        customer: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        car: {
          select: {
            car_id: true,
            make: true,
            model: true,
            mileage: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Debug: Log release image data
    console.log('Return data - booking.releases:', booking.releases);
    if (booking.releases && booking.releases.length > 0) {
      console.log('First release images:', {
        front_img: booking.releases[0].front_img,
        back_img: booking.releases[0].back_img,
        right_img: booking.releases[0].right_img,
        left_img: booking.releases[0].left_img
      });
    }

    // Get fees from ManageFees
    const fees = await prisma.manageFees.findMany();
    const feesObject = {};
    fees.forEach(fee => {
      feesObject[fee.fee_type] = fee.amount;
    });

    res.json({
      booking,
      fees: feesObject
    });
  } catch (error) {
    console.error('Error fetching return data:', error);
    res.status(500).json({ error: 'Failed to fetch return data' });
  }
};

// Submit return form
export const submitReturn = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      gasLevel,
      odometer,
      damageStatus,
      equipmentStatus,
      equip_others,
      isClean,
      hasStain,
      totalFees,
      paymentData
    } = req.body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get booking with release data
      const booking = await tx.booking.findUnique({
        where: { booking_id: parseInt(bookingId) },
        include: {
          releases: true,
          customer: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      const release = booking.releases[0];
      if (!release) {
        throw new Error('Release data not found');
      }

      // Calculate fees
      const fees = await tx.manageFees.findMany();
      const feesObject = {};
      fees.forEach(fee => {
        feesObject[fee.fee_type] = fee.amount;
      });

      let calculatedFees = 0;

      // Gas level fee calculation
      const gasLevelMap = { 'High': 3, 'Mid': 2, 'Low': 1 };
      const releaseGasLevel = gasLevelMap[release.gas_level] || 0;
      const returnGasLevel = gasLevelMap[gasLevel] || 0;
      
      if (releaseGasLevel > returnGasLevel) {
        const gasLevelDiff = releaseGasLevel - returnGasLevel;
        calculatedFees += gasLevelDiff * (feesObject.gas_level_fee || 0);
      }

      // Equipment loss fee calculation
      if (equipmentStatus === 'no' && equip_others && release.equip_others) {
        const releaseEquip = release.equip_others.split(',').map(item => item.trim().toLowerCase());
        const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase());
        
        let missingItems = 0;
        releaseEquip.forEach(item => {
          if (!returnEquip.includes(item)) {
            missingItems++;
          }
        });
        
        calculatedFees += missingItems * (feesObject.equipment_loss_fee || 0);
      }

      // Damage fee calculation
      if (damageStatus === 'minor') {
        calculatedFees += feesObject.damage_fee || 0;
      } else if (damageStatus === 'major') {
        calculatedFees += (feesObject.damage_fee || 0) * 3;
      }

      // Cleaning fee calculation
      if (!isClean) {
        let cleaningFee = feesObject.cleaning_fee || 0;
        if (hasStain) {
          cleaningFee += feesObject.stain_removal_fee || 0;
        }
        calculatedFees += cleaningFee;
      }

      // Create return record
      const returnRecord = await tx.return.create({
        data: {
          booking_id: parseInt(bookingId),
          damage_check: damageStatus,
          damage_img: damageImageFile ? `/uploads/licenses/return_images/${damageImageFile}` : null,
          equipment: equipmentStatus,
          gas_level: BigInt(returnGasLevel),
          odometer: BigInt(parseInt(odometer)),
          total_fee: calculatedFees,
          damage: damageStatus === 'noDamage' ? 'No_Damage' : 
                 damageStatus === 'minor' ? 'Minor' : 'Major'
        }
      });

      // Update car mileage
      await tx.car.update({
        where: { car_id: booking.car_id },
        data: { mileage: parseInt(odometer) }
      });

      // Update booking
      const newBalance = paymentData ? 0 : ((booking.balance || 0) + calculatedFees);
      const updatedBooking = await tx.booking.update({
        where: { booking_id: parseInt(bookingId) },
        data: {
          isReturned: true,
          booking_status: 'Completed',
          total_amount: (booking.total_amount || 0) + calculatedFees,
          balance: newBalance,
          payment_status: paymentData ? booking.payment_status : 
                         (newBalance > 0 ? 'Unpaid' : booking.payment_status)
        }
      });

      // If payment data is provided, create payment record
      if (paymentData) {
        await tx.payment.create({
          data: {
            booking_id: parseInt(bookingId),
            customer_id: booking.customer_id,
            description: 'Return fees payment',
            payment_method: paymentData.payment_method,
            gcash_no: paymentData.gcash_no,
            reference_no: paymentData.reference_no,
            amount: calculatedFees,
            paid_date: new Date(),
            balance: 0
          }
        });
      }

      return { returnRecord, updatedBooking, calculatedFees };
    });

    res.json({
      message: 'Return submitted successfully',
      return: result.returnRecord,
      booking: result.updatedBooking,
      totalFees: result.calculatedFees
    });

  } catch (error) {
    console.error('Error submitting return:', error);
    res.status(500).json({ error: 'Failed to submit return' });
  }
};

// Upload damage images
export const uploadDamageImage = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { damageType } = req.body; // 'major' or 'minor'
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Get booking and customer info
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(bookingId) },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Create filename
    const today = new Date().toISOString().split('T')[0];
    const customerName = `${booking.customer.first_name}_${booking.customer.last_name}`;
    const filename = `${today}_${bookingId}_${customerName}_${damageType}.jpg`;
    
    // Create directory if it doesn't exist
    const uploadDir = path.join(__dirname, '../../uploads/licenses/return_images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, req.file.buffer);

    // Store path for later use in return submission
    req.damageImagePath = `/uploads/licenses/return_images/${filename}`;

    res.json({
      message: 'Damage image uploaded successfully',
      imagePath: req.damageImagePath
    });

  } catch (error) {
    console.error('Error uploading damage image:', error);
    res.status(500).json({ error: 'Failed to upload damage image' });
  }
};

// Calculate return fees
export const calculateReturnFees = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      gasLevel,
      damageStatus,
      equipmentStatus,
      equip_others,
      isClean,
      hasStain
    } = req.body;

    // Debug: Log the received values
    console.log('Calculate fees - Received values:', {
      gasLevel,
      damageStatus,
      equipmentStatus,
      equip_others,
      isClean: isClean,
      isCleanType: typeof isClean,
      hasStain: hasStain,
      hasStainType: typeof hasStain
    });

    // Get booking with release data
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(bookingId) },
      include: {
        releases: true
      }
    });

    if (!booking || !booking.releases[0]) {
      return res.status(404).json({ error: 'Booking or release data not found' });
    }

    const release = booking.releases[0];

    // Get fees
    const fees = await prisma.manageFees.findMany();
    const feesObject = {};
    fees.forEach(fee => {
      feesObject[fee.fee_type] = fee.amount;
    });
    
    // Debug: Log available fees
    console.log('Available fees:', feesObject);

    let calculatedFees = {
      gasLevelFee: 0,
      equipmentLossFee: 0,
      damageFee: 0,
      cleaningFee: 0,
      total: 0
    };

    // Gas level fee calculation
    const gasLevelMap = { 'High': 3, 'Mid': 2, 'Low': 1 };
    const releaseGasLevel = gasLevelMap[release.gas_level] || 0;
    const returnGasLevel = gasLevelMap[gasLevel] || 0;
    
    if (releaseGasLevel > returnGasLevel) {
      const gasLevelDiff = releaseGasLevel - returnGasLevel;
      calculatedFees.gasLevelFee = gasLevelDiff * (feesObject.gas_level_fee || 0);
    }

    // Equipment loss fee calculation
    if (equipmentStatus === 'no' && equip_others && release.equip_others) {
      const releaseEquip = release.equip_others.split(',').map(item => item.trim().toLowerCase());
      const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase());
      
      let missingItems = 0;
      releaseEquip.forEach(item => {
        if (!returnEquip.includes(item)) {
          missingItems++;
        }
      });
      
      calculatedFees.equipmentLossFee = missingItems * (feesObject.equipment_loss_fee || 0);
    }

    // Damage fee calculation
    if (damageStatus === 'minor') {
      calculatedFees.damageFee = feesObject.damage_fee || 0;
    } else if (damageStatus === 'major') {
      calculatedFees.damageFee = (feesObject.damage_fee || 0) * 3;
    }

    // Cleaning fee calculation
    // Handle both boolean and string values for isClean
    const isNotClean = isClean === false || isClean === 'false';
    const hasStainValue = hasStain === true || hasStain === 'true';
    
    console.log('Cleaning fee calculation:', {
      isClean,
      isNotClean,
      hasStain,
      hasStainValue,
      cleaning_fee: feesObject.cleaning_fee,
      stain_removal_fee: feesObject.stain_removal_fee
    });
    
    if (isNotClean) {
      calculatedFees.cleaningFee = feesObject.cleaning_fee || 0;
      if (hasStainValue) {
        calculatedFees.cleaningFee += feesObject.stain_removal_fee || 0;
      }
    }

    // Calculate total
    calculatedFees.total = calculatedFees.gasLevelFee + 
                          calculatedFees.equipmentLossFee + 
                          calculatedFees.damageFee + 
                          calculatedFees.cleaningFee;

    // Debug: Log final calculated fees
    console.log('Final calculated fees:', calculatedFees);

    res.json({
      fees: calculatedFees,
      releaseData: {
        gas_level: release.gas_level,
        equip_others: release.equip_others,
        front_img: release.front_img,
        back_img: release.back_img,
        right_img: release.right_img,
        left_img: release.left_img
      }
    });

  } catch (error) {
    console.error('Error calculating return fees:', error);
    res.status(500).json({ error: 'Failed to calculate return fees' });
  }
};
