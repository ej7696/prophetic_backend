const mongoose = require("mongoose");

const available = mongoose.Schema(
  {
    timezone: { type: String, default: "UTC" },
    date: {
      type: String,
      required: true,
    },
    timeSlots: [
      {
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const availablity = mongoose.Schema(
  {
    availablity: [available],
    consultantId: {
      type: mongoose.Types.ObjectId,
      ref: "consultant",
      required: true,
    },
    timeZone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Availablity", availablity);
