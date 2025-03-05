const express = require("express");
const router = express.Router();
const userController = require("../controllers/fronted/userController");
const userConsultantController = require("../controllers/fronted/userConsultantController");
const singleStorageUpload = require("../middlewares/singleStorageUpload"); // Adjust the path
const verifyAdmin = require("../middlewares/adminVerification");
const userVerification = require("../middlewares/userVerification");

router.post(
  "/user/user-list",
  verifyAdmin.verifyAdminToken,
  userController.userList
);

router.post("/user/sendOTP", userController.sendOTP);
router.post("/user/resendOTP", userController.resendOTP);
router.post("/user/signup", userController.signup);
router.post("/user/login", userController.login);
router.get("/user/userDetail", userController.getUserDetail);
router.post("/user/changePassword", userController.changePassword);
router.post("/user/forgotEmailLink", userController.forgotEmailLink);
router.post("/user/resetPassword", userController.resetPassword);

router.post(
  "/user/status-update",
  verifyAdmin.verifyAdminToken,
  userController.statusUpdate
);
router.post(
  "/user/delete-user",
  verifyAdmin.verifyAdminToken,
  userController.deleteUser
);

router.post(
  "/user/consultant/top-consultant",
  userConsultantController.getTopConsultant
);

// Update User Profile Route
router.post(
  "/user/updateProfile",
  singleStorageUpload({ entity: "userprofile", fieldName: "file" }),
  userController.updateUserProfile
);

// Consultant api
router.get("/user/consultantList", userConsultantController.consultantList);
router.get(
  "/user/consultantDetail/:id",
  userConsultantController.getConsultantDetails
);
// Route to add favourite consultant
router.post(
  "/user/favouriteConsultant",
  userVerification.verifyUserToken,
  userConsultantController.addFavouriteConsultant
);
// Route to get user's favourite consultants
router.get(
  "/user/favouriteConsultants",
  userVerification.verifyUserToken,
  userConsultantController.getFavouriteConsultants
);
// Route to book a consultant appointment
router.post(
  "/user/bookAppointment",
  userVerification.verifyUserToken,
  userConsultantController.bookAppointment
);

router.get(
  "/user/bookAppointmentList",
  userVerification.verifyUserToken,
  userConsultantController.getUserAppointments
);

router.get(
  "/user/appointmentDetails/:appointmentId",
  userVerification.verifyUserToken,
  userConsultantController.getAppointmentDetails
);

router.post(
  "/user/cancelAppointment",
  userVerification.verifyUserToken,
  userConsultantController.cancelAppointment
);

// Route for adding a review and rating
router.post(
  "/user/addReview",
  userVerification.verifyUserToken,
  userConsultantController.addReview
);

router.get("/user/availability/:id", userConsultantController.getAvailability);

router.post("/user/contactUs", userConsultantController.contactUs);

router.post("/user/scheduleCall", userConsultantController.scheduleCall);

router.get("/user/user-details/:id", userController.userDetails);

router.post("/user/enquiry/form", userController.contactUsForm);

router.post("/user/call-details/:id", userController.callDetailsHook);
router.post("/user/call-record-details/:id", userController.callRecordHook);
router.post("/user/call-fallback", userController.callFallbackHook);

router.get(
  "/user/consultant-allreviews/:id",
  userConsultantController.getAllReviews
);

router.post("/user/add-subscriber", userController.AddSubscriber);

router.post("/user/add-early-access", userController.addEarlyAccessUsers);

module.exports = router;
