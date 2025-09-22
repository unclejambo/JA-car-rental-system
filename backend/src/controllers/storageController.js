import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function uploadLicense(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No file uploaded' });

    const file = req.file; // multer memory buffer
    const filename = req.body.filename || `${Date.now()}_${file.originalname}`;
    const bucket = 'licenses';
    const path = filename;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      console.error('Supabase upload error', error);
      return res.status(500).json({ ok: false, message: error.message || error });
    }

    // If bucket is public you can form a public URL:
    const { publicURL } = supabase.storage.from(bucket).getPublicUrl(path);

    return res.json({ ok: true, data, publicURL });
  } catch (err) {
    next(err);
  }
}