const mongoose = require("mongoose");

const createAppointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctorPhoneNumber',
    required: true
  },
  date: {
    type: String,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  ActiveStatus: {
    type: Boolean,
    required: true,
    default: true,
  },
  feedbackrating: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model("createAppointment", createAppointmentSchema);
