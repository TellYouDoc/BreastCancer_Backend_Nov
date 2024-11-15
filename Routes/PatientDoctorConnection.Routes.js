const express = require('express');
const DoctorRequestSchema = require('../Models/DoctorConnectionSchema');
const DoctorSchema = require('../Models/DoctorSchema')
const PatientSchema = require('../Models/PatientSchema');
const authenticateToken = require('../Middlewares/auth.middleware');
const router = express.Router();

// Send Doctor Request
router.get('/show/doctor', authenticateToken, async (req, res) => {
    const { UDI_id } = req.query;

    try {
        const Patientdata = await PatientSchema.findOne({ patientId: req.user._id });
        const patientId = Patientdata.UDI_id;
        // Check if a request with the same doctorId and patientId exists
        let existingRequest = await DoctorRequestSchema.findOne({ doctorId: UDI_id, patientId });
        console.log(existingRequest)
        if (existingRequest) {
            if (existingRequest.status === 'accepted') {
                return res.status(209).json({ message: 'Doctor request already exists!' });
            }
        }
        const doctorData = await DoctorSchema.findOne({ UDI_id: UDI_id });
        res.status(200).json({ doctorData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Send Doctor Request
router.post('/doctor-request', authenticateToken, async (req, res) => {
    const { doctorId } = req.body;
    const Patientdata = await PatientSchema.findOne({ patientId: req.user._id });
    const patientId = Patientdata.UDI_id;

    try {
        // Check if a request with the same doctorId and patientId exists
        let existingRequest = await DoctorRequestSchema.findOne({ doctorId, patientId });

        if (existingRequest) {
            if (existingRequest.status === 'declined') {
                // Update the status to 'pending' if it was 'declined'
                existingRequest.status = 'pending';
                await existingRequest.save();
                return res.status(200).json({ message: 'Doctor request status updated to pending!' });
            }
            return res.status(400).json({ message: 'Doctor request already exists!' });
        }

        // If no existing request, create a new one
        const newRequest = new DoctorRequestSchema({
            patientId,
            doctorId
        });

        await newRequest.save();
        res.status(200).json({ message: 'Doctor request sent!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// connect patient through doctor scan
router.post('/doctor/scan', authenticateToken, async (req, res) => {
    const { patientId } = req.body;

    try {
        // Find doctor data using the authenticated user's ID
        const doctordata = await DoctorSchema.findOne({ doctorId: req.user._id });

        if (!doctordata) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const doctorId = doctordata.UDI_id;

        // Check if a request with the same doctorId and patientId exists
        let existingRequest = await DoctorRequestSchema.findOne({ doctorId, patientId });

        if (existingRequest) {

            if (existingRequest.status === 'declined') {
                // Update the status to 'accepted' if it was 'declined'
                existingRequest.status = 'accepted';
                existingRequest.session = "current";
                await existingRequest.save();
                return res.status(200).json({ message: 'Doctor connection status updated to accepted!' });
            }
            return res.status(400).json({ message: 'Doctor request already exists!' });
        }

        console.log("No existing request found. Creating a new one...");

        // If no existing request, create a new one
        const newRequest = new DoctorRequestSchema({
            patientId,
            doctorId,
            status: "accepted",
            session: "current",
        });

        await newRequest.save();
        res.status(200).json({ message: 'Doctor connection complete!' });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});


// View Incoming patient Requests
router.get('/patient-requests', authenticateToken, async (req, res) => {
    try {
        // Check if user is a doctor
        const doctor = await DoctorSchema.findOne({ doctorId: req.user._id });

        // Check if user is a patient
        const patient = await PatientSchema.findOne({ patientId: req.user._id });

        let dataArray = [];

        if (doctor) {
            // Fetch all requests for the doctor with 'pending' status
            const requestsDOC = await DoctorRequestSchema.find({ doctorId: doctor.UDI_id, status: 'pending' });

            // Fetch patient data associated with each pending request
            dataArray = await Promise.all(
                requestsDOC.map(async (request) => {
                    const patientData = await PatientSchema.findOne({ UDI_id: request.patientId });
                    return {
                        requestId: request._id,
                        patientId: request.patientId,
                        doctorId: request.doctorId,
                        status: request.status,
                        patientData,
                    };
                })
            );
        } else if (patient) {
            // Fetch all requests for the patient with 'pending' status
            const requestsPatient = await DoctorRequestSchema.find({ patientId: patient.UDI_id, status: { $in: ['pending', 'accepted'] } });

            // Fetch doctor data associated with each pending request
            dataArray = await Promise.all(
                requestsPatient.map(async (request) => {
                    const doctorData = await DoctorSchema.findOne({ UDI_id: request.doctorId });
                    return {
                        requestId: request._id,
                        patientId: request.patientId,
                        doctorId: request.doctorId,
                        status: request.status,
                        doctorData,
                    };
                })
            );
        } else {
            return res.status(404).json({ message: 'User not found as Doctor or Patient' });
        }

        // Return the data array based on user type
        res.status(200).json({ data: dataArray });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Accept patient Request
router.put('/patient-request/accept', authenticateToken, async (req, res) => {
    const { requestId } = req.body;

    try {
        const request = await DoctorRequestSchema.findById(requestId);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Update request status to accepted
        request.status = 'accepted';
        request.session = "current";
        await request.save();

        // // Save the friendship
        // const newFriendship = new Friend({ userId1: request.senderId, userId2: request.receiverId });
        // await newFriendship.save();
        res.status(200).json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Decline patient Request
router.put('/patient-request/decline', authenticateToken, async (req, res) => {
    const { requestId } = req.body;

    try {
        const request = await DoctorRequestSchema.findById(requestId);

        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Update request status to declined
        request.status = 'declined';
        await request.save();

        res.status(200).json({ message: 'Doctor request declined' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Patients of a Doctor
router.get('/my-patients', authenticateToken, async (req, res) => {
    try {
        const doctordata = await DoctorSchema.findOne({ doctorId: req.user._id });

        // Find all accepted  status through doctorId
        const patients = await DoctorRequestSchema.find({ doctorId: doctordata.UDI_id, status: 'accepted' });
        // const patient = await DoctorRequestSchema.find({
        //     $or: [{ userId1: userId }, { userId2: userId }]
        // }).populate('userId1 userId2');
        // Use Promise.all to fetch patient data for each request asynchronously
        const patientDataArray = await Promise.all(
            patients.map(async (patients) => {
                const patientData = await PatientSchema.findOne({ UDI_id: patients.patientId });
                return {
                    requestId: patients._id,
                    patientId: patients.patientId,
                    doctorId: patients.doctorId,
                    status: patients.status,
                    session: patients.session,
                    patientData,
                };
            })
        );
        res.status(200).json(patientDataArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All doctors of a patient
router.get('/my-doctor', authenticateToken, async (req, res) => {
    try {
        const patientdata = await PatientSchema.findOne({ patientId: req.user._id });
        // Find all accepted  status through doctorId
        const doctorRequestdata = await DoctorRequestSchema.find({ patientId: patientdata.UDI_id, status: 'accepted' });
        // Use Promise.all to fetch patient data for each request asynchronously
        const doctordataArray = await Promise.all(
            doctorRequestdata.map(async (doctorRequestdata) => {
                const doctordata = await DoctorSchema.findOne({ UDI_id: doctorRequestdata.doctorId });
                return {
                    requestId: doctorRequestdata._id,
                    patient_UDI_id: doctorRequestdata.patientId,
                    status: doctorRequestdata.status,
                    session: doctorRequestdata.session,
                    doctordata,
                };
            })
        );
        res.status(200).json(doctordataArray);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// End patient session
router.put('/patient/end', authenticateToken, async (req, res) => {
    const { requestId } = req.body;

    try {
        // Find the patient request document by ID and status
        const patientRequest = await DoctorRequestSchema.findOne({ _id: requestId, status: "accepted" });

        if (!patientRequest) {
            return res.status(404).json({ message: 'Patient request not found' });
        }

        // Update patient request status to "previous"
        patientRequest.session = 'previous';
        await patientRequest.save();

        res.status(200).json({ message: 'Patient session ended successfully' });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});
router.put('/patient/connectAgin', authenticateToken, async (req, res) => {
    const { requestId } = req.body;

    try {
        // Find the patient request document by ID and status
        const patientRequest = await DoctorRequestSchema.findOne({ _id: requestId, status: "accepted", session: "previous" });

        if (!patientRequest) {
            return res.status(404).json({ message: 'Patient request not found' });
        }

        // Update patient request status to "previous"
        patientRequest.session = 'current';
        await patientRequest.save();

        res.status(200).json({ message: 'Patient session reconnect successfully' });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
