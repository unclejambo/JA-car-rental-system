import { createClient } from '@supabase/supabase-js';
import prisma from '../config/prisma.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function uploadLicense(req, res, next) {
  try {
    console.log('--- LICENSE UPLOAD ROUTE CALLED ---');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No file uploaded',
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    const { licenseNumber, username } = req.body;
    
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const filename = `${licenseNumber || 'license'}_${username || 'user'}_${timestamp}.${fileExt}`;
    
    const bucket = 'licenses';
    const path = `dl_img/${filename}`;

    console.log('Uploading to Supabase:', { bucket, path, size: file.size });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { 
        contentType: file.mimetype, 
        upsert: false 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error,
        message: error.message || 'Upload failed'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const responseData = { 
      ok: true,
      message: 'File uploaded successfully',
      filePath: publicUrlData.publicUrl,
      path: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
      publicUrl: publicUrlData.publicUrl,  // Add this field
      filename: filename,
      originalName: file.originalname,
      size: file.size,
      supabaseData: data
    };

    console.log('Upload response being sent:', responseData);
    
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Upload failed',
      message: err.message || 'Upload failed'
    });
  }
}

export async function uploadImage(req, res, next) {
  try {
    console.log('--- IMAGE UPLOAD ROUTE CALLED ---');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No file uploaded',
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const filename = `car_image_${timestamp}.${fileExt}`;
    
    // store in the 'licenses' bucket under car_img/
    const bucket = 'licenses';
    const path = `car_img/${filename}`;

    console.log('Uploading car image to Supabase:', { bucket, path, size: file.size });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { 
        contentType: file.mimetype, 
        upsert: false 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error,
        message: error.message || 'Upload failed'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const responseData = { 
      ok: true,
      message: 'File uploaded successfully',
      filePath: publicUrlData.publicUrl,
      path: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
      publicUrl: publicUrlData.publicUrl,
      filename: filename,
      originalName: file.originalname,
      size: file.size,
      supabaseData: data
    };

    console.log('Upload response being sent:', responseData);
    
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Upload failed',
      message: err.message || 'Upload failed'
    });
  }
}

export async function uploadCarImage(req, res, next) {
  try {
    console.log('--- CAR IMAGE UPLOAD ROUTE CALLED ---');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No file uploaded',
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    const { make, model, licensePlate } = req.body;
    
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    // Create a descriptive filename with car info
    const filename = `${make || 'car'}_${model || 'unknown'}_${licensePlate || 'unknown'}_${timestamp}.${fileExt}`;
    
    // use 'licenses' bucket and car_img/ prefix
    const bucket = 'licenses';
    const path = `car_img/${filename}`;

    console.log('Uploading car image to Supabase:', { bucket, path, size: file.size });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { 
        contentType: file.mimetype, 
        upsert: false 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error,
        message: error.message || 'Upload failed'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const responseData = { 
      ok: true,
      message: 'Car image uploaded successfully',
      filePath: publicUrlData.publicUrl,
      path: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
      publicUrl: publicUrlData.publicUrl,
      filename: filename,
      originalName: file.originalname,
      size: file.size,
      supabaseData: data
    };

    console.log('Car image upload response being sent:', responseData);
    
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Upload failed',
      message: err.message || 'Upload failed'
    });
  }
}

export async function uploadReleaseImage(req, res, next) {
  try {
    console.log('--- RELEASE IMAGE UPLOAD ROUTE CALLED ---');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No file uploaded',
        message: 'No file uploaded' 
      });
    }

    const file = req.file;
    const { filename } = req.body;
    
    // Use the provided filename or generate one
    const finalFilename = filename || `release_image_${Date.now()}.jpg`;
    
    const bucket = 'licenses';
    const path = `release_images/${finalFilename}`;

    console.log('Uploading release image to Supabase:', { bucket, path, size: file.size });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { 
        contentType: file.mimetype, 
        upsert: false 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error,
        message: error.message || 'Upload failed'
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const responseData = { 
      ok: true,
      message: 'Release image uploaded successfully',
      filePath: publicUrlData.publicUrl,
      path: publicUrlData.publicUrl,
      url: publicUrlData.publicUrl,
      publicUrl: publicUrlData.publicUrl,
      filename: finalFilename,
      originalName: file.originalname,
      size: file.size,
      supabaseData: data
    };

    console.log('Release image upload response being sent:', responseData);
    
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Upload failed',
      message: err.message || 'Upload failed'
    });
  }
}

export async function uploadProfileImage(req, res, next) {
  try {
    console.log('--- PROFILE IMAGE UPLOAD ROUTE CALLED ---');
    console.log('File received:', req.file ? 'YES' : 'NO');
    console.log('Body:', req.body);
    console.log('User from JWT:', req.user);

    if (!req.file) {
      return res.status(400).json({ 
        ok: false, 
        error: 'No file uploaded',
        message: 'No file uploaded' 
      });
    }

    // Get user ID and role from JWT token (set by auth middleware)
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required',
        message: 'User ID not found in token'
      });
    }

    const file = req.file;
    
    // Determine which table to query based on user role
    let currentUser;
    let whereClause;
    let selectClause;
    
    if (userRole === 'customer') {
      whereClause = { customer_id: parseInt(userId) };
      selectClause = { profile_img_url: true };
      currentUser = await prisma.customer.findUnique({
        where: whereClause,
        select: selectClause
      });
    } else if (userRole === 'driver') {
      whereClause = { drivers_id: parseInt(userId) }; // Note: drivers_id (plural) in schema
      selectClause = { profile_img_url: true };
      currentUser = await prisma.driver.findUnique({
        where: whereClause,
        select: selectClause
      });
    } else {
      // Default to admin for admin/staff roles
      whereClause = { admin_id: parseInt(userId) };
      selectClause = { profile_img_url: true };
      currentUser = await prisma.admin.findUnique({
        where: whereClause,
        select: selectClause
      });
    }

    // Delete old profile image if exists
    if (currentUser?.profile_img_url) {
      try {
        console.log('🗑️ Deleting old profile image:', currentUser.profile_img_url);
        
        // Extract the path from the existing URL
        const urlParts = currentUser.profile_img_url.split('/');
        const bucketIndex = urlParts.findIndex(part => part === 'licenses');
        
        if (bucketIndex !== -1) {
          const oldPath = urlParts.slice(bucketIndex + 1).join('/').split('?')[0]; // Remove query params
          
          const { error: deleteError } = await supabase.storage
            .from('licenses')
            .remove([oldPath]);
            
          if (deleteError) {
            console.warn('Warning: Could not delete old profile image:', deleteError);
            // Continue with upload even if deletion fails
          } else {
            console.log('✅ Old profile image deleted successfully');
          }
        }
      } catch (deleteErr) {
        console.warn('Warning: Error deleting old profile image:', deleteErr);
        // Continue with upload even if deletion fails
      }
    }
    
    const timestamp = Date.now();
    const fileExt = file.originalname.split('.').pop();
    const filename = `${userRole}_${userId}_profile_${timestamp}.${fileExt}`;
    
    const bucket = 'licenses';
    const path = `profile_img/${filename}`;

    console.log('🚀 Uploading new profile image to Supabase:', { bucket, path, size: file.size, userRole });

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { 
        contentType: file.mimetype, 
        upsert: false 
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ 
        ok: false, 
        error: error.message || error,
        message: error.message || 'Upload failed'
      });
    }

    // For private buckets, generate a signed URL with long expiration
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year expiration

    if (signedUrlError) {
      console.error('Supabase signed URL error:', signedUrlError);
      return res.status(500).json({ 
        ok: false, 
        error: signedUrlError.message || signedUrlError,
        message: 'Failed to generate image URL'
      });
    }

    const imageUrl = signedUrlData.signedUrl;
    
    // Update user profile with new image URL based on role
    console.log('Updating user profile with image URL:', { userId, userRole, imageUrl });
    
    let updatedUser;
    if (userRole === 'customer') {
      updatedUser = await prisma.customer.update({
        where: { customer_id: parseInt(userId) },
        data: { profile_img_url: imageUrl },
        select: {
          customer_id: true,
          first_name: true,
          last_name: true,
          profile_img_url: true
        }
      });
    } else if (userRole === 'driver') {
      updatedUser = await prisma.driver.update({
        where: { drivers_id: parseInt(userId) }, // Note: drivers_id (plural) in schema
        data: { profile_img_url: imageUrl },
        select: {
          drivers_id: true,
          first_name: true,
          last_name: true,
          profile_img_url: true
        }
      });
    } else {
      updatedUser = await prisma.admin.update({
        where: { admin_id: parseInt(userId) },
        data: { profile_img_url: imageUrl },
        select: {
          admin_id: true,
          first_name: true,
          last_name: true,
          profile_img_url: true
        }
      });
    }

    console.log('User profile updated successfully:', updatedUser);

    const responseData = { 
      ok: true,
      success: true,
      message: 'Profile image uploaded and saved successfully',
      data: {
        fileName: filename,
        url: imageUrl,
        filePath: imageUrl,
        path: imageUrl,
        publicUrl: imageUrl,
        originalName: file.originalname,
        size: file.size,
        user: updatedUser,
        userRole: userRole
      }
    };

    console.log('Profile image upload response being sent:', responseData);
    
    return res.status(200).json(responseData);

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Upload failed',
      message: err.message || 'Upload failed'
    });
  }
}

export async function deleteProfileImage(req, res, next) {
  try {
    console.log('--- PROFILE IMAGE DELETE ROUTE CALLED ---');
    console.log('Body:', req.body);

    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        ok: false,
        error: 'File path is required',
        message: 'File path is required'
      });
    }

    // Extract the path from the full URL - handle both signed URLs and public URLs
    let path;
    const bucket = 'licenses';
    
    if (filePath.includes('/storage/v1/object/public/licenses/')) {
      // Public URL format: https://[project].supabase.co/storage/v1/object/public/licenses/profile_img/filename.jpg
      const urlParts = filePath.split('/storage/v1/object/public/licenses/');
      if (urlParts.length === 2) {
        path = urlParts[1];
      }
    } else if (filePath.includes('/storage/v1/object/sign/licenses/')) {
      // Signed URL format: https://[project].supabase.co/storage/v1/object/sign/licenses/profile_img/filename?token=...
      const urlParts = filePath.split('/storage/v1/object/sign/licenses/');
      if (urlParts.length === 2) {
        path = urlParts[1].split('?')[0]; // Remove query parameters
      }
    } else {
      // Try to extract using our helper method (same as in adminProfileController)
      const urlParts = filePath.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'licenses');
      
      if (bucketIndex !== -1) {
        path = urlParts.slice(bucketIndex + 1).join('/').split('?')[0];
      }
    }
    
    if (!path) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid file path format',
        message: 'Could not extract file path from URL'
      });
    }

    console.log('Deleting profile image from Supabase:', { bucket, path });

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || error,
        message: error.message || 'Delete failed'
      });
    }

    // If this is called manually (not during upload), also clear the user's profile_img_url
    // Get user ID and role from JWT token if available
    const userId = req.user?.sub;
    const userRole = req.user?.role;
    
    if (userId && userRole) {
      try {
        if (userRole === 'customer') {
          await prisma.customer.update({
            where: { customer_id: parseInt(userId) },
            data: { profile_img_url: null }
          });
        } else if (userRole === 'driver') {
          await prisma.driver.update({
            where: { drivers_id: parseInt(userId) }, // Note: drivers_id (plural) in schema
            data: { profile_img_url: null }
          });
        } else {
          await prisma.admin.update({
            where: { admin_id: parseInt(userId) },
            data: { profile_img_url: null }
          });
        }
        console.log(`✅ ${userRole} profile_img_url cleared from database`);
      } catch (dbError) {
        console.warn('Warning: Could not clear profile_img_url from database:', dbError);
        // Don't fail the request if database update fails
      }
    }

    return res.status(200).json({
      ok: true,
      message: 'Profile image deleted successfully'
    });

  } catch (err) {
    console.error('Storage controller error:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Delete failed',
      message: err.message || 'Delete failed'
    });
  }
}

// new helper: upload a Buffer to a bucket and return publicUrl + supabase data
export async function uploadBufferToSupabase({ bucket, path, buffer, contentType, upsert = false }) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return {
      publicUrl: publicUrlData?.publicUrl || null,
      supabaseData: data
    };
  } catch (err) {
    // normalize thrown error for callers
    throw err;
  }
}