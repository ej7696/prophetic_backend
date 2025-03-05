const mongoose = require("mongoose");


const StaffUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: /.+\@.+\..+/,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]+$/,
    },
    module: {
      type: [String],
      required: true,
    },
    type: {
      type: String,
      enum: ["Admin", "Staff"],
      default: "Staff",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("StaffUser", StaffUserSchema);
