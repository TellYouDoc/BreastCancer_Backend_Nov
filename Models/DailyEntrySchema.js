const mongoose = require("mongoose");

const dailyEntrySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  selectedPeriodDay: {
    type: String,
    required: true,
  },
  selectedPain: {
    type: String,
    required: true,
  },
  painLevel: {
    type: Number,
    required: function () {
      return this.selectedPain === "Yes";
    },
  },
  selectedSide: {
    type: String,
    required: function () {
      return this.selectedPain === "Yes";
    },
  },
  selectedLeftLocations: {
    type: [String],
    required: function () {
      return this.selectedSide === "Left" || this.selectedSide === "Both";
    },
  },
  selectedRightLocations: {
    type: [String],
    required: function () {
      return this.selectedSide === "Right" || this.selectedSide === "Both";
    },
  },
  feedback: {
    type: String,
  },
}, { timestamps: true });

const DailyEntry = mongoose.model("DailyEntry", dailyEntrySchema);

module.exports = DailyEntry;
