const express = require("express");
const router = express.Router();
const consultantController = require("../controllers/consultantController");
const consultantPanelController = require("../controllers/consultantPanelController");
const verifyConsultant = require("../middlewares/consultantPanelVerification");
const { upload } = require("../middlewares/multerForUpdateImage");

router.post(
  "/consultant/set-availablity",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.setAvailablity
);

router.get(
  "/consultant/availablity/list",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.availabilityList
);

router.post(
  "/consultant/availablity/details-date",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.availablityDetails
);

router.post(
  "/consultant/availablity/update-slots",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.updateSlotsWithDate
);

router.get(
  "/consultant/appointmentList",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.getConAppointments
);
router.post(
  "/consultant/cancel-appointement",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.cancelAppointment
);

router.post(
  "/consultant/delete-availablity",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.deleteDayAvailability
);

router.post(
  "/consultant/change-passwords",
  consultantPanelController.changePassword
);

router.post(
  "/consultant/update-profile",
  upload.single("profilePhoto"),
  consultantPanelController.updateProfile
);

router.get(
  "/consultant/dashboard-data",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.DashboardData
);

router.post(
  "/consultant/workingstatus-update",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.changeWorkingStatus
);

router.get(
  "/consultant/status",
  verifyConsultant.verifyConsultantToken,
  consultantPanelController.consultantStatus
);

module.exports = router;
