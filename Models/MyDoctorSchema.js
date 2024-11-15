const mongoose = require("mongoose");

const MyDoctorSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PatientPhoneNumber'
    }, // Reference to the Patient's _id (User A)
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorPhoneNumber'
    }, // Reference to the Doctor's _id (User B)
    status: {
        type: String,
        required: true,
    }, // Values can be: "current", "previous"
}, { timestamps: true });

module.exports = mongoose.model("MyDoctor", MyDoctorSchema);
