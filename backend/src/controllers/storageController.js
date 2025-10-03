import { createClient } from '@supabase/supabase-js';

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