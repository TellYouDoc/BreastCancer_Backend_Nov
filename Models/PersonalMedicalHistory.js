const mongoose = require("mongoose");

const questionAnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    default: null, // Allowing null or empty strings
  },
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  questions: [questionAnswerSchema],
});

const personalMedicalHistorySchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    history: [sectionSchema],
    feedback: {
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "PersonalMedicalHistory",
  personalMedicalHistorySchema
);
