const mongoose = require("mongoose");

const timeSlotSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // "14:00"
    endTime: { type: String, required: true },   // "14:30"

    // NEW → Prevent double-booking by marking slots as booked
    isBooked: { type: Boolean, default: false },

    // Track which appointment booked this slot (optional)
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
    timezone: { type: String, default: "UTC" },

    // Store date as a real Date, not string
    date: {
      type: Date,
      required: true,
    },

    timeSlots: [timeSlotSchema],
  },
  { timestamps: true }
);

const availabilitySchema = new mongoose.Schema(
  {
    consultantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultant",
      required: true,
    },

    // Holds multiple days of availability
    days: [availabilityDaySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Availability", availabilitySchema);
