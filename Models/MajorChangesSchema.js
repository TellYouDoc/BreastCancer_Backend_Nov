const mongoose = require("mongoose");

const majorSymptomsSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient", // Assuming there's a PatientRegistrationForm schema
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  haveLumps: {
    type: String,
    enum: ["Yes", "No"], // Ensures value is either 'Yes' or 'No'
    required: true,
  },
  lumpType: {
    type: [String], // Array of strings for lump types (e.g., Hard, Movable)
    default: [],
  },
  changeInBreastSymmetry: {
    type: String,
    enum: ["Yes", "No"], // Symmetry changed or not
    required: true,
  },
  haveBreastSymmetry: {
    type: String,
    enum: ["Symmetric", "Asymmetric", ""], // Symmetry state (optional)
    default: "",
  },
  breastSizeChanged: {
    type: String,
    enum: ["Yes", "No"], // Breast size change or not
    required: true,
  },
  breastSizeChangeSide: {
    type: String,
    enum: ["Left", "Right", "Both", ""], // Which side of the breast changed
    default: "",
  },
  selectedLeftSize: {
    type: String,
    enum: ["Increased", "Decreased", ""], // Left size change details (if any)
    default: "",
  },
  selectedRightSize: {
    type: String,
    enum: ["Decreased", "Increased", ""], // Right size change details (if any)
    default: "",
  },

  // // Swelling Symptoms
  haveSwelling: {
    type: String,
    enum: ["Yes", "No"], // Swelling or not
    required: true,
  },
  swellingSide: {
    type: String,
    enum: ["Left", "Right", "Both", ""], // Which breast has entire swelling?
    default: "",
  },

  // // Nipple-related Symptoms
  haveNippleDischarge: {
    type: String,
    enum: ["Unusual", "Usual", ""], // Whether there's nipple discharge
    default: "",
  },
  haveUnusualNippleDischargeColor: {
    type: String,
    enum: [
      "Bloody",
      "Clear/Watery",
      "Yellow/Green",
      "Milky",
      "Pus Like",
      "Unknown",
      "",
    ], // Color of discharge (if any)
    default: "",
  },
  dischargeSmell: {
    type: String,
    enum: [
      "Foul", ,
      "Normal",
      "",
    ],
    default: "",
  },
  feedback: {
    type: String
  },
}, { timestamps: true });

const LongTermSymptoms = mongoose.model("MajorSymptoms", majorSymptomsSchema);

module.exports = LongTermSymptoms;
