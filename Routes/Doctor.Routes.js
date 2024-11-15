const upload = require('../Middlewares/Multer.Middleware')
const authenticateToken = require('../Middlewares/auth.middleware');
const { Router } = require('express');
const { getPhoneNumber, newDoctorRegistration, doctorDetails, updateProfile } = require('../Controllers/Doctor.controller');

const router = Router()

// GET route to fetch phone number 
router.route("/get-phone-number").get(authenticateToken, getPhoneNumber);

// Route to create a new doctor registration
router.route("/new-doctor-registration-form").post(authenticateToken, newDoctorRegistration);

// Route to get a doctor's data 
router.route('/get-doctor-profile').get(authenticateToken, doctorDetails);

// Route to update doctor registration (including profileImage)
router.route('/update-doctor-profile').patch(authenticateToken, upload.single('profileImage'), updateProfile)

module.exports = router;