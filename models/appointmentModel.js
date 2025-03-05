const mongoose = require("mongoose");

const appointment = mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId, // Store as ObjectId
      ref: "Consultant",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Store as ObjectId
      ref: "User",
      required: true,
    },
    appointmentDate: {
      type: String,
      required: true,
    },
    timeSlot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    timeZone: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "completed", "canceled"],
      default: "upcoming",
    },
    userEmail: {
      type: String,
    },
    canceledBy: { type: String, default: null },
    cancelReason: {
      type: String,
    },
    isScheduled: {
      type: String,
      enum: ["y", "n"],
      default: "n",
    },
    reminder: { type: String },
    callSid: {
      type: String,
    },
    callDuration: {
      type: String,
    },
    isMailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointment, "appointments");
