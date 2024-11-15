const { v2: cloudinary } = require('cloudinary');
const fs = require("fs");
const { v4: uuidv4 } = require('uuid'); // Import UUID

cloudinary.config({
    cloud_name: 'dix1xj1oe',
    api_key: '533551741745582',
    api_secret: '5_fCT-O6MslzZWjAX6Z_OkC-WyQ'
});

const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        console.error("File path missing for upload");
        return null;
    }

    try {
        const uniqueId = uuidv4(); // Generate a unique identifier
        const response = await cloudinary.uploader.upload(localFilePath, {
            public_id: `uploads/${uniqueId}`, // Ensures unique naming in Cloudinary
            resource_type: 'auto',
        });
        console.log("File uploaded to Cloudinary");
        await fs.promises.unlink(localFilePath); // Delete the local file
        return response;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        await fs.promises.unlink(localFilePath);
        return null;
    }
};


const deleteFromCloudinary = async (publicId) => {
    try {
        console.log(publicId)
        const response = await cloudinary.uploader.destroy(`${publicId}.jpg`);
        console.log("Image deleted from Cloudinary:", response);
        return response;
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
        return null;
    }
};

module.exports = { uploadOnCloudinary, deleteFromCloudinary };
