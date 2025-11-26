const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
      index: true, // helps prevent double booking
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Use ISO format for correct date & timezone behavior
    appointmentDate: {
      type: Date,
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

    // FULL lifecycle of appointment
    status: {
      type: String,
      enum: [
        "scheduled",      // waiting for time
        "ringing",        // call is being initiated
        "inCall",         // currently in call
        "completed",      // successfully finished
        "canceled",       // canceled by user/admin/consultant
        "expired",        // session time passed without joining
      ],
      default: "scheduled",
    },

    // Who canceled (u = user, c = consultant, a = admin)
    canceledBy: {
      type: String,
      enum: ["u", "c", "a", null],
      default: null,
    },

    cancelReason: {
      type: String,
      default: "",
    },

    // CALL SESSION DETAILS
    callStartedAt: {
      type: Date,
    },

    callEndedAt: {
      type: Date,
    },

    callDurationSeconds: {
      type: Number,
      default: 0,
    },

    // RECORDING URL (Twilio, Agora, internal storage, etc.)
    recordingUrl: {
      type: String,
      default: null,
    },

    // More robust than strings
    callSid: {
      type: String,
      default: null,
    },

    // For notification + reminder logic
    reminderSent: {
      type: Boolean,
      default: false,
    },

    // For email flow tracking
    isMailSent: {
      type: Boolean,
      default: false,
    },

    // Optional user rating system
    userRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    consultantRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

appointmentSchema.index(
  { consultantId: 1, appointmentDate: 1, "timeSlot.startTime": 1 },
  { unique: false }
);

module.exports = mongoose.model("Appointment", appointmentSchema, "appointments");
