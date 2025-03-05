const mongoose = require("mongoose");

const personal = mongoose.Schema({
  fullname: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
});

const professional = mongoose.Schema({
  experience: {
    type: String,
    required: true,
  },
  specialities: {
    type: [String],
    required: true,
  },
  isBaptized: {
    type: Boolean,
    required: true,
  },
  description: {
    type: String,
  },
  workingHours: {
    type: String,
    required: true,
  },
  languages: {
    type: [String],
    required: true,
  },
});

const educational = mongoose.Schema({
  highestEducation: {
    type: String,
    required: true,
  },
  fieldOfStudy: {
    type: String,
    required: true,
  },
  certificate: {
    type: String,
    required: true,
  },
});

const auth = mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const profileForm = mongoose.Schema({
  uniqueName: {
    type: String,
    required: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  briefBio: {
    type: String,
    required: true,
  },
  specialities: {
    type: [String],
    required: true,
  },
  profilePhoto: {
    type: String,
    required: true,
  },
  voiceNote: {
    type: String,
    required: true,
  },
  consent: {
    type: Boolean,
    required: true,
  },
});

const consultantSchema = mongoose.Schema(
  {
    personalInfo: personal,
    professionalInfo: professional,
    educationalInfo: educational,
    auth: auth,
    profileForm: profileForm,
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicants",
      required: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    otp: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    workingStatus: {
      type: String,
      enum: ["Available", "Busy", "Away"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Consultant", consultantSchema, "consultants");
