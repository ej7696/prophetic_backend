const consultant = require("../models/applicant");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

module.exports.register = async (req, res) => {
  try {
    const {
      fullname,
      dob,
      email,
      phoneNumber,
      address,
      specialities,
      isBaptized,
      description,
      workingHours,
      languages,
      highestEducation,
      fieldOfStudy,
      certificate,
      isVideo,
      signature,
      experience,
    } = req.body;
    const prevCheck = await consultant.findOne({
      $or: [
        { "personalInfo.email": email },
        { "personalInfo.phoneNumber": phoneNumber },
      ],
    });
    console.log("req.file.path", req?.file?.path);

    if (prevCheck) {
      return res.status(400).json({
        status: "error",
        message: "Consultant with this email or phone number already exists",
      });
    }

    const payload = {
      personalInfo: { fullname, dob, email, phoneNumber, address },
      professionalInfo: {
        experience,
        specialities,
        isBaptized,
        description,
        workingHours,
        languages,
      },
      educationalInfo: { highestEducation, fieldOfStudy, certificate },
      videoPath: req?.file?.path ?? null,
      isVideo,
      signature,
    };
    const newConsultant = new consultant(payload);
    const response = await newConsultant.save();

    if (response) {
      return res
        .status(201)
        .send({ status: "Ok", message: "Consultant Created Successfully" });
    } else {
      return res
        .status(400)
        .send({ status: "error", message: "Failed to Create Consultant" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.listOfApplicants = async (req, res) => {
  try {
    const { status, searchQuery, currentPage, pageSize = 10 } = req.body; // Default values for pagination
    console.log(searchQuery);

    const regexQuery = searchQuery
      ? {
          $regex: searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        }
      : undefined;

    // Construct the query
    const query = {
      status: status,
      ...(searchQuery
        ? {
            $or: [
              { "personalInfo.phoneNumber": regexQuery },
              { "personalInfo.email": regexQuery },
              { "personalInfo.fullname": regexQuery },
            ],
          }
        : {}),
    };

    // Get total records count
    const totalRecords = await consultant.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / pageSize);

    // Fetch the records with pagination
    const response = await consultant
      .find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize);

    return res.send({
      status: "Ok",
      message: "Applicant Fetched",
      data: response,
      currentPage,
      totalPages,
      totalRecords,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.applicantsCount = async (req, res) => {
  try {
    const response = await consultant.aggregate([
      {
        $match: {
          status: "pending",
        },
      },
      {
        $group: {
          _id: "pending",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = response.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      { pending: 0, selected: 0 }
    ); // Initialize both counts to 0
    console.log(counts);

    // Ensure counts object contains both "pending" and "selected" keys
    return res.send({ status: "Ok", message: "Admin data", data: counts });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.user_details = async (req, res) => {
  try {
    const { userId } = req.body;

    const userIndex = new ObjectId(userId);
    const userDetails = await consultant.findById(userIndex);

    if (!userDetails) {
      return res
        .status(404)
        .send({ status: "error", message: "User not found" });
    }

    return res.send({
      status: "Ok",
      message: "User Details Fetched Successfully",
      data: userDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.applicantProfileForm = async (req, res) => {
  try {
    const { userId } = req.body;
    const parsed = new ObjectId(userId);

    const formDetails = await consultant.findOne(
      { _id: parsed },
      { profileForm: 1 }
    );

    if (!formDetails) {
      return res.send({ status: "error", message: "Applicant not found" });
    }

    return res
      .status(200)
      .send({ status: "Ok", data: formDetails.profileForm });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};
