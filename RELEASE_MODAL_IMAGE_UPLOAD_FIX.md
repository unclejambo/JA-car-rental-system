# Release Modal Image Upload Fix

## Issue

Images uploaded through the Release Modal were not being saved to the database or Supabase storage.

## Root Cause

The multer middleware in the backend was not properly configured with memory storage, causing image files to not be properly captured from the request.

## Fixes Applied

### 1. Backend - Release Route (`backend/src/routes/releaseRoute.js`)

**Problem:** Multer was initialized without explicit memory storage configuration

```javascript
// Before
const upload = multer(); // memory storage
```

**Solution:** Explicitly configured multer to use memory storage

```javascript
// After
const upload = multer({ storage: multer.memoryStorage() });
```

This ensures that uploaded files are stored in memory as buffers (`req.file.buffer`) which can then be uploaded to Supabase.

### 2. Frontend - Release Modal (`frontend/src/ui/components/modal/ReleaseModal.jsx`)

**Improvements:**

- Added detailed console logging to track image upload process
- Enhanced error handling to throw descriptive errors instead of just warnings
- Added logging for each image upload with file details

**Changes:**

1. **Added upload tracking:**

   ```javascript
   console.log("Starting image uploads for release_id:", releaseId);
   ```

2. **Added per-image logging:**

   ```javascript
   console.log(`Preparing to upload ${imageType} image:`, {
     fileName: imageData.file.name,
     fileSize: imageData.file.size,
     fileType: imageData.file.type,
   });
   ```

3. **Enhanced error handling:**

   ```javascript
   // Before
   if (!result.ok) {
     console.warn("Some images failed to upload");
   }

   // After
   if (!result.ok) {
     const errorText = await result.text();
     console.error("Image upload failed:", errorText);
     throw new Error(`Failed to upload some images: ${errorText}`);
   } else {
     const uploadResult = await result.json();
     console.log("Image uploaded successfully:", uploadResult);
   }
   ```

## How It Works Now

1. **Release Creation:**

   - Creates release record in database
   - Returns `release_id`

2. **Image Upload (for each image):**

   - Creates FormData with image file
   - Adds metadata: `image_type`, `start_date`, `customer_first_name`
   - POSTs to `/releases/:release_id/images`
   - Backend receives file via multer memory storage
   - Uploads to Supabase storage
   - Updates release record with image URL

3. **Payment Processing:**
   - Processes payment if amount > 0
   - Updates booking balance

## Image Types Supported

- `id1` - Valid ID 1
- `id2` - Valid ID 2
- `front` - Front car image
- `back` - Back car image
- `right` - Right car image
- `left` - Left car image

## Database Fields Updated

Based on image type:

- `valid_id_img1` - ID 1 URL
- `valid_id_img2` - ID 2 URL
- `front_img` - Front image URL
- `back_img` - Back image URL
- `right_img` - Right image URL
- `left_img` - Left image URL

## Storage Path

Images are stored in Supabase:

- **Bucket:** `licenses`
- **Path:** `release_images/{date}_{type}_{customer}.jpg`
- **Example:** `licenses/release_images/2025-10-15_front_John.jpg`

## Testing

To test the fix:

1. Open Release Modal for a booking
2. Upload images (IDs and car images)
3. Check browser console for upload logs
4. Submit the release form
5. Verify images appear in Supabase storage under `licenses/release_images/`
6. Verify image URLs are saved in the `release` table

## Console Output (Expected)

```
Starting image uploads for release_id: 123
Preparing to upload id1 image: {fileName: "id.jpg", fileSize: 45678, fileType: "image/jpeg"}
Uploading id1 to: http://localhost:5000/releases/123/images
Waiting for 6 image uploads to complete...
All image uploads completed: 6
Image uploaded successfully: {success: true, filename: "2025-10-15_id1_John.jpg", ...}
```

## Notes

- All image uploads must succeed for the release to complete
- If any image upload fails, the entire operation will fail with a descriptive error
- The release record is created first, then images are uploaded
- Images are uploaded in parallel for faster processing
