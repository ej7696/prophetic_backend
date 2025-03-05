const express = require("express");
const router = express.Router();
const applicantController = require("../controllers/applicantController");
const consultantController = require("../controllers/consultantController");
const { upload } = require("../middlewares/consultantApplication");
const { uploadFilesMiddleware } = require("../middlewares/consultantFormFiles");
const verifyAdmin = require("../middlewares/adminVerification");

// Applicant Routes
router.post("/consultant/register", upload, applicantController.register);

router.post(
  "/consultant/list",
  verifyAdmin.verifyAdminToken,
  applicantController.listOfApplicants
);

router.get(
  "/consultant/counts",
  verifyAdmin.verifyAdminToken,
  applicantController.applicantsCount
);

router.post("/consultant/user-details", applicantController.user_details);

router.post("/applicant/action", consultantController.applicationAction);

router.post(
  "/applicant/submit-profile-form",
  uploadFilesMiddleware,
  consultantController.submitProfileForm
);

// Consultant Routes
router.post("/consultant/login", consultantController.consultantLogin);

router.post("/consultant/forgot-password", consultantController.forgetPassword);

router.post("/consultant/verify-otp", consultantController.verifyOtp);

router.post("/consultant/reset-password", consultantController.resetPassword);

router.post(
  "/consultant/change-passwords",
  consultantController.changePassword
);

router.post(
  "/consultants/listing-selected",
  consultantController.consultantListing
);

router.post(
  "/consultants/status-update",
  consultantController.consultantStatusUpdate
);

router.post(
  "/consultant/details",
  verifyAdmin.verifyAdminToken,
  consultantController.consultantDetails
);

router.post(
  "/consultant/delete/:userId",
  verifyAdmin.verifyAdminToken,
  consultantController.deleteConsultant
);

router.get(
  "/dashboard-admin/data",
  verifyAdmin.verifyAdminToken,
  consultantController.adminDashboardData
);

router.post(
  "/applicant/profile-form",
  applicantController.applicantProfileForm
);

module.exports = router;
