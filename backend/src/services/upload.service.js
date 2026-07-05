const log = (msg, data = {}) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [UploadService] ${msg}`, Object.keys(data).length ? JSON.stringify(data) : '');
};

let cloudinary = null;

const getCloudinary = async () => {
  if (cloudinary) return cloudinary;
  try {
    const mod = await import('cloudinary');
    cloudinary = mod.v2;
    return cloudinary;
  } catch {
    return null;
  }
};

export const uploadToCloud = async (fileBuffer, fileName, folder = 'taskora') => {
  const c = await getCloudinary();
  if (!c || !process.env.CLOUDINARY_URL) {
    log('Cloudinary not configured — using local storage fallback');
    return null;
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = c.uploader.upload_stream(
        {
          folder,
          public_id: fileName.replace(/\.[^.]+$/, '') + '-' + Date.now(),
          resource_type: 'image',
          transformation: { quality: 'auto', fetch_format: 'auto' },
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    log('Uploaded to Cloudinary', { url: result.secure_url, publicId: result.public_id });
    return result.secure_url;
  } catch (error) {
    log('Cloudinary upload failed', { error: error.message });
    return null;
  }
};

export const deleteFromCloud = async (publicId) => {
  const c = await getCloudinary();
  if (!c || !process.env.CLOUDINARY_URL || !publicId) return;

  try {
    await c.uploader.destroy(publicId);
    log('Deleted from Cloudinary', { publicId });
  } catch (error) {
    log('Cloudinary delete failed', { error: error.message });
  }
};
