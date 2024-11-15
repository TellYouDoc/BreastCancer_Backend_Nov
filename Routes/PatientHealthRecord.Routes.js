const express = require("express");
const router = express.Router();
const { Prescription, Report, Notes } = require("../Models/HealthRecordSchema");
const { uploadOnCloudinary, deleteFromCloudinary } = require('../Utility/FileUpload');
const upload = require('../Middlewares/Multer.Middleware');
const authenticateToken = require('../Middlewares/auth.middleware');
const mongoose = require('mongoose');

//prescriptions
//Post prescription
router.post("/prescription", authenticateToken, upload.single("file"), async (req, res) => {
    const { label, doctorId } = req.body;
    const patientId = req.user._id;

    if (req.file) {
        try {
            // Upload to Cloudinary and get the URL
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

            if (!cloudinaryResponse) {
                return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
            }

            // Create new Prescription with Cloudinary URL
            const newPrescription = new Prescription({
                patientId,
                doctorId,
                fileUri: cloudinaryResponse.url, // Store Cloudinary URL in database
                label,
            });

            await newPrescription.save();
            res.status(201).json(newPrescription);
        } catch (error) {
            console.error("Error uploading prescription:", error.message);
            res.status(500).json({ message: "Server error while saving prescription" });
        }
    } else {
        res.status(400).json({ message: "No file uploaded" });
    }
});

// Get all prescriptions for authenticated patient
router.get("/patient/prescriptions", authenticateToken, async (req, res) => {
    try {
        // Determine doctorId and patientId based on the source (query or authenticated user)
        const doctorId = req.query.doctorId;
        const patientId = req.user._id;
        // console.log(doctorId, patientId)
        // Retrieve prescriptions based on the presence of doctorId
        const query = doctorId ? { patientId, doctorId } : { patientId };
        const prescriptions = await Prescription.find(query).sort({ createdAt: -1 });
        // console.log(prescriptions)
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions:", error.message);
        res.status(500).send("Server error");
    }
});
// Get all prescriptions for authenticated patient
router.get("/doctor/prescriptions", authenticateToken, async (req, res) => {
    try {
        // Determine doctorId and patientId based on the source (query or authenticated user)
        // console.log(req.query.patientId)
        const doctorId = req.user._id;
        const patientId = req.query.patientId;
        // Retrieve prescriptions for the authenticated patient
        if (!patientId) {
            res.status(400).json({ message: "patientId is required" });
        }
        const prescriptions = await Prescription.find({ patientId, doctorId }).sort({ createdAt: -1 });
        res.status(200).json(prescriptions);
    } catch (error) {
        console.error("Error fetching prescriptions:", error.message);
        res.status(500).send("Server error");
    }
});

// DELETE prescription
router.delete("/prescription/delete", authenticateToken, async (req, res) => {
    const { prescriptionId } = req.query;
    const patientId = req.user._id;
    try {
        // Find the prescription by ID and ensure it belongs to the authenticated user
        const prescription = await Prescription.findOne({ _id: prescriptionId, patientId });

        if (!prescription) {
            return res.status(404).json({ message: "Prescription not found" });
        }

        // Delete the file from Cloudinary
        const publicId = prescription.fileUri.split('/').pop().split('.')[0]; // Extract public_id from file URI
        const cloudinaryResponse = await deleteFromCloudinary(publicId);
        // console.log(cloudinaryResponse.result)
        if (cloudinaryResponse.result !== "not found") {
            return res.status(500).json({ message: "Failed to delete image from Cloudinary" });
        }

        // Delete the prescription from the database
        await Prescription.findByIdAndDelete(prescriptionId);

        res.status(200).json({ message: "Prescription deleted successfully" });
    } catch (error) {
        console.error("Error deleting prescription:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});



//Reports
//POST report
router.post("/report", authenticateToken, upload.single("file"), async (req, res) => {
    const { label, doctorId } = req.body;
    const patientId = req.user._id;

    if (req.file) {
        try {
            // Upload to Cloudinary and get the URL
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);

            if (!cloudinaryResponse) {
                return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
            }

            // Create new Report with Cloudinary URL
            const newReport = new Report({
                patientId,
                doctorId,
                fileUri: cloudinaryResponse.url, // Store Cloudinary URL in database
                label,
            });

            await newReport.save();
            res.status(201).json(newReport);
        } catch (error) {
            console.error("Error uploading Report:", error.message);
            res.status(500).json({ message: "Server error while saving Report" });
        }
    } else {
        res.status(400).json({ message: "No file uploaded" });
    }
});

// Get all reports
router.get("/patient/reports", authenticateToken, async (req, res) => {
    try {
        // Determine doctorId and patientId based on the source (query or authenticated user)
        const doctorId = req.query.doctorId;
        const patientId = req.user._id;

        // Retrieve reports based on the presence of doctorId
        const query = doctorId ? { patientId, doctorId } : { patientId };
        const reports = await Report.find(query).sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error.message);
        res.status(500).json({ error: "Server error while fetching reports" });
    }
});
// Get all reports
router.get("/doctor/reports", authenticateToken, async (req, res) => {
    try {
        // Determine doctorId and patientId based on the source (query or authenticated user)
        const doctorId = req.user._id;
        const patientId = req.query.patientId;

        // Retrieve reports based on the presence of doctorId
        // const query = doctorId ? { patientId, doctorId } : { patientId };
        const reports = await Report.find({ patientId, doctorId }).sort({ createdAt: -1 });

        res.status(200).json(reports);
    } catch (error) {
        console.error("Error fetching reports:", error.message);
        res.status(500).json({ error: "Server error while fetching reports" });
    }
});

// Validate ObjectId before attempting to delete
router.delete("/report/delete", authenticateToken, async (req, res) => {
    const { reportId } = req.query;
    const patientId = req.user._id;

    try {
        // Find the prescription by ID and ensure it belongs to the authenticated user
        const report = await Report.findOne({ _id: reportId, patientId });
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }
        // Delete the file from Cloudinary
        const publicId = report.fileUri.split('/').pop().split('.')[0]; // Extract public_id from file URI
        const cloudinaryResponse = await deleteFromCloudinary(publicId);
        console.log(cloudinaryResponse.result)
        if (cloudinaryResponse.result !== "not found") {
            return res.status(500).json({ message: "Failed to delete image from Cloudinary" });
        }
        // Delete the prescription from the database
        await Report.findByIdAndDelete(reportId);
        res.status(200).json({ message: "Prescription deleted successfully" });
    } catch (error) {
        console.error("Error deleting prescription:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});



//Notes
// Create a new note
router.post('/notes', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { patientId, note } = req.body;
        // console.log(patientId)
        // 1. Validate required fields
        if (!patientId || !note) {
            return res.status(400).json({ error: "patientId, note are required" });
        }

        // 2. Validate data types
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ error: "Invalid patientId format" });
        }
        if (typeof note !== 'string' || note.trim().length === 0) {
            return res.status(400).json({ error: "Note must be a non-empty string" });
        }

        // 4. Create and save the note
        const newNote = new Notes({
            doctorId,
            patientId,
            note: note.trim(),
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error("Error creating note:", error.message);

        // 5. Handle unexpected errors
        res.status(500).json({ error: "Server error while creating note" });
    }
});

// Get all notes
router.get('/notes', authenticateToken, async (req, res) => {
    try {
        // Determine doctorId and patientId based on the source (query or authenticated user)
        const doctorId = req.query.doctorId || req.user._id;
        const patientId = req.query.patientId || req.user._id;
        // Validate required parameter
        if (!patientId) {
            return res.status(400).json({ error: "patientId is required" });
        }

        // Validate patientId format
        if (!mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ error: "Invalid patientId format" });
        }

        // Fetch notes for the specified patient and doctor, sorted by creation date in descending order
        const notes = await Notes.find({ patientId, doctorId }).sort({ createdAt: -1 });

        res.status(200).json(notes);
    } catch (error) {
        console.error("Error fetching notes:", error.message);
        res.status(500).json({ error: "Server error while fetching notes" });
    }
});

// Update a note
router.put('/notes/update', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { note, noteId } = req.body;
        // 1. Validate required fields
        if (!noteId || !note) {
            return res.status(400).json({ error: "noteId and note are required" });
        }

        // 2. Validate noteId format
        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({ error: "Invalid noteId format" });
        }

        // 3. Find and update the note, ensuring it belongs to the authenticated doctor
        const updatedNote = await Notes.findOneAndUpdate(
            { _id: noteId, doctorId },  // Match by note ID and doctor ID
            { note: note.trim() },       // Update the note content
            { new: true }                // Return the updated document
        );

        if (!updatedNote) {
            return res.status(404).json({ error: "Note not found or you do not have permission to update it" });
        }

        res.status(200).json(updatedNote);
    } catch (error) {
        console.error("Error updating note:", error.message);
        res.status(500).json({ error: "Server error while updating note" });
    }
});

// Delete a note
router.delete('/notes/delete', authenticateToken, async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { noteId } = req.query;

        // 1. Validate noteId parameter
        if (!noteId) {
            return res.status(400).json({ error: "noteId is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(noteId)) {
            return res.status(400).json({ error: "Invalid noteId format" });
        }

        // 2. Find and delete the note, ensuring it belongs to the authenticated doctor
        const deletedNote = await Notes.findOneAndDelete({ _id: noteId, doctorId });

        if (!deletedNote) {
            return res.status(404).json({ error: "Note not found or you do not have permission to delete it" });
        }

        res.status(200).json({ message: "Note deleted successfully" });
    } catch (error) {
        console.error("Error deleting note:", error.message);
        res.status(500).json({ error: "Server error while deleting note" });
    }
});

module.exports = router;