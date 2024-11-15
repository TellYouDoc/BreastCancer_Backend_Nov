const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PatientPhoneNumber',
    required: true
  },
  fullName: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
    enum: ["Male", "Female", "Others"],
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  age: {
    type: Number,
    required: false,
  },
  nationality: {
    type: String,
  },
  email: {
    type: String,
  },
  profileImage: {
    type: String, // Store the URL of the image
  },
  address: {
    type: String, // Store the URL of the image
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
  refreshToken: {
    type: String
  }
},
  {
    timestamps: true
  });

// Generate UDI ID
userSchema.methods.generateUDI = function () {
  const initials = this.fullName.split(' ').map(name => name[0]).join(''); // KS
  const genderInitial = this.gender[0].toUpperCase(); // M
  const timestamp = this.createdAt.getTime().toString().slice(-6); // last 6 digits of timestamp
  return `${initials}${genderInitial}${timestamp}`;
};

// Calculate Age
userSchema.methods.calculateAge = function () {
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


// Before saving the document, calculate age and generate UDI if it doesn't exist
userSchema.pre('save', function (next) {
  console.log("Running pre-save middleware..."); // Debugging line

  // Calculate age based on dateOfBirth before saving
  this.age = this.calculateAge();

  // Generate UDI if not already set
  if (!this.UDI_id) {
    this.UDI_id = this.generateUDI();
  }
  next();
});


const User = mongoose.model("Patient", userSchema);

module.exports = User;
