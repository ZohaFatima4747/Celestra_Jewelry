const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

/**
 * Uploads an image buffer to Cloudinary.
 * @param {Buffer} buffer - The image buffer from multer memoryStorage
 * @param {string} [folder="celestra-jewelry"] - Cloudinary folder
 * @returns {Promise<string>} Secure URL of the uploaded image
 */
async function uploadToCloudinary(buffer, folder = "celestra-jewelry") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        fetch_format: "auto",
        quality: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

module.exports = uploadToCloudinary;
