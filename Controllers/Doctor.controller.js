const DoctorRegistration = require('../Models/DoctorSchema'); // Adjust the path as needed
const doctorPhoneNumber = require('../Models/doctorPhoneNumberSchema');
const { uploadOnCloudinary } = require('../Utility/FileUpload');

const getPhoneNumber = async (req, res) => {
    try {
        // Find by phoneNumber
        const phoneEntry = await doctorPhoneNumber.findById(req.user._id).select(
            " -_id -RefreshToken"
        );
        if (!phoneEntry) {
            return res.status(404).json({ message: 'Phone number not found' });
        }

        res.status(200).json({
            phoneNumber: phoneEntry.phoneNumber,
        });
    } catch (error) {
        console.error('Error fetching phone number:', error.message || error);
        res.status(500).json({ error: 'Error fetching phone number' });
    }
};

const newDoctorRegistration = async (req, res) => {
    const { fullName, gender, dateOfBirth, email, specialization } = req.body;

    // Check if required fields are provided
    if (!fullName || !gender || !dateOfBirth || !email || !specialization) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Retrieve the doctorPhoneNumber entry using the phoneNumberId from the token
        const phoneNumberEntry = await doctorPhoneNumber.findById(req.user._id);
        if (!phoneNumberEntry) {
            return res.status(404).json({ error: 'Phone number not found' });
        }
        // console.log(phoneNumberEntry)
        // Check for an existing doctor profile by doctorId
        let doctor = await DoctorRegistration.findOne({ doctorId: phoneNumberEntry._id });
        // console.log(doctor)
        // If the profile doesn't exist, create a new one
        if (!doctor) {
            doctor = new DoctorRegistration({
                fullName,
                email,
                gender,
                specialization,
                dateOfBirth,
                doctorId: phoneNumberEntry._id, // Reference to the phone number
            });
            // Save the new doctor record
            await doctor.save();
            return res.status(201).json({ message: 'Doctor registered successfully', data: doctor });
        }

        // If doctor exists, you could either update or return a message that the profile exists
        return res.status(409).json({ message: 'Doctor profile already exists' });

    } catch (error) {
        console.error("Error registering doctor:", error);

        // Check for duplicate email error (MongoDB code 11000)
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({ error: "Email is already registered." });
        }

        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const doctorDetails = async (req, res) => {

    try {
        const doctorData = await DoctorRegistration.findOne({ doctorId: req.user._id });

        if (!doctorData) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        res.status(200).json({ message: 'Dactor data retrieved', data: doctorData });
    } catch (error) {
        res.status(400).json({ message: 'Error fetching doctor data', error: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const updateData = req.body; // Data to update
        // Check if a profile image is uploaded
        if (req.file) {
            // Upload to Cloudinary and get the URL
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
            if (cloudinaryResponse) {
                updateData.profileImage = cloudinaryResponse.url; // Store Cloudinary URL in database
            } else {
                return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
            }
            // updateData.profileImage = `${req.file.filename}`; // Store the file path in the database
        }

        // Include nationality if present in the request body
        if (req.body.nationality) {
            updateData.nationality = req.body.nationality;
        }

        const doctor = await DoctorRegistration.findOneAndUpdate(
            { doctorId: req.user._id },  // Search criteria
            updateData,                  // Fields to update
            { new: true, runValidators: true }  // Options: return updated doc, apply validation
        );
        // If the doctor is not found, return a 404 status
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // Successfully updated the doctor record
        res.status(200).json({ message: 'Doctor updated successfully', data: doctor });
    } catch (error) {
        // Check if the error is a Mongoose validation error
        if (error.name === 'ValidationError') {
            // Extract the validation error message (for email or any other field)
            const fieldErrors = Object.values(error.errors).map(e => e.message);

            // Send the validation error message in the response
            return res.status(400).json({
                message: 'Error updating doctor',
                error: fieldErrors.join(', ') // Join multiple error messages if there are any
            });
        }

        // Catch any other errors and return a generic error message
        res.status(400).json({ message: 'Error updating doctor', error: error.message });
    }
};


module.exports = {
    getPhoneNumber,
    newDoctorRegistration,
    doctorDetails,
    updateProfile,
}