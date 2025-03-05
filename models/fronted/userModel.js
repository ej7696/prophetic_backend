const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the User Schema
const UserSchema = mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    alternateNumber: String,
    profileImage: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    otp: {
      type: Number,
      default: null,
    },
    verifyOtp: {
      type: String,
      enum: ["verified", "unverified"],
      default: "unverified",
    },
    remider: { type: String },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    token: {
      type: String,
      default: null,
    },
    countryCode: { type: String },
    countryCode2: { type: String },
    resetPasswordExpires: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to hash the password before saving
UserSchema.pre("save", async function (next) {
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
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema, "users");
