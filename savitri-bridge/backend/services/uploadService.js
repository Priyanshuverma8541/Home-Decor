'use strict';
const cloudinary = require('../config/cloudinary');
const config = require('../config/env');
const { AppError, bad } = require('../utils/appError');

// Magic-byte sniffing so a renamed file cannot pass as an image.
function sniff(buf) {
  if (buf.length > 12 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}
async function uploadImage(file, folder) {
  if (!config.cloudinary.configured) throw new AppError(503, 'CLOUDINARY_NOT_CONFIGURED', 'Media uploads are not configured on this server. Paste a public HTTPS image URL instead.');
  if (!file) throw bad('No file uploaded (field name: file)');
  const type = sniff(file.buffer);
  if (!type) throw bad('Only PNG, JPEG or WebP images are allowed');
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `savitribridge/${folder}`, resource_type: 'image', overwrite: false },
      (err, r) => (err ? reject(new AppError(502, 'UPLOAD_FAILED', 'Image upload failed. Please try again.')) : resolve({ url: r.secure_url, width: r.width, height: r.height, bytes: r.bytes }))
    );
    stream.end(file.buffer);
  });
}
module.exports = { uploadImage };
