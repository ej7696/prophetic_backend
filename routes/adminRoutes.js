const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");
const StaffController = require("../controllers/admin/StaffController");
const userController = require("../controllers/fronted/userController");
const verify = require("../middlewares/adminVerification");
const { upload } = require("../middlewares/multerForUpdateImage");
const { set } = require("../middlewares/newsletter");

router.post("/admin/login", controller.adminLogin);

router.post("/admin/change-passwords", controller.changePassword);
router.post(
  "/admin/update-profile",
  upload.single("profilePhoto"),
  controller.updateProfile
);

router.post(
  "/admin/consultant/appointment-listing",
  verify.verifyAdminToken,
  controller.consultantAppointments
);

router.post(
  "/admin/consultant/availablity-listing",
  verify.verifyAdminToken,
  controller.consultantAvailablity
);

router.get(
  "/admin/enquiries-list",
  verify.verifyAdminToken,
  controller.enquiryList
);

router.post(
  "/admin/enquiries-list/delete/:id",
  verify.verifyAdminToken,
  controller.deleteEnquiry
);

router.post("/admin/consulant-user/listing", controller.consultantsAndUsers);

router.post(
  "/staffusers/create",
  verify.verifyAdminToken,
  upload.single("profilePhoto"),
  StaffController.create
);
router.get(
  "/staffusers/get-all",
  verify.verifyAdminToken,
  StaffController.getAll
);
router.get(
  "/staffusers/get/:id",
  verify.verifyAdminToken,
  StaffController.getById
);
router.put(
  "/staffusers/update/:id",
  verify.verifyAdminToken,
  upload.single("profilePhoto"),
  StaffController.update
);
router.delete(
  "/staffusers/delete/:id",
  verify.verifyAdminToken,
  StaffController.delete
);
router.get(
  "/staffusers/change-status/:id",
  verify.verifyAdminToken,
  StaffController.changeStatus
);

router.post("/admin/forget-password", controller.forgetPassword);
router.post("/admin/verify-otp", controller.verifyOtp);
router.post("/admin/reset-password", controller.resetPassword);
router.post(
  "/admin/early-access/delete/:id",
  verify.verifyAdminToken,
  userController.deleteEarlyAccess
);
router.get(
  "/admin/early-access/list",
  verify.verifyAdminToken,
  userController.earlyAccessList
);
router.post(
  "/admin/add-newsletter",
  verify.verifyAdminToken,
  set.array("attachments"),
  controller.AddNewsletter
);

router.get(
  "/admin/subscribers-list",
  verify.verifyAdminToken,
  controller.SubscribersList
);

router.post(
  "/admin/delete-declined-user",
  verify.verifyAdminToken,
  controller.DeleteDeclinedUser
);
router.post(
  "/admin/delete-subscriber",
  verify.verifyAdminToken,
  controller.DeleteSubscriber
);

module.exports = router;

//time
