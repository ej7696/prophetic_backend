const mongoose = require("mongoose");

const callRecoardSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "appointments",
      required: true,
    },
    CallSid: {
      type: String,
      required: true,
    },
    RecordingSid: {
      type: String,
      required: true,
      unique: true,
    },
    RecordingUrl: {
      type: String,
      required: true,
    },
    AccountSid: {
      type: String,
      required: true,
    },
    RecordingStatus: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

callRecoardSchema.index({ RecordingSid: 1 });

module.exports = mongoose.model("CallRecoard", callRecoardSchema);
