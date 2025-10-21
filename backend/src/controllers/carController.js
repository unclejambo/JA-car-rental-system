import prisma from '../config/prisma.js';
import { createClient } from '@supabase/supabase-js';
import { notifyWaitlistOnCarAvailable } from './waitlistController.js';
import { getPaginationParams, getSortingParams, buildPaginationResponse, getSearchParam } from '../utils/pagination.js';
import { getUnavailablePeriods } from '../utils/bookingUtils.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Generate fresh signed URL for car image if it exists
 */
const refreshCarImageUrl = async (carImgUrl) => {
  if (!carImgUrl) return null;
  
  try {
    // Extract the path from the existing URL
    const urlParts = carImgUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'licenses');
    
    if (bucketIndex === -1) return carImgUrl;
    
    const encodedPath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
    
    // Decode URL encoding (e.g., %20 -> space)
    const path = decodeURIComponent(encodedPath);
    
    const { data: signedUrlData, error } = await supabase.storage
      .from('licenses')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration
    
    if (error) {
      console.error('Error refreshing car image signed URL:', error);
      return carImgUrl;
    }
    
    return signedUrlData.signedUrl;
  } catch (error) {
    console.error('Error parsing car image URL:', error);
    return carImgUrl;
  }
};

// Helper function to extract storage path from Supabase URL
const extractStoragePath = (url) => {
  if (!url) return null;
  try {
    // Handle both signed and public URLs
    // Signed: https://...supabase.co/storage/v1/object/sign/licenses/car_img/filename?token=...
    // Public: https://...supabase.co/storage/v1/object/public/licenses/car_img/filename
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'licenses');
    
    if (bucketIndex === -1) return null;
    
    // Get everything after 'licenses/', remove query params
    const encodedPath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
    
    // Decode URL encoding (e.g., %20 -> space)
    const decodedPath = decodeURIComponent(encodedPath);
    
    return decodedPath;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
};

// Helper function to delete image from Supabase storage
const deleteImageFromStorage = async (imageUrl) => {
  if (!imageUrl) {
    console.log('⚠️ No image URL provided for deletion');
    return;
  }
  
  try {
    console.log('🗑️ Attempting to delete old car image...');
    console.log('📎 Original URL:', imageUrl);
    
    const path = extractStoragePath(imageUrl);
    console.log('📁 Extracted path:', path);
    
    if (!path) {
      console.warn('❌ Could not extract path from URL:', imageUrl);
      return;
    }

    console.log('🔍 Attempting to remove from bucket "licenses" with path:', path);
    
    const { data, error } = await supabase.storage
      .from('licenses')
      .remove([path]);

    if (error) {
      console.error('❌ Supabase deletion error:', JSON.stringify(error, null, 2));
      console.error('Error details:', error);
    } else {
      console.log('✅ Old car image deleted successfully!');
      console.log('🗑️ Deleted data:', data);
    }
  } catch (error) {
    console.error('❌ Exception during deletion:', error);
    console.error('Error stack:', error.stack);
  }
};

// @desc    Get all cars
// @route   GET /cars
// @access  Public
// @desc    Get all cars with pagination (Admin)
// @route   GET /cars?page=1&pageSize=10&sortBy=car_id&sortOrder=asc&search=toyota&status=Available
// @access  Private/Admin
export const getCars = async (req, res) => {
  try {
    // Get pagination parameters
    const { page, pageSize, skip } = getPaginationParams(req);
    const { sortBy, sortOrder } = getSortingParams(req, 'car_id', 'asc');
    const search = getSearchParam(req);
    
    // Build where clause
    const where = {};
    
    // Search filter (make or model)
    if (search) {
      where.OR = [
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { license_plate: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Status filter
    if (req.query.status) {
      where.car_status = req.query.status;
    }
    
    // Car type filter
    if (req.query.car_type) {
      where.car_type = req.query.car_type;
    }

    // Get total count
    const total = await prisma.car.count({ where });

    // Get paginated cars
    const cars = await prisma.car.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
    });
    
    // Refresh signed URLs for car images
    const carsWithFreshUrls = await Promise.all(
      cars.map(async (car) => {
        if (car.car_img_url) {
          car.car_img_url = await refreshCarImageUrl(car.car_img_url);
        }
        return car;
      })
    );
    
    res.json(buildPaginationResponse(carsWithFreshUrls, total, page, pageSize));
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
};

// @desc    Get available cars for customers
// @route   GET /cars/available
// @access  Public
export const getAvailableCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany({
      where: {
        car_status: {
          in: ['Available'] // Include all except deleted/inactive
        }
      },
      orderBy: {
        car_id: 'asc'
      }
    });
    
    // Refresh signed URLs for car images
    const carsWithFreshUrls = await Promise.all(
      cars.map(async (car) => {
        if (car.car_img_url) {
          car.car_img_url = await refreshCarImageUrl(car.car_img_url);
        }
        return car;
      })
    );
    
    res.json(carsWithFreshUrls);
  } catch (error) {
    console.error('Error fetching available cars:', error);
    res.status(500).json({ error: 'Failed to fetch available cars' });
  }
};

// @desc    Get GPS info for a car
// @route   GET cars/:id/gps
// @access  Public
export const getCarGps = async (req, res) => {
  const carId = parseInt(req.params.id, 10);
  try {
    const car = await prisma.car.findUnique({ where: { car_id: carId } });
    if (!car) return res.status(404).json({ error: 'Car not found' });
    
    res.json({
      gpsDeviceId: car.gpsDeviceId,
      message: 'GPS integration coming soon!',
    });
  } catch (error) {
    console.error('Error fetching car GPS:', error);
    res.status(500).json({ error: 'Failed to fetch car GPS' });
  }
};

// @desc    Create a car
// @route   POST /cars
// @access  Private/Admin
export const createCar = async (req, res) => {
  try {
    const {
      make,
      model,
      car_type,
      year,
      license_plate,
      no_of_seat,
      rent_price,
      car_status,
      car_img_url,
      mileage,
    } = req.body;

    let imageUrl = car_img_url;

    // Handle file upload if image is provided
    if (req.file) {
      console.log('🚀 Uploading new car image to Supabase');
      
      const file = req.file;
      const timestamp = Date.now();
      const fileExt = file.originalname.split('.').pop();
      const filename = `${make || 'car'}_${model || 'unknown'}_${license_plate || 'unknown'}_${timestamp}.${fileExt}`;
      
      const bucket = 'licenses';
      const path = `car_img/${filename}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, { 
          contentType: file.mimetype, 
          upsert: false 
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      // For private buckets, generate a signed URL with long expiration
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration

      if (signedUrlError) {
        console.error('Supabase signed URL error:', signedUrlError);
        return res.status(500).json({ error: 'Failed to generate image URL' });
      }

      imageUrl = signedUrlData.signedUrl;
      console.log('✅ Car image uploaded successfully');
    }

    const newCar = await prisma.car.create({
      data: {
        make,
        model,
        car_type,
        year: year ? parseInt(year) : null,
        license_plate,
        no_of_seat: no_of_seat ? parseInt(no_of_seat) : null,
        rent_price: rent_price ? parseFloat(rent_price) : null,
        car_status: car_status || 'Available',
        car_img_url: imageUrl,
        mileage: mileage ? parseFloat(mileage) : null,
      },
    });
    res.status(201).json(newCar);
  } catch (error) {
    console.error('Error creating car:', error);
    res.status(500).json({ error: 'Failed to create car' });
  }
};

// @desc    Update a car
// @route   PUT /cars/:id
// @access  Private/Admin
export const updateCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    const {
      make,
      model,
      car_type,
      year,
      license_plate,
      no_of_seat,
      rent_price,
      car_status,
      car_img_url,
      mileage,
      hasGPS,
    } = req.body;

    let imageUrl = car_img_url;

    // Handle file upload if new image is provided
    if (req.file) {
      console.log('📤 New car image detected, updating...');
      
      // Get current car data to access old image URL
      const currentCar = await prisma.car.findUnique({
        where: { car_id: carId },
        select: { car_img_url: true }
      });

      console.log('📸 Current car image URL from DB:', currentCar?.car_img_url);

      const file = req.file;
      const timestamp = Date.now();
      const fileExt = file.originalname.split('.').pop();
      const filename = `${make || 'car'}_${model || 'unknown'}_${license_plate || 'unknown'}_${timestamp}.${fileExt}`;
      
      const bucket = 'licenses';
      const path = `car_img/${filename}`;

      console.log('⬆️ Uploading to Supabase:', { bucket, path });

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file.buffer, { 
          contentType: file.mimetype, 
          upsert: false 
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      // For private buckets, generate a signed URL with long expiration
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration

      if (signedUrlError) {
        console.error('Supabase signed URL error:', signedUrlError);
        return res.status(500).json({ error: 'Failed to generate image URL' });
      }

      imageUrl = signedUrlData.signedUrl;
      console.log('✅ Car image uploaded successfully');
      console.log('🆕 New image URL:', imageUrl);

      // Delete old image after successful upload
      if (currentCar?.car_img_url) {
        console.log('🔄 Now deleting old image...');
        await deleteImageFromStorage(currentCar.car_img_url);
      } else {
        console.log('ℹ️ No old image to delete');
      }
    }

    // Build update data object, only including fields that are provided
    const updateData = {};
    if (make !== undefined) updateData.make = make;
    if (model !== undefined) updateData.model = model;
    if (car_type !== undefined) updateData.car_type = car_type;
    if (year !== undefined) updateData.year = year ? parseInt(year) : null;
    if (license_plate !== undefined) updateData.license_plate = license_plate;
    if (no_of_seat !== undefined) updateData.no_of_seat = no_of_seat ? parseInt(no_of_seat) : null;
    if (rent_price !== undefined) updateData.rent_price = rent_price ? parseFloat(rent_price) : null;
    if (car_status !== undefined) updateData.car_status = car_status;
    if (imageUrl !== undefined) updateData.car_img_url = imageUrl;
    if (mileage !== undefined) updateData.mileage = mileage ? parseFloat(mileage) : null;
    if (hasGPS !== undefined) updateData.hasGPS = hasGPS === true || hasGPS === 'true';

    // Get current status before update to detect changes
    const currentCar = await prisma.car.findUnique({
      where: { car_id: carId },
      select: { car_status: true }
    });

    const updatedCar = await prisma.car.update({
      where: { car_id: carId },
      data: updateData,
    });
    
    // Check if car status changed to "Available" - notify waitlist
    if (car_status && car_status === 'Available' && currentCar?.car_status !== 'Available') {
      console.log(`\n🚗 Car ${carId} status changed to "Available" - checking waitlist...`);
      
      // Trigger waitlist notifications asynchronously (don't wait for it)
      notifyWaitlistOnCarAvailable(carId)
        .then(result => {
          if (result.success && result.notified > 0) {
            console.log(`✅ Waitlist notification complete: ${result.notified} customer(s) notified`);
          }
        })
        .catch(error => {
          console.error('❌ Error in waitlist notification:', error);
        });
    }
    
    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
  }
};

// @desc    Get unavailable periods for a car (existing bookings + maintenance days)
// @route   GET /cars/:id/unavailable-periods
// @access  Public
export const getCarUnavailablePeriods = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    
    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { car_id: carId },
      select: { car_id: true, make: true, model: true, year: true, car_status: true }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Get all active bookings for this car
    // Include: Pending (unpaid but reserved), Confirmed (paid), In Progress (currently rented)
    // Exclude: Cancelled, Rejected, Returned, Completed
    const bookings = await prisma.booking.findMany({
      where: {
        car_id: carId,
        booking_status: {
          in: ['Pending', 'Confirmed', 'In Progress']
        },
        isCancel: false
      },
      select: {
        booking_id: true,
        start_date: true,
        end_date: true,
        booking_status: true,
        payment_status: true
      },
      orderBy: {
        start_date: 'asc'
      }
    });

    // Calculate unavailable periods including 1-day maintenance after each booking
    const unavailablePeriods = getUnavailablePeriods(bookings, 1);
    
    // Get today's date to determine if booking is current or future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Format response with additional details
    const formattedPeriods = unavailablePeriods.map(period => {
      const startDate = new Date(period.start_date);
      const endDate = new Date(period.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      // Determine if this is a current rental (today is between start and end)
      const isCurrentlyRented = today >= startDate && today <= endDate && !period.is_maintenance;
      
      // Find the booking to get its status
      const booking = bookings.find(b => b.booking_id === period.booking_id);
      
      return {
        start_date: period.start_date,
        end_date: period.end_date,
        reason: period.reason,
        is_maintenance: period.is_maintenance || false,
        is_currently_rented: isCurrentlyRented,
        booking_status: booking?.booking_status || null,
        payment_status: booking?.payment_status || null,
        booking_id: period.booking_id || null
      };
    });

    res.json({
      car_id: carId,
      car_info: {
        make: car.make,
        model: car.model,
        year: car.year,
        status: car.car_status
      },
      unavailable_periods: formattedPeriods,
      total_blocked_periods: formattedPeriods.length,
      active_bookings: bookings.length
    });
  } catch (error) {
    console.error('Error fetching unavailable periods:', error);
    res.status(500).json({ error: 'Failed to fetch unavailable periods' });
  }
};

// @desc    Delete a car
// @route   DELETE /cars/:id
// @access  Private/Admin
export const deleteCar = async (req, res) => {
  try {
    const carId = parseInt(req.params.id);
    
    // Get car data to access image URL before deletion
    const car = await prisma.car.findUnique({
      where: { car_id: carId },
      select: { car_img_url: true }
    });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    // Delete car from database
    await prisma.car.delete({
      where: { car_id: carId },
    });

    // Delete associated image from storage
    if (car.car_img_url) {
      await deleteImageFromStorage(car.car_img_url);
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting car:', error);
    res.status(500).json({ error: 'Failed to delete car' });
  }
};
