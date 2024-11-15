const { max } = require("moment-timezone");
const mongoose = require("mongoose");
const { Number } = require("twilio/lib/twiml/VoiceResponse");

const FeedbackSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  symptomDescriptionSatisfaction: {
    type: String,
    // required: true,
  },
  consultationQuality: {
    type: String,
    // required: true,
  },
  healthInfoComfort: {
    type: String,
    // required: true,
  },
  recommendationLikelihood: {
    type: String,
    // required: true,
  },
  overallAppExperience: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  additionalSuggestions: {
    type: String,
  },
}, { timestamps: true });

const AppFeedbackPatient = mongoose.model("AppFeedbackPatient", FeedbackSchema);

const DoctorFeedbackSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Doctors",
    required: true,
  },
  patientSymptomUsefullorNot: {
    type: String,
    // required: true
  },
  patientExperience: {
    type: String,
    // required: true
  },
  appointmentEase: {
    type: String,
    // required: true
  },
  recommendation: {
    type: String,
    // required: true
  },
  appExperience: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  suggestions: {
    type: String,
  }
}, { timestamps: true });

const AppFeedbackDoctor = mongoose.model("AppFeedbackDoctor", DoctorFeedbackSchema);

module.exports = { AppFeedbackPatient, AppFeedbackDoctor }