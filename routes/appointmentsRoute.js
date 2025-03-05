const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middlewares/adminVerification");
const appointmentsController = require("../controllers/appointmentConstroller");

router.post(
  "/admin/appointments-listing",
  verifyAdmin.verifyAdminToken,
  appointmentsController.appointementListing
);
router.post(
  "/admin/appointments-listing/delete/:id",
  verifyAdmin.verifyAdminToken,
  appointmentsController.deleteAppointment
);

module.exports = router;
