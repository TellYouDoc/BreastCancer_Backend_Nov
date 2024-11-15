// NewUserRegistrationRoute.js
const express = require("express");
const User = require("../Models/PatientSchema"); // Make sure the path to the schema is correct
const patientPhoneNumberEntry = require("../Models/PatientPhoneNumberSchema")
const authenticateToken = require('../Middlewares/auth.middleware');
const upload = require('../Middlewares/Multer.Middleware');
const router = express.Router();
const { uploadOnCloudinary } = require('../Utility/FileUpload');




// Route to complete user profile after OTP verification
router.post("/complete-profile", authenticateToken, async (req, res) => {
  const { fullName, gender, dateOfBirth } = req.body;
  if (!fullName || !gender || !dateOfBirth) {
    return res.status(400).json({ error: "All fields are required" });
  }
  try {
    // Find the user by userId
    const phoneNumberRegistration = await patientPhoneNumberEntry.findById(req.user._id);
    if (!phoneNumberRegistration) {
      return res.status(404).json({ error: "User not found" });
    }
    // Now you can use user to create or update the patient's profile
    let patient = await User.findOne({ patientId: phoneNumberRegistration._id });

    // If the profile doesn't exist, create a new one
    if (!patient) {

      patient = new User({
        fullName,
        gender,
        dateOfBirth,
        patientId: phoneNumberRegistration._id, // Reference to the phone number
      });
    } else {
      // If doctor exists, update the fields
      patient.fullName = fullName || patient.fullName;
      patient.gender = gender || patient.gender;
      patient.dateOfBirth = dateOfBirth || patient.dateOfBirth;
    }
    // Save the updated user
    await patient.save();

    res.status(200).json({ message: "registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error registering user profile" });
  }
});

// Route to update doctor registration (including profileImage)
router.patch("/update-patient-profile", authenticateToken, upload.single("profileImage"), async (req, res) => {
  try {
    const updateData = req.body; // Data to update
    // Include nationality if present in the request body
    if (req.body.Nationality || req.body.Name || req.body.Gender || req.body.DOB || req.body.Email || req.body.Address) {
      updateData.fullName = req.body.Name;
      updateData.gender = req.body.Gender;
      updateData.dateOfBirth = req.body.DOB;
      updateData.nationality = req.body.Nationality;
      updateData.email = req.body.Email;
      updateData.address = req.body.Address;

    }
    // Check if a profile image is uploaded
    if (req.file) {
      // Upload to Cloudinary and get the URL
      const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
      if (cloudinaryResponse) {
        updateData.profileImage = cloudinaryResponse.url; // Store Cloudinary URL in database
      } else {
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
      }
    }

    const patient = await User.findOneAndUpdate(
      { patientId: req.user._id },  // Search criteria
      updateData,                  // Fields to update
      { new: true, runValidators: true }  // Options: return updated doc, apply validation
    );
    // If the doctor is not found, return a 404 status
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Successfully updated the doctor record
    res.status(200).json({ message: 'patient profile updated successfully', data: patient });
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
}
);

// Route to get user details, including name, gender, and date of birth
router.get("/get-patient-details", authenticateToken, async (req, res) => {
  try {
    // Get the phone number reference from the token
    const phoneNumberRef = req.query.patientId || req.user._id;
    const patientData = await User.findOne({ patientId: phoneNumberRef });

    if (!patientData) {
      return res.status(404).json({ error: "Patient not found" });
    }
    // Return name, gender, dob as string, and phone number
    res.status(200).json({ message: 'Patient data retrieved', data: patientData });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user details", error });
  }
});
// Route to get user details, including name, gender, and date of birth
router.get("/get-patient-phone", authenticateToken, async (req, res) => {
  try {
    // Find by phoneNumber
    const phoneEntry = await patientPhoneNumberEntry.findById(req.user._id).select(
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
});





module.exports = router;
