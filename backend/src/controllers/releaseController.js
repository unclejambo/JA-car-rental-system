import prisma from '../config/prisma.js';
import { uploadBufferToSupabase } from './storageController.js';

export const createRelease = async (req, res) => {
  try {
    const { 
      booking_id, 
      drivers_id, 
      equipment, 
      equip_others, 
      gas_level, 
      license_presented 
    } = req.body;

    if (!booking_id || !drivers_id) {
      return res.status(400).json({ 
        error: 'booking_id and drivers_id are required' 
      });
    }

    // Check if booking exists and get booking details with customer info
    const booking = await prisma.booking.findUnique({
      where: { booking_id: Number(booking_id) },
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

    // Check if driver exists
    const driver = await prisma.driver.findUnique({
      where: { drivers_id: Number(drivers_id) }
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Create the release record
    const release = await prisma.release.create({
      data: {
        booking_id: Number(booking_id),
        drivers_id: Number(drivers_id),
        equipment: equipment || null,
        equip_others: equip_others || null,
        gas_level: gas_level || null,
        license_presented: Boolean(license_presented)
      },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        driver: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    // Update the booking to set isRelease to true and status to In Progress
    const updatedBooking = await prisma.booking.update({
      where: { booking_id: Number(booking_id) },
      data: { 
        isRelease: true,
        booking_status: 'In Progress'
      }
    });

    // Update driver booking_status if driver is assigned
    if (updatedBooking.drivers_id) {
      try {
        await prisma.driver.update({
          where: { drivers_id: updatedBooking.drivers_id },
          data: { booking_status: 3 } // 3 = booking released and in progress
        });
      } catch (driverUpdateError) {
        // Don't fail the release if driver status update fails
      }
    }
    res.status(201).json({
      success: true,
      message: 'Release created successfully',
      release: {
        release_id: release.release_id,
        booking_id: release.booking_id,
        drivers_id: release.drivers_id,
        equipment: release.equipment,
        equip_others: release.equip_others,
        gas_level: release.gas_level,
        license_presented: release.license_presented,
        customer_name: `${release.booking.customer.first_name} ${release.booking.customer.last_name}`,
        driver_name: `${release.driver.first_name} ${release.driver.last_name}`
      }
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to create release',
      details: error.message 
    });
  }
};

export const uploadReleaseImages = async (req, res) => {
  try {
    const { release_id } = req.params;
    const { image_type, start_date, customer_first_name } = req.body;

    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    if (!release_id || !image_type || !start_date || !customer_first_name) {
      return res.status(400).json({ 
        error: 'release_id, image_type, start_date, and customer_first_name are required' 
      });
    }

    // Validate image_type
    const validImageTypes = ['id1', 'id2', 'front', 'back', 'right', 'left'];
    if (!validImageTypes.includes(image_type)) {
      return res.status(400).json({ 
        error: 'Invalid image_type. Must be one of: ' + validImageTypes.join(', ') 
      });
    }

    // Check if release exists
    const release = await prisma.release.findUnique({
      where: { release_id: Number(release_id) }
    });

    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }

    // Format the filename according to the specified format
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}`);
      }
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Sanitize customer first name for filename (remove special characters)
    const sanitizedCustomerName = customer_first_name.replace(/[^a-zA-Z0-9]/g, '') || 'customer';

    if (sanitizedCustomerName.length === 0) {
      throw new Error('Customer first name cannot be empty after sanitization');
    }

    const formattedDate = formatDate(start_date);
    const filename = `${formattedDate}_${image_type}_${sanitizedCustomerName}.jpg`;
    // Upload to Supabase
    const bucket = 'licenses';
    const path = `release_images/${filename}`;

    try {
      const { publicUrl } = await uploadBufferToSupabase({
        bucket,
        path,
        buffer: req.file.buffer,
        contentType: req.file.mimetype,
        upsert: false
      });

      // Update the release record with the image URL
      const updateData = {};
      switch (image_type) {
        case 'id1':
          updateData.valid_id_img1 = publicUrl;
          break;
        case 'id2':
          updateData.valid_id_img2 = publicUrl;
          break;
        case 'front':
          updateData.front_img = publicUrl;
          break;
        case 'back':
          updateData.back_img = publicUrl;
          break;
        case 'right':
          updateData.right_img = publicUrl;
          break;
        case 'left':
          updateData.left_img = publicUrl;
          break;
        default:
          throw new Error(`Invalid image_type: ${image_type}`);
      }

      const updatedRelease = await prisma.release.update({
        where: { release_id: Number(release_id) },
        data: updateData
      });

      res.status(200).json({
        success: true,
        message: 'Release image uploaded successfully',
        filename,
        publicUrl,
        image_type,
        release_id: updatedRelease.release_id
      });

    } catch (uploadError) {
      res.status(500).json({ 
        error: 'Failed to upload image to storage',
        details: uploadError.message 
      });
    }

  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to upload release image',
      details: error.message 
    });
  }
};

export const getReleases = async (req, res) => {
  try {
    const releases = await prisma.release.findMany({
      include: {
        booking: {
          include: {
            customer: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        driver: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      },
      orderBy: { release_id: 'desc' }
    });

    const formattedReleases = releases.map(release => ({
      release_id: release.release_id,
      booking_id: release.booking_id,
      drivers_id: release.drivers_id,
      equipment: release.equipment,
      equip_others: release.equip_others,
      gas_level: release.gas_level,
      license_presented: release.license_presented,
      valid_id_img1: release.valid_id_img1,
      valid_id_img2: release.valid_id_img2,
      front_img: release.front_img,
      back_img: release.back_img,
      right_img: release.right_img,
      left_img: release.left_img,
      customer_name: `${release.booking.customer.first_name} ${release.booking.customer.last_name}`,
      driver_name: `${release.driver.first_name} ${release.driver.last_name}`
    }));

    res.json(formattedReleases);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch releases',
      details: error.message 
    });
  }
};

export const getReleaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const release = await prisma.release.findUnique({
      where: { release_id: Number(id) },
      include: {
        booking: {
          include: {
            customer: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        },
        driver: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!release) {
      return res.status(404).json({ error: 'Release not found' });
    }

    const formattedRelease = {
      release_id: release.release_id,
      booking_id: release.booking_id,
      drivers_id: release.drivers_id,
      equipment: release.equipment,
      equip_others: release.equip_others,
      gas_level: release.gas_level,
      license_presented: release.license_presented,
      valid_id_img1: release.valid_id_img1,
      valid_id_img2: release.valid_id_img2,
      front_img: release.front_img,
      back_img: release.back_img,
      right_img: release.right_img,
      left_img: release.left_img,
      customer_name: `${release.booking.customer.first_name} ${release.booking.customer.last_name}`,
      driver_name: `${release.driver.first_name} ${release.driver.last_name}`
    };

    res.json(formattedRelease);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch release',
      details: error.message 
    });
  }
};
