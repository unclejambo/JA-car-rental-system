import prisma from '../config/prisma.js';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper function to extract storage path from Supabase URL
const extractStoragePath = (url) => {
  if (!url) return null;
  try {
    // Supabase URLs follow pattern: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const publicIndex = pathSegments.findIndex(segment => segment === 'public');
    if (publicIndex !== -1 && publicIndex < pathSegments.length - 2) {
      // Skip 'public' and bucket name, return the rest as path
      return pathSegments.slice(publicIndex + 2).join('/');
    }
    return null;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
};

// Helper function to delete image from Supabase storage
const deleteImageFromStorage = async (imageUrl) => {
  if (!imageUrl) return;
  
  const path = extractStoragePath(imageUrl);
  if (!path) {
    console.log('Could not extract path from URL:', imageUrl);
    return;
  }

  try {
    const { error } = await supabase.storage
      .from('licenses')
      .remove([path]);

    if (error) {
      console.error('Error deleting image from storage:', error);
    } else {
      console.log('Successfully deleted image:', path);
    }
  } catch (error) {
    console.error('Error deleting image from storage:', error);
  }
};

// @desc    Get all cars
// @route   GET /cars
// @access  Public
export const getCars = async (req, res) => {
  try {
    const cars = await prisma.car.findMany();
    res.json(cars);
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
          in: ['Available', 'Rented', 'Maintenance'] // Include all except deleted/inactive
        }
      },
      orderBy: {
        car_id: 'asc'
      }
    });
    
    res.json(cars);
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
        console.error('File upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      imageUrl = publicUrlData.publicUrl;
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
    } = req.body;

    let imageUrl = car_img_url;

    // Handle file upload if new image is provided
    if (req.file) {
      // Get current car data to access old image URL
      const currentCar = await prisma.car.findUnique({
        where: { car_id: carId },
        select: { car_img_url: true }
      });

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
        console.error('File upload error:', error);
        return res.status(500).json({ error: 'Failed to upload image' });
      }

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      imageUrl = publicUrlData.publicUrl;

      // Delete old image after successful upload
      if (currentCar?.car_img_url && currentCar.car_img_url !== imageUrl) {
        await deleteImageFromStorage(currentCar.car_img_url);
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

    const updatedCar = await prisma.car.update({
      where: { car_id: carId },
      data: updateData,
    });
    res.json(updatedCar);
  } catch (error) {
    console.error('Error updating car:', error);
    res.status(500).json({ error: 'Failed to update car' });
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
