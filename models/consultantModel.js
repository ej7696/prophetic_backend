const mongoose = require("mongoose");

// Personal information about the consultant
const personalSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      // Often too strict – make optional so onboarding doesn’t fail
      required: false,
    },
    email: {
      type: String,
      // We keep it, but do NOT enforce unique here.
      // Login will be based on auth.email instead.
      required: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      // Make this optional to avoid blocking onboarding
      required: false,
      trim: true,
    },
  },
  { _id: false }
);

// Professional / ministry info
const professionalSchema = new mongoose.Schema(
  {
    experience: {
      type: String,
      required: true,
      trim: true,
    },
    specialities: {
      type: [String],
      required: true,
      default: [],
    },
    isBaptized: {
      type: Boolean,
      required: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    // You already have a slot-based availability system,
    // so workingHours as a string is more “display only”.
    workingHours: {
      type: String,
      required: false,
      trim: true,
    },
    languages: {
      type: [String],
      required: false,
      default: [],
    },
  },
  { _id: false }
);

// Educational information
const educationalSchema = new mongoose.Schema(
  {
    highestEducation: {
      type: String,
      required: false,
      trim: true,
    },
    fieldOfStudy: {
      type: String,
      required: false,
      trim: true,
    },
    certificate: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { _id: false }
);

// Auth block – this is what we’ll use for login
const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      // Enforce uniqueness here instead of personalInfo.email
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Public profile / storefront info
const profileFormSchema = new mongoose.Schema(
  {
    uniqueName: {
      type: String,
      required: true,
      trim: true,
      // Each consultant should have a unique handle (e.g. “prophet_alaere”)
      unique: true,
    },
    yearsOfExperience: {
      type: Number,
      required: false,
      default: 0,
    },
    briefBio: {
      type: String,
      required: false,
      trim: true,
    },
    specialities: {
      type: [String],
      required: false,
      default: [],
    },
    profilePhoto: {
      type: String,
      required: false, // don’t block onboarding if photo not uploaded yet
    },
    voiceNote: {
      type: String,
      required: false, // same here
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { _id: false }
);

const consultantSchema = new mongoose.Schema(
  {
    personalInfo: personalSchema,
    professionalInfo: professionalSchema,
    educationalInfo: educationalSchema,
    auth: authSchema,
    profileForm: profileFormSchema,

    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicants",
      required: true,
    },

    // First login flag – used to force password change
    isFirstLogin: {
      type: Boolean,
      default: true,
    },

    // OTP for password reset – you should also enforce expiry in code
    otp: {
      type: Number,
      default: null,
    },

    // Admin-level activation
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Manual/visible working status
    workingStatus: {
      type: String,
      enum: ["Available", "Busy", "Away"],
      default: "Available",
    },

    // -------- NEW FIELDS FOR REAL-TIME & CALLING LOGIC --------

    // Is the consultant currently online in the app?
    isOnline: {
      type: Boolean,
      default: false,
    },

    // Last time we saw this consultant active (for “last seen”)
    lastSeenAt: {
      type: Date,
      default: null,
    },

    // Current call/session state, helps control UI & routing
    currentCallStatus: {
      type: String,
      enum: ["idle", "ringing", "inCall"],
      default: "idle",
    },

    // If they are in a call/session, link to the appointment
    currentAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // Whether the consultant allows recording of calls by default
    callRecordingEnabled: {
      type: Boolean,
      default: true,
    },

    // For future analytics: total number of minutes spent in calls
    totalCallMinutes: {
      type: Number,
      default: 0,
    },

    // Simple rating system you can plug into later
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Explicit collection name kept same as before: "consultants"
module.exports = mongoose.model("Consultant", consultantSchema, "consultants");
