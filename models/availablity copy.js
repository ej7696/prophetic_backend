const mongoose = require("mongoose");

const timeslot = mongoose.Schema({
  startTime: { type: Date, required: true }, // store date and time instead of time only
  endTime: { type: Date, required: true }, // store date and time instead of time only
});

const availablity = mongoose.Schema(
  {
    timezone: { type: String, default: "UTC" },
    timeSlots: [timeslot],
    consultantId: {
      type: mongoose.Types.ObjectId,
      ref: "consultant",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Availablity", availablity);
