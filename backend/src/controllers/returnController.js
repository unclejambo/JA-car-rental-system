import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Helper function to generate signed URL for release images
 */
async function getSignedReleaseImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  try {
    // Extract the path from the URL if it's already a full URL
    let path = imageUrl;
    if (imageUrl.includes('/release_images/')) {
      path = imageUrl.split('/release_images/')[1];
      // Decode any URL-encoded characters
      path = decodeURIComponent(path);
    }
    
    const { data, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(`release_images/${path}`, 60 * 60 * 24 * 365); // 1 year
    
    if (error) {
      console.error('Error generating signed URL for:', path, error);
      return imageUrl; // Return original URL as fallback
    }
    
    return data.signedUrl;
  } catch (err) {
    console.error('Exception generating signed URL:', err);
    return imageUrl; // Return original URL as fallback
  }
}

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
      console.log('First release images (before signed URLs):', {
        front_img: booking.releases[0].front_img,
        back_img: booking.releases[0].back_img,
        right_img: booking.releases[0].right_img,
        left_img: booking.releases[0].left_img
      });
    }

    // Generate signed URLs for release images
    if (booking.releases && booking.releases.length > 0) {
      const releasesWithSignedUrls = await Promise.all(
        booking.releases.map(async (release) => {
          const [front_img, back_img, right_img, left_img, valid_id_img1, valid_id_img2] = await Promise.all([
            getSignedReleaseImageUrl(release.front_img),
            getSignedReleaseImageUrl(release.back_img),
            getSignedReleaseImageUrl(release.right_img),
            getSignedReleaseImageUrl(release.left_img),
            getSignedReleaseImageUrl(release.valid_id_img1),
            getSignedReleaseImageUrl(release.valid_id_img2)
          ]);

          return {
            ...release,
            front_img,
            back_img,
            right_img,
            left_img,
            valid_id_img1,
            valid_id_img2
          };
        })
      );

      booking.releases = releasesWithSignedUrls;

      console.log('First release images (after signed URLs):', {
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
      paymentData,
      damageImageUrl // Add this to receive the uploaded image URL
    } = req.body;

    console.log('📝 Submitting return for booking:', bookingId);
    console.log('Return data:', {
      gasLevel,
      odometer,
      damageStatus,
      equipmentStatus,
      equip_others,
      isClean,
      hasStain,
      damageImageUrl
    });

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
      // Check if release equipment was complete and return equipment status
      // If release.equipment = 'complete' and return equipmentStatus = 'no', charge for items in equip_others
      if (release.equipment === 'complete' && equipmentStatus === 'no' && equip_others) {
        // All items in return equip_others are damaged/missing since release was complete
        const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
        const lostItemCount = returnEquip.length;
        
        console.log('Equipment check (submit - release was complete):', {
          releaseEquipmentStatus: release.equipment,
          returnEquipmentStatus: equipmentStatus,
          damagedItems: returnEquip,
          lostItemCount
        });
        
        calculatedFees += lostItemCount * (feesObject.equipment_loss_fee || 0);
      } 
      // If release already had issues, compare release equip_others with return equip_others
      else if (release.equipment !== 'complete' && equipmentStatus === 'no' && equip_others && release.equip_others) {
        const releaseEquip = release.equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
        const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
        
        // Find NEW items that are in return but NOT in release (newly damaged/missing items)
        const newItems = returnEquip.filter(item => !releaseEquip.includes(item));
        const lostItemCount = newItems.length;
        
        console.log('Equipment check (submit - release had issues):', {
          releaseEquip,
          returnEquip,
          newItems,
          lostItemCount
        });
        
        calculatedFees += lostItemCount * (feesObject.equipment_loss_fee || 0);
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
          damage_check: damageStatus === 'noDamage' ? 'No Damage' : damageStatus,
          damage_img: damageImageUrl || null, // Use the uploaded image URL
          equipment: equipmentStatus,
          equip_others: equip_others || null,
          gas_level: gasLevel,
          odometer: BigInt(parseInt(odometer)),
          total_fee: calculatedFees,
          isClean: isClean === true || isClean === 'true',
          hasStain: hasStain === true || hasStain === 'true'
        }
      });

      console.log('✅ Return record created:', returnRecord);

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

      // Create transaction record
      // For completed bookings, use today's date as completion_date
      // For cancelled bookings (handled elsewhere), use cancellation_date
      await tx.transaction.create({
        data: {
          booking_id: parseInt(bookingId),
          customer_id: booking.customer_id,
          car_id: booking.car_id,
          completion_date: new Date(), // Set to current date since booking is being completed
          cancellation_date: null // This is a completion, not a cancellation
        }
      });

      console.log('✅ Transaction record created for completed booking');

      return { returnRecord, updatedBooking, calculatedFees };
    });

    // Convert BigInt fields to strings for JSON serialization
    const serializableReturn = {
      ...result.returnRecord,
      return_id: result.returnRecord.return_id.toString(),
      odometer: result.returnRecord.odometer ? result.returnRecord.odometer.toString() : null,
      booking_id: result.returnRecord.booking_id
    };

    res.json({
      message: 'Return submitted successfully',
      return: serializableReturn,
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

    if (!damageType || (damageType !== 'major' && damageType !== 'minor')) {
      return res.status(400).json({ error: 'Invalid damage type. Must be "major" or "minor"' });
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

    // Create filename with specified format: {today's date}_{booking ID}_{Customer firstname}_{Major/Minor Damages}.jpg
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const customerFirstName = booking.customer.first_name.replace(/[^a-zA-Z0-9]/g, ''); // Sanitize
    const damageLevel = damageType.charAt(0).toUpperCase() + damageType.slice(1); // Capitalize
    const filename = `${today}_${bookingId}_${customerFirstName}_${damageLevel}_Damages.jpg`;

    console.log('📸 Uploading damage image:', filename);

    // Upload to Supabase storage: licenses/return_images/
    const bucket = 'licenses';
    const storagePath = `return_images/${filename}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        return res.status(500).json({ 
          error: 'Failed to upload image to storage',
          details: uploadError.message 
        });
      }

      console.log('✅ Damage image uploaded to:', storagePath);

      // Generate a signed URL for the private bucket (1 year expiration)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

      if (signedUrlError) {
        console.error('❌ Error generating signed URL:', signedUrlError);
        // Still return success with the storage path
        return res.json({
          success: true,
          message: 'Damage image uploaded successfully',
          imagePath: storagePath,
          filename: filename
        });
      }

      console.log('✅ Signed URL generated:', signedUrlData.signedUrl);

      res.json({
        success: true,
        message: 'Damage image uploaded successfully',
        imagePath: signedUrlData.signedUrl,
        storagePath: storagePath,
        filename: filename
      });

    } catch (uploadError) {
      console.error('❌ Error uploading to Supabase:', uploadError);
      return res.status(500).json({ 
        error: 'Failed to upload image to storage',
        details: uploadError.message 
      });
    }

  } catch (error) {
    console.error('❌ Error uploading damage image:', error);
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
    // Check if release equipment was complete and return equipment status
    // If release.equipment = 'complete' and return equipmentStatus = 'no', charge for items in equip_others
    if (release.equipment === 'complete' && equipmentStatus === 'no' && equip_others) {
      // All items in return equip_others are damaged/missing since release was complete
      const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
      const lostItemCount = returnEquip.length;
      
      console.log('Equipment check (release was complete):', {
        releaseEquipmentStatus: release.equipment,
        returnEquipmentStatus: equipmentStatus,
        damagedItems: returnEquip,
        lostItemCount
      });
      
      calculatedFees.equipmentLossFee = lostItemCount * (feesObject.equipment_loss_fee || 0);
    } 
    // If release already had issues, compare release equip_others with return equip_others
    else if (release.equipment !== 'complete' && equipmentStatus === 'no' && equip_others && release.equip_others) {
      const releaseEquip = release.equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
      const returnEquip = equip_others.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
      
      // Find NEW items that are in return but NOT in release (newly damaged/missing items)
      const newItems = returnEquip.filter(item => !releaseEquip.includes(item));
      const lostItemCount = newItems.length;
      
      console.log('Equipment check (release had issues):', {
        releaseEquip,
        returnEquip,
        newItems,
        lostItemCount
      });
      
      calculatedFees.equipmentLossFee = lostItemCount * (feesObject.equipment_loss_fee || 0);
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
