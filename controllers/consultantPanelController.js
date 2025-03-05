const consultant = require("../models/consultantModel");
const { format } = require("date-fns");
const Availablity = require("../models/availablity");
const Appointment = require("../models/appointmentModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
require("dotenv").config();
const userTemplate = require("../Templates/UserEmailTemplates");
const nodeMailer = require("nodemailer");

module.exports.setAvailablity = async (req, res) => {
  try {
    const { availablity, timeZone } = req.body;
    const { userId } = req.user;

    const consultantId = new ObjectId(userId);

    for (let i = 0; i < availablity.length; i++) {
      const { date } = availablity[i];

      const existingAvailability = await Availablity.findOne({
        consultantId,
        "availablity.date": date,
      });

      if (existingAvailability) {
        return res.send({
          status: "error",
          message: `Availability for date ${date} already exists. Please update it instead of adding.`,
        });
      }

      // Add the new availability if the date doesn't exist
      await Availablity.updateOne(
        { consultantId },
        {
          $addToSet: {
            availablity: {
              timezone: timeZone,
              date,
              timeSlots: availablity[i].timeSlots,
            },
          },
        },
        { upsert: true }
      );
    }

    return res.send({
      status: "Ok",
      message: "Availability added successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.availabilityList = async (req, res) => {
  try {
    const { userId } = req.user;
    const parsed = new mongoose.Types.ObjectId(userId);
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const availabilityData = await Availablity.aggregate([
      { $match: { consultantId: parsed } },
      { $unwind: "$availablity" },
      { $sort: { "availablity.createdAt": -1 } },
      {
        $group: {
          _id: "$consultantId",
          availablity: { $push: "$availablity" },
        },
      },
      { $project: { _id: 0, availablity: 1 } },
    ]);

    const totalAvailabilityCount = await Availablity.aggregate([
      { $match: { consultantId: parsed } },
      { $project: { count: { $size: "$availablity" } } },
    ]);

    const totalRecords = totalAvailabilityCount[0]?.count || 0;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return res.send({
      status: "Ok",
      message: "Availabilities fetched",
      data: availabilityData,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalRecords: totalRecords,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.availablityDetails = async (req, res) => {
  try {
    const { date } = req.body; // The date for which slots are requested
    const { userId } = req.user; // Consultant's userId

    const consultantId = new ObjectId(userId); // Convert userId to ObjectId

    // Query to find the availability slots for the given date and consultantId
    const result = await Availablity.findOne(
      {
        consultantId, // Match the consultant's availability document
        availablity: {
          $elemMatch: { date }, // Find the matching date in the availability array
        },
      },
      { "availablity.$": 1 } // Project only the matching availability entry
    );

    // If no availability found for the given date, return an error
    if (!result) {
      return res.send({
        status: "error",
        message: `No availability found for date ${date}.`,
      });
    }

    // Return the available slots for the requested date
    return res.send({
      status: "Ok",
      message: "Availability slots fetched successfully.",
      slots: result.availablity[0].timeSlots, // Time slots for the matching date
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.updateSlotsWithDate = async (req, res) => {
  try {
    const { date, timeSlots, timeZone } = req.body; // The date and new time slots to update
    const { userId } = req.user; // Consultant's userId

    const consultantId = new ObjectId(userId); // Parse userId to ObjectId

    const result = await Availablity.updateOne(
      {
        consultantId, // Match the consultant's availability document
        "availablity.date": date, // Match the specific date in the availability array
      },
      {
        $set: {
          "availablity.$.timeSlots": timeSlots, // Update time slots for the matched date
          "availablity.$.timezone": timeZone,
        },
      },
      { new: true } // Return the updated document
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({
        status: "error",
        message: `No availability found for date ${date}.`,
      });
    }

    return res.send({
      status: "Ok",
      message: "Slots updated successfully.",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.getConAppointments = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, pageSize = 10, status } = req.query;
    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;
    const filter = { consultantId: userId };
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate({
        path: "userId",
        select: "firstName lastName profileImage",
      })
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .exec();

    console.log("appointments --", appointments);

    if (!appointments.length) {
      return res.status(202).json({
        status: false,
        message: "No appointments found for the user.",
        data: [],
      });
    }

    const appointmentDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const {
          consultantId,
          callDuration,
          appointmentDate,
          timeSlot,
          timeZone,
          duration,
          canceledBy,
          updatedAt,
          createdAt,
        } = appointment;

        return {
          appointmentId: appointment._id,
          user: {
            _id: appointment?.userId?._id,
            firstName: appointment?.userId?.firstName,
            lastName: appointment?.userId?.lastName,
            profilePhoto: appointment?.userId?.profileImage,
          },
          appointmentDate,
          timeSlot,
          timeZone,
          duration,
          canceledBy,
          callDuration,
          updatedAt,
          createdAt,
          status: appointment.status,
          cancelReason: appointment.cancelReason || "",
        };
      })
    );

    const totalRecords = await Appointment.countDocuments(filter);

    return res.status(200).json({
      status: true,
      message: "Appointments retrieved successfully.",
      data: appointmentDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
      },
    });
  } catch (error) {
    console.error("Error retrieving user appointments:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while retrieving appointments.",
    });
  }
};

module.exports.cancelAppointment = async (req, res) => {
  const { appointmentId, reason } = req.body;

  if (!ObjectId.isValid(appointmentId)) {
    return res.status(400).json({
      status: false,
      message: "Invalid appointment ID.",
    });
  }

  try {
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: { status: "canceled", canceledBy: "c", cancelReason: reason } },
      { new: true }
    )
      .populate({ path: "userId", select: "firstName lastName email" })
      .populate({
        path: "consultantId",
        select: "personalInfo.fullname auth.email",
      });

    if (!appointment) {
      return res.json({
        status: false,
        message: "Appointment not found.",
      });
    }

    const userFullName = `${appointment.userId.firstName} ${appointment.userId.lastName}`;
    const { email: userEmail } = appointment.userId;
    const { email: consultantEmail } = appointment.consultantId.auth;
    const { fullname: consultantFullName } =
      appointment.consultantId.personalInfo;

    const mailOptionsForUser =
      userTemplate.AppointmentCanceledByConsultantToUser(
        userEmail,
        userFullName,
        appointment.appointmentDate,
        appointment.timeSlot.startTime
      );

    const mailOptionsForConsultant =
      userTemplate.AppointmentCancellationConfirmationToConsultant(
        consultantEmail,
        consultantFullName,
        userFullName,
        appointment.appointmentDate,
        appointment.timeSlot.startTime
      );

    await Promise.all([
      sendEmail(mailOptionsForUser),
      sendEmail(mailOptionsForConsultant),
    ]);

    return res.status(200).json({
      status: true,
      message: "Appointment canceled successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while canceling the appointment.",
    });
  }
};

async function sendEmail(mailOptions) {
  try {
    let transporter = nodeMailer.createTransport({
      host: "smtp.titan.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_ID,
        pass: process.env.PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const info = await transporter.sendMail(mailOptions);
    console.log("mail info", info.response);
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
}

module.exports.deleteDayAvailability = async (req, res) => {
  try {
    const { date } = req.body;
    const { userId } = req.user;
    const consultantId = userId;
    console.log(req.user);

    if (!consultantId || !date) {
      return res.status(400).send({
        status: "error",
        message: "consultantId and date are required.",
      });
    }

    const result = await Availablity.updateOne(
      { consultantId: consultantId },
      { $pull: { availablity: { date: date } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send({
        status: "error",
        message: "No availability found for the specified date.",
      });
    }

    return res.send({
      status: "Ok",
      message: `Availability deleted for ${date}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      status: "error",
      message: "An error occurred while deleting availability.",
    });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const { email, confirmNewPassword } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(confirmNewPassword, saltRounds);

    const result = await consultant.updateOne(
      { "personalInfo.email": email },
      { $set: { "auth.password": hashedPassword } }
    );

    if (result.nModified === 0) {
      return res.status(404).send({
        status: "error",
        message: "User not found or password already set to this value",
      });
    }

    return res.send({ status: "Ok", message: "Password Changed" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { email, name } = req.body;

    const updateData = {
      "personalInfo.fullname": name,
    };

    if (req?.file?.path) {
      updateData["profileForm.profilePhoto"] = req.file.path;
    }

    const result = await consultant.findOneAndUpdate(
      { "personalInfo.email": email },
      {
        $set: updateData,
      },
      { returnDocument: "after", new: true }
    );

    if (result) {
      return res.send({
        status: "Ok",
        message: "Profile Updated",
        data: result,
      });
    } else {
      return res
        .status(404)
        .send({ status: "error", message: "Consultant not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.DashboardData = async (req, res) => {
  try {
    const { userId } = req.user;
    const consultantId = new ObjectId(userId);
    const result = await Appointment.aggregate([
      {
        $match: { consultantId: consultantId },
      },
      {
        $group: {
          _id: null,
          canceledCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "canceled"] }, 1, 0],
            },
          },
          upcomingCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "upcoming"] }, 1, 0],
            },
          },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const consultantInfo = await consultant
      .find({ _id: consultantId })
      .select("workingStatus status");

    const areaChartData = {
      name: "Appointments",
      data: await getMonthlyAppointments(consultantId),
    };

    return res.send({
      status: true,
      message: "Dashboard data fetched",
      data: result,
      areaChartData: areaChartData,
      workingStatus: consultantInfo[0]?.workingStatus,
      consultantStatus: consultantInfo[0]?.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: false, message: error.message });
  }
};

async function getMonthlyAppointments(id) {
  const currentDate = new Date();
  const appointmentsByMonth = [];

  for (let i = 0; i < 12; i++) {
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    );
    const endOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i + 1,
      0,
      23,
      59,
      59
    );

    const appointments = await Appointment.countDocuments({
      consultantId: id,
      appointmentDate: {
        $gte: startOfMonth.toISOString().split("T")[0],
        $lte: endOfMonth.toISOString().split("T")[0],
      },
    });

    appointmentsByMonth.push(appointments);
  }

  return appointmentsByMonth;
}

module.exports.changeWorkingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { userId } = req.user;
    if (!status) {
      return res
        .status(400)
        .send({ status: false, message: "Status is required" });
    }
    const updatedConsultant = await consultant.findOneAndUpdate(
      { _id: userId },
      { $set: { workingStatus: status } },
      { new: true }
    );

    if (!updatedConsultant) {
      return res.status(400).json({
        status: false,
        message: "Failed to update working status",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Working status updated successfully",
      data: updatedConsultant,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

module.exports.consultantStatus = async (req, res) => {
  try {
    const { userId } = req.user;
    const consultantId = new ObjectId(userId);

    const consultantStatus = await consultant
      .findOne({ _id: consultantId })
      .select("status");

    return res.send({
      status: true,
      message: "Consutant status fetched",
      data: consultantStatus,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};
