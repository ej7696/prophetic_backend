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

    // Store the actual session datetime in real Date format
    sessionStart: {
      type: Date,
      required: true,
    },

    sessionEnd: {
      type: Date,
      required: true,
    },

    // Keep original values for UI display, if needed
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

    durationMinutes: {
      type: Number,
      required: true,
    },

    // Booking status
    status: {
      type: String,
      enum: ["upcoming", "in-call", "completed", "canceled", "no-show"],
      default: "upcoming",
    },

    // Call session details
    callStatus: {
      type: String,
      enum: ["idle", "ringing", "inCall", "ended"],
      default: "idle",
    },

    callStartedAt: {
      type: Date,
      default: null,
    },

    callEndedAt: {
      type: Date,
      default: null,
    },

    callDurationSeconds: {
      type: Number,
      default: 0,
    },

    callRecordingUrl: {
      type: String,
      default: null,
    },

    callSid: {
      type: String,
      default: null,
    },

    // Cancellation fields
    canceledBy: {
      type: String,
      enum: ["user", "consultant", null],
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    // Email states
    isMailSent: {
      type: Boolean,
      default: false,
    },

    // Payment (future)
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    sessionPrice: {
      type: Number,
      default: 0,
    },

    refundStatus: {
      type: String,
      enum: ["none", "pending", "completed"],
      default: "none",
    },

    transactionId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// INDEXES for faster queries and double-booking protection
appointmentSchema.index({ consultantId: 1, sessionStart: 1 });
appointmentSchema.index({ sessionStart: 1 });
appointmentSchema.index({ userId: 1 });

module.exports = mongoose.model(
  "Appointment",
  appointmentSchema,
  "appointments"
);
