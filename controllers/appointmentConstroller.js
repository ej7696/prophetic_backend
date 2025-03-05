const appointment = require("../models/appointmentModel");
const user = require("../models/fronted/userModel");
const consultant = require("../models/consultantModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

module.exports.appointementListing = async (req, res) => {
  try {
    const { searchTerm, page = 1, limit = 10 } = req.body;

    const regex = new RegExp(searchTerm, "i");
    const skip = (page - 1) * limit;

    console.log("regex ++ ", regex);

    const aggregate = [
      {
        $lookup: {
          from: "consultants",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultantDetails",
        },
      },
      {
        $unwind: {
          path: "$consultantDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          appointmentDate: 1,
          status: 1,
          timeSlot: 1,
          createdAt: 1,
          consultantName: "$consultantDetails.personalInfo.fullname",
          consultantProfile: "$consultantDetails.profileForm.profilePhoto",
          userName: {
            $concat: ["$userDetails.firstName", " ", "$userDetails.lastName"],
          },
          userProfile: { $ifNull: ["$userDetails.profileImage", null] },
        },
      },
    ];

    if (searchTerm) {
      aggregate.push({
        $match: {
          $or: [{ consultantName: regex }, { userName: regex }],
        },
      });
    }

    const appointmentList = await appointment
      .aggregate(aggregate)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCountResult = await appointment.aggregate([
      ...aggregate,
      { $count: "totalCount" },
    ]);

    const totalCount =
      totalCountResult.length > 0 ? totalCountResult[0].totalCount : 0;

    return res.send({
      status: "Ok",
      message: "Appointments Fetched Successfully",
      data: appointmentList,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};


module.exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params; // Get the appointment ID from request parameters

    if (!id) {
      return res
        .status(400)
        .send({ status: "error", message: "Appointment ID is required" });
    }

    // Check if the appointment exists
    const existingAppointment = await appointment.findById(id);
    if (!existingAppointment) {
      return res
        .status(404)
        .send({ status: "error", message: "Appointment not found" });
    }

    // Delete the appointment
    await appointment.findByIdAndDelete(id);

    return res.send({
      status: "Ok",
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteAppointment:", error);
    return res.status(500).send({ status: "error", message: error.message });
  }
};
