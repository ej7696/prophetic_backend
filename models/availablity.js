const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, "Invalid time format (HH:mm)"],
    },

    // Optional ability to disable a slot without deleting it
    isBlocked: {
      type: Boolean,
      default: false,
    },

    // For future: if user booked a slot, we lock it
    isBooked: {
      type: Boolean,
      default: false,
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  { _id: false }
);

const availabilityDaySchema = new mongoose.Schema(
  {
    timezone: {
      type: String,
      default: "UTC",
    },

    // Using ISO date fixes many bugs
    date: {
      type: Date,
      required: true,
    },

    timeSlots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
      index: true,
    },

    availability: {
      type: [availabilityDaySchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Unique day per consultant (prevents duplicate days)
availabilitySchema.index(
  { consultantId: 1, "availability.date": 1 },
  { unique: false }
);

module.exports = mongoose.model("Availability", availabilitySchema, "availability");
