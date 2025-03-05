const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const admin = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
    },
    email: {
      type: String,
      unique: true,
      match: /.+\@.+\..+/,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: /^[0-9]+$/,
    },
    modules: {
      type: [String],
      required: true,
    },
    type: {
      type: String,
      enum: ["Admin", "Staff"],
      default: "Staff",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
// Pre-save middleware to hash the password before saving
admin.pre("save", async function (next) {
  try {
    // Only hash the password if it is new or has been modified
    if (!this.isModified("password")) {
      return next();
    }

    // Generate a salt and hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare provided password with hashed password
admin.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Admin", admin);
