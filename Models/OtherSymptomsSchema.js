const mongoose = require("mongoose");

// Define the schema for other symptoms
const otherSymptomsSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient", // Reference to Patient schema (assuming you have a Patient model)
      required: true,
      // unique: true, // Ensure there's only one record per patient
    },
    date: {
      type: Date,
      required: true,
    },
    haveAssociatedSymptoms: {
      type: String, // "Yes" or "No"
      enum: ["Yes", "No"],
      required: true,
    },
    haveFatigue: {
      type: String, // "Yes" or "No"
      enum: ["Yes", "No"],
      required: false,
    },
    haveIrritation: {
      type: String, // "Yes" or "No"
      enum: ["Yes", "No"],
      required: false,
    },
    haveNippleInversion: {
      type: String, // "Yes" or "No"
      enum: ["Yes", "No"],
      required: false,
    },
    haveWhichNippleInversion: {
      type: String, // "Left", "Right", "Both"
      enum: ["Left", "Right", "Both"],
      required: false,
    },
    haveWhichNippleInversionOnLeft: {
      type: String, // "Flat Nipple" or "Inverted Nipple"
      enum: ["Flat Nipple", "Inverted Nipple"],
      required: false,
    },
    haveWhichNippleInversionOnRight: {
      type: String, // "Flat Nipple" or "Inverted Nipple"
      enum: ["Flat Nipple", "Inverted Nipple"],
      required: false,
    },
    haveRashes: {
      type: String, // "Yes" or "No"
      enum: ["Yes", "No"],
      required: false,
    },
    feedback: {
      type: String
    },
  },
  { timestamps: true }
);

// Create and export the model
module.exports = mongoose.model("OtherSymptoms", otherSymptomsSchema);
