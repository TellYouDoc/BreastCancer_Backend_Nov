const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const PhoneNumberSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
  },
  RefreshToken: {
    type: String
  }
}, {
  timestamps: true
});

PhoneNumberSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
PhoneNumberSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESS_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESS_TOKEN_EXPIRY
    }
  )
}

const PhoneNumber = mongoose.model('PatientPhoneNumber', PhoneNumberSchema);

module.exports = PhoneNumber;
