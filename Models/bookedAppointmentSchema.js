const mongoose = require("mongoose");

const bookappointmentSchema = new mongoose.Schema({
    appointmentCreatedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'createAppointment',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorPhoneNumber',
        required: true
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
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
    bookingStatus: {
        type: String, //booked,cancel,complete
    },
    feedbackrating: {
        type: Number,
    }
}, { timestamps: true });

module.exports = mongoose.model("BookAppointment", bookappointmentSchema);
