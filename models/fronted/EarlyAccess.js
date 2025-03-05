const mongoose = require("mongoose");

const EarlySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
}, {
  timestamps: true
});


module.exports = mongoose.model("EarlyAccess", EarlySchema, "EarlyAccess");
