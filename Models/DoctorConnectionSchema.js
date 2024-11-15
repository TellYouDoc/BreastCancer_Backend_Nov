const mongoose = require("mongoose");

const DoctorRequestSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.String,
        ref: 'Patient',
        required: true,
    }, // Reference to the Patient's _id (User A)
    doctorId: {
        type: mongoose.Schema.Types.String,
        ref: 'Doctors',
        required: true,
    }, // Reference to the Doctor's _id (User B)
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'declined'],
        default: 'pending'
    },
    session: {
        type: String,
        required: function () {
            return this.status === "accepted";
        },
        enum: ['current', 'previous'],
    },
}, { timestamps: true });

module.exports = mongoose.model("DoctorRequest", DoctorRequestSchema);
