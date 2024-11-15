const express = require('express');
const bcrypt = require('bcrypt');
const doctorPhoneNumber = require('../Models/doctorPhoneNumberSchema');
const patientPhoneNumber = require('../Models/PatientPhoneNumberSchema');
const doctorProfile = require('../Models/DoctorSchema')
const patientProfile = require('../Models/PatientSchema')
const twilio = require('twilio');
const ApiError = require('../Utility/ApiError')
const authenticateToken = require('../Middlewares/auth.middleware')
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// In-memory store for OTPs
let OTPStore = {};

//generate Access and Refresh token for Doctor 
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const doctor = await doctorPhoneNumber.findById(userId);
    const AccessToken = doctor.generateAccessToken()
    const RefreshToken = doctor.generateRefreshToken()
    doctor.RefreshToken = RefreshToken
    await doctor.save({ validateBeforeSave: false })
    return { AccessToken, RefreshToken }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating Access and Refresh Token");

  }
}
//generate Access and Refresh token for Patient 
const generatePatientAccessAndRefreshToken = async (userId) => {
  try {
    const patient = await patientPhoneNumber.findById(userId);
    const AccessToken = patient.generateAccessToken()
    const RefreshToken = patient.generateRefreshToken()
    patient.RefreshToken = RefreshToken
    await patient.save({ validateBeforeSave: false })
    return { AccessToken, RefreshToken }
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating Access and Refresh Token");

  }
}

// Generate and send OTP
router.post('/generate-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  // console.log(phoneNumber)
  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit OTP
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);

    // Store hashed OTP temporarily
    OTPStore[phoneNumber] = hashedOTP;

    // Send OTP via Twilio
    await client.messages.create({
      body: `Your OTP code is ${otp}.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Error sending OTP' });
  }
});

// Verify OTP and save new register ph. no(Doctor)
router.post('/verify-otp-doctor', async (req, res) => {
  const { phoneNumber, otp } = req.body;
  // Check if both phoneNumber and OTP are provided
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required" });
  }
  try {
    // Retrieve the hashed OTP from the store
    const hashedOTP = OTPStore[phoneNumber];
    if (!hashedOTP) {
      return res.status(400).json({ error: "OTP has expired or is invalid" });
    }
    // Compare provided OTP with the stored hash
    const isMatch = await bcrypt.compare(otp, hashedOTP);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid OTP" });
    }
    // Step 1: Find phone number entry in doctorPhoneNumber collection
    let Doctor = await doctorPhoneNumber.findOne({ phoneNumber });

    if (!Doctor) {
      // Phone number not found in database, save new entry
      Doctor = new doctorPhoneNumber({
        phoneNumber,
      });
      await Doctor.save();
      const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(Doctor._id)
      const options = {
        httpOnly: true,
        secure: true
      }
      console.log('Phone number saved successfully');
      return res
        .status(200)
        .cookie("AccessToken", AccessToken, options)
        .cookie("RefreshToken", RefreshToken, options)
        .json({ message: 'Phone number saved successfully', AccessToken, RefreshToken });
    } else {
      const { AccessToken, RefreshToken } = await generateAccessAndRefreshToken(Doctor._id)
      const options = {
        httpOnly: true,
        secure: true
      }
      // Phone number already exists in the database, check if the user profile exists
      // Step 2: Use phone number's _id to find user profile
      const doctorProfilecheck = await doctorProfile.findOne({ doctorId: Doctor._id });

      if (doctorProfilecheck) {
        // Profile exists for the phone number
        console.log('User profile exists');
        return res
          .status(202)
          .cookie("AccessToken", AccessToken, options)
          .cookie("RefreshToken", RefreshToken, options)
          .json({ message: 'User profile exists', AccessToken, RefreshToken });
      } else {
        // No profile exists, but the phone number is registered
        console.log('Phone number exists, but no user profile found');
        return res
          .status(201)
          .cookie("AccessToken", AccessToken, options)
          .cookie("RefreshToken", RefreshToken, options)
          .json({ message: 'Phone number already registered, but no user profile found', AccessToken, RefreshToken });
      }
    }
  } catch (error) {
    console.error('Error during phone number handling:', error.message || error);
    return res.status(500).json({ error: 'Error saving phone number or verifying OTP' });
  } finally {
    // Clear OTP after successful verification
    delete OTPStore[phoneNumber];
  }
});

// Verify OTP and save new register ph. no(patient)
router.post('/verify-otp-patient', async (req, res) => {
  const { phoneNumber, otp } = req.body;

  // Check if both phoneNumber and OTP are provided
  if (!phoneNumber || !otp) {
    return res.status(400).json({ error: "Phone number and OTP are required or Maximum limit of 10 phone numbers reached." });
  }

  // Retrieve the hashed OTP from the store
  const hashedOTP = OTPStore[phoneNumber];
  if (!hashedOTP) {
    return res.status(400).json({ error: "OTP has expired or is invalid" });
  }

  // Compare provided OTP with the stored hash
  const isMatch = await bcrypt.compare(otp, hashedOTP);
  if (!isMatch) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  try {
    // Step 1: Find phone number entry in patientPhoneNumber collection
    let phoneEntryPatient = await patientPhoneNumber.findOne({ phoneNumber });
    if (!phoneEntryPatient) {

      // Phone number not found in database, save new entry
      phoneEntryPatient = new patientPhoneNumber({
        phoneNumber,
      });

      await phoneEntryPatient.save();

      const { AccessToken, RefreshToken } = await generatePatientAccessAndRefreshToken(phoneEntryPatient._id)
      const options = {
        httpOnly: true,
        secure: true
      }
      return res.status(200)
        .cookie("AccessToken", AccessToken, options)
        .cookie("RefreshToken", RefreshToken, options)
        .json({ message: 'Phone number saved successfully', AccessToken, RefreshToken });
    } else {
      const { AccessToken, RefreshToken } = await generatePatientAccessAndRefreshToken(phoneEntryPatient._id)
      const options = {
        httpOnly: true,
        secure: true
      }
      // Phone number already exists in the database, check if the user profile exists
      // Step 2: Use phone number's _id to find user profile
      const patientProfilecheck = await patientProfile.findOne({ patientId: phoneEntryPatient._id });

      if (patientProfilecheck) {
        // Profile exists for the phone number
        return res.status(202)
          .cookie("AccessToken", AccessToken, options)
          .cookie("RefreshToken", RefreshToken, options)
          .json({ message: 'User profile exists', AccessToken, RefreshToken });
      } else {
        // No profile exists, but the phone number is registered
        console.log('Phone number exists, but no user profile found');
        return res.status(201)
          .cookie("AccessToken", AccessToken, options)
          .cookie("RefreshToken", RefreshToken, options)
          .json({ message: 'Phone number already registered, but no user profile found', AccessToken, RefreshToken });
      }
    }
  } catch (error) {
    console.error('Error during phone number handling:', error.message || error);
    return res.status(500).json({ error: 'Error saving phone number or verifying OTP' });
  } finally {
    // Clear OTP after successful verification
    delete OTPStore[phoneNumber];
  }
});

//Logout route for Doctor
router.post('/doctor-logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate the refresh token by setting it to null or removing it
    await doctorPhoneNumber.findByIdAndUpdate(req.user._id, {
      $unset: { RefreshToken: "" }  // Removes the RefreshToken field
    });
    // Respond with a success message after logout
    return res.status(200).json({ message: 'Logout successfully' });
  } catch (error) {
    console.error('Error during logout:', error.message);
    return res.status(500).json({ message: 'Error during logout', error: error.message });
  }
});

//Logout route for Patient 
router.post('/patient-logout', authenticateToken, async (req, res) => {
  try {
    // Invalidate the refresh token by setting it to null or removing it
    await patientPhoneNumber.findByIdAndUpdate(req.user._id, {
      $unset: { RefreshToken: "" }  // Removes the RefreshToken field
    });
    // Respond with a success message after logout
    return res.status(200).json({ message: 'Logout successfully' });
  } catch (error) {
    console.error('Error during logout:', error.message);
    return res.status(500).json({ message: 'Error during logout', error: error.message });
  }
});

//Refresh token for doctor
router.post('/refresh-token-doctor', async (req, res) => {
  const incomingRefreshToken = req.cookies?.RefreshToken || req.body?.RefreshToken;

  // Check if a refresh token was provided
  if (!incomingRefreshToken) {
    return res.status(401).json({ error: 'Unauthorized request, refresh token required' });
  }

  try {
    // Verify the refresh token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the doctor based on the decoded token's _id
    const doctor = await doctorPhoneNumber.findById(decodedToken?._id);
    if (!doctor) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Ensure the incoming refresh token matches the one stored in the database
    if (incomingRefreshToken !== doctor.RefreshToken) {
      return res.status(403).json({ error: 'Expired or invalid refresh token' });
    }

    // Generate new access and refresh tokens
    const { AccessToken, newRefreshToken } = await generateAccessAndRefreshToken(doctor._id);

    // Set options for secure cookie storage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'Strict',  // Helps mitigate CSRF attacks
      maxAge: 24 * 60 * 60 * 1000  // 1 day expiration for refresh token cookie
    };

    // Send new tokens in cookies and response
    return res
      .status(200)
      .cookie('AccessToken', AccessToken, cookieOptions)
      .cookie('RefreshToken', newRefreshToken, cookieOptions)
      .json({ message: 'Access token refreshed successfully', AccessToken, newRefreshToken });

  } catch (error) {
    console.error('Error during refresh token process:', error.message);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

//Refresh token for patient
router.post('/refresh-token-patient', async (req, res) => {
  const incomingRefreshToken = req.cookies?.RefreshToken || req.body?.RefreshToken;

  // Check if a refresh token was provided
  if (!incomingRefreshToken) {
    return res.status(401).json({ error: 'Unauthorized request, refresh token required' });
  }

  try {
    // Verify the refresh token
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the doctor based on the decoded token's _id
    const patient = await patientPhoneNumber.findById(decodedToken?._id);
    if (!patient) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Ensure the incoming refresh token matches the one stored in the database
    if (incomingRefreshToken !== patient.RefreshToken) {
      return res.status(403).json({ error: 'Expired or invalid refresh token' });
    }

    // Generate new access and refresh tokens
    const { AccessToken, newRefreshToken } = await generatePatientAccessAndRefreshToken(patient._id);

    // Set options for secure cookie storage
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: 'Strict',  // Helps mitigate CSRF attacks
      maxAge: 24 * 60 * 60 * 1000  // 1 day expiration for refresh token cookie
    };

    // Send new tokens in cookies and response
    return res
      .status(200)
      .cookie('AccessToken', AccessToken, cookieOptions)
      .cookie('RefreshToken', newRefreshToken, cookieOptions)
      .json({ message: 'Access token refreshed successfully', AccessToken, newRefreshToken });

  } catch (error) {
    console.error('Error during refresh token process:', error.message);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

module.exports = router;
