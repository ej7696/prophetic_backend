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

const applicantSchema = mongoose.Schema(
  {
    personalInfo: personal,
    professionalInfo: professional,
    educationalInfo: educational,
    videoPath: {
      type: String,
    },
    isVideo: {
      type: Boolean,
      default: false,
    },
    signature: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "interview",
        "declined",
        "approved",
        "onboarded",
        "selected",
      ],
      // enum:['pending','selected','rejected','in-review', 'accepted'],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    profileForm: profileForm,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Applicants", applicantSchema);
