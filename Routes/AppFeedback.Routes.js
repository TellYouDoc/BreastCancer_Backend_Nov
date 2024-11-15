// routes/Feedback.js
const express = require("express");
const router = express.Router();
const { AppFeedbackPatient, AppFeedbackDoctor } = require("../Models/AppFeedbackSchema"); // Import your Feedback model
const authenticateToken = require('../Middlewares/auth.middleware');

// Create patient feedback record
router.post("/patient", authenticateToken, async (req, res) => {
  try {
    const { symptomDescriptionSatisfaction, consultationQuality, healthInfoComfort, recommendationLikelihood, overallAppExperience, additionalSuggestions } = req.body;
    const patientId = req.user._id;
    if (!overallAppExperience) {
      return res.status(400).send({ message: "All fields are required." });
    }
    const newFeedback = new AppFeedbackPatient({ patientId, symptomDescriptionSatisfaction, consultationQuality, healthInfoComfort, recommendationLikelihood, overallAppExperience, additionalSuggestions });
    await newFeedback.save();
    res.status(200).send(newFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(400).send({ error: error.message, details: error });
  }
});

// Create doctor feedback record
router.post("/doctor", authenticateToken, async (req, res) => {
  try {
    const {
      patientSymptomUsefullorNot,
      patientExperience,
      appointmentEase,
      recommendation,
      appExperience,
      suggestions, } = req.body;
    const doctorId = req.user._id;

    if (!patientSymptomUsefullorNot || !patientExperience || !appointmentEase || !recommendation || !appExperience) {
      return res.status(400).send({ message: "All fields are required." });
    }

    const newFeedback = new AppFeedbackDoctor({
      doctorId,
      patientSymptomUsefullorNot,
      patientExperience,
      appointmentEase,
      recommendation,
      appExperience,
      suggestions
    });
    await newFeedback.save();
    res.status(200).send(newFeedback);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(400).send({ error: error.message, details: error });
  }
});



module.exports = router; // Ensure that you're exporting the router
