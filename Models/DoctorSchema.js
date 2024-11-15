const mongoose = require('mongoose');

// Define the schema for the Doctor Registration
const doctorRegistrationSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'doctorPhoneNumber',
        required: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
    },
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Others'],
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    age: {
        type: Number,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /\S+@\S+\.\S+/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
    },
    nationality: {
        type: String,
    },
    profileImage: {
        type: String,
    },
    specialization: {
        type: String,
        required: true,
    },
    UDI_id: {
        type: String,
        unique: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true
});

doctorRegistrationSchema.methods.generateUDI = function () {
    // const initials = this.fullName.split(' ').map(name => name[0]).join(''); //KS
    const specShort = this.specialization.slice(0, 3).toUpperCase(); //ONC
    const genderInitial = this.gender[0].toUpperCase(); //M
    const timestamp = this.createdAt.getTime().toString().slice(-6); // last 6 digits of timestamp
    return `DAG${genderInitial}${specShort}${timestamp}`;
};
// Calculate Age
doctorRegistrationSchema.methods.calculateAge = function () {
    const today = new Date();
    const birth = new Date(this.dateOfBirth);
    console.log("Birth Date:", birth); // Debugging line
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};
// Before saving the document, generate the UDI if it doesn't exist
doctorRegistrationSchema.pre('save', function (next) {
    console.log("Running pre-save middleware..."); // Debugging line

    // Calculate age based on dateOfBirth before saving
    this.age = this.calculateAge();
    if (!this.UDI_id) {
        this.UDI_id = this.generateUDI();
    }
    next();
});

// Create the model for Doctor Registration using the defined schema
const Doc = mongoose.model("Doctors", doctorRegistrationSchema);
module.exports = Doc;
