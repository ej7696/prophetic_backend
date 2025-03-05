const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  consultantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultant",  // This references the Consultant model
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",  // This references the User model
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "appointments",  // This references the User model
    required: true
  },
  rating: {
    type: Number,
    required: true
  },
  review: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Review", reviewSchema);
