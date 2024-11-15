const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors",
        required: true,
    },
    fileUri: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        default: "No Label",
    },
}, { timestamps: true });

const Prescription = mongoose.model("Prescription", PrescriptionSchema);


const ReportSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctors",
        required: true,
    },
    fileUri: {
        type: String,
        required: true,
    },
    label: {
        type: String,
        default: "Report",
    },
}, { timestamps: true });

const Report = mongoose.model("Report", ReportSchema);


const noteSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctors',
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const Notes = mongoose.model('DotorNote', noteSchema);
module.exports = { Prescription, Report, Notes }