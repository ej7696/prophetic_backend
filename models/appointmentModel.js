const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Store as real Date, not string
    appointmentDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      startTime: { type: String, required: true }, // "14:00"
      endTime: { type: String, required: true },   // "14:30"
    },

    timeZone: {
      type: String,
      required: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },

    // Extended session states
    status: {
      type: String,
      enum: ["upcoming", "inCall", "completed", "canceled"],
      default: "upcoming",
    },

    // Who canceled the appointment: "user" | "consultant" | null
    canceledBy: {
      type: String,
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    // Twilio or real-time call metadata
    callSid: {
      type: String,
      default: null,
    },

    callDuration: {
      type: Number,
      default: 0,
    },

    // Recording info (future-proof)
    recordingUrl: {
      type: String,
      default: null,
    },

    isRecordingEnabled: {
      type: Boolean,
      default: true,
    },

    // Revenue fields
    price: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    // Prevent double-booking: lock slot until confirmed
    isSlotLocked: {
      type: Boolean,
      default: false,
    },

    isMailSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema, "appointments");
