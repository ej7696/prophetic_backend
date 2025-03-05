const applicant = require("../models/applicant");
const consultant = require("../models/consultantModel");
const user = require("../models/fronted/userModel");
const Appointment = require("../models/appointmentModel");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const nodeMailer = require("nodemailer");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const applicationTemplates = require("../Templates/ApplicantTemplates");
const consultantTemplates = require("../Templates/ConsultantTemplates");
const appointmentModel = require("../models/appointmentModel");
const main = require("../App");

module.exports.applicationAction = async (req, res) => {
  try {
    const { type, status, applicantId, position } = req.body;

    const id = new ObjectId(applicantId);
    const applicantInfo = await applicant.findById(id);

    if (!applicantInfo) {
      return res
        .status(400)
        .send({ status: "error", message: "Applicant Not Found" });
    }
    const { educationalInfo, professionalInfo, personalInfo } = applicantInfo;
    const {
      acceptPending,
      declinedPending,
      acceptInterview,
      acceptOnboard,
      declinedOnboard,
    } = applicationTemplates;

    const mailOption = {
      pending: {
        accepted: acceptPending(personalInfo.fullname, personalInfo.email),
        declined: declinedPending(personalInfo.fullname, personalInfo.email),
      },
      interview: {
        accepted: acceptInterview(
          personalInfo.fullname,
          personalInfo.email,
          `${process.env.LINK_URL}/consultant-form/noEdit/${applicantId}`
        ),
        declined: declinedPending(personalInfo.fullname, personalInfo.email),
      },
      onboarded: {
        accepted: acceptOnboard(personalInfo.fullname, personalInfo.email),
        declined: declinedOnboard(
          personalInfo.fullname,
          personalInfo.email,
          `${process.env.LINK_URL}/consultant-form/edit/${applicantId}`,
          req.body.feedback
        ),
      },
    };

    if (type === "accepted") {
      const mailOptions = mailOption[position][type];

      const mailResponse = await sendEmail(mailOptions);
      if (mailResponse) {
        if (position == "onboarded") {
          const hashedPassword = await bcrypt.hash("Prophetic@123", 10);

          const auth = {
            email: personalInfo.email,
            password: hashedPassword,
          };
          const payload = {
            personalInfo: personalInfo,
            professionalInfo: professionalInfo,
            educationalInfo: educationalInfo,
            applicantId: applicantInfo._id,
            auth: auth,
            profileForm: applicantInfo.profileForm,
          };
          const newConsultant = new consultant(payload);
          const response = await newConsultant.save();

          const result = await applicant.updateOne(
            { _id: id },
            { $set: { status: "selected" } }
          );
        } else {
          const resultOfUpdate = await applicant.updateOne(
            { _id: id },
            { $set: { status: status } }
          );
        }

        return res.send({ status: "Ok", message: "Approved Successfully" });
      } else {
        return res
          .status(400)
          .send({ status: "error", message: "Not Able to Send the Mail" });
      }
    } else if (type === "declined") {
      const { feedback } = req.body;

      const mailOptions = mailOption[position].declined;

      const mailResponse = await sendEmail(mailOptions);
      if (mailResponse) {
        const resultOfUpdate = await applicant.updateOne(
          { _id: id },
          { $set: { status: status, rejectionReason: feedback } }
        );
        return res.send({ status: "Ok", message: "Rejected Successfully" });
      } else {
        return res
          .status(400)
          .send({ status: "error", message: "Not Able to Send the Mail" });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

async function sendEmail(mailOptions) {
  try {
    let transporter = nodeMailer.createTransport({
      host: "smtp.titan.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.MAIL_ID, // Ensure this is set correctly
        pass: process.env.PASS, // Ensure this is set correctly
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
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

module.exports.submitProfileForm = async (req, res) => {
  try {
    const {
      userId,
      uniqueName,
      yearsOfExperience,
      briefBio,
      specialities,
      consent,
    } = req.body;

    const parsedId = new ObjectId(userId);
    const userDetails = await applicant.findById(parsedId);

    if (!userDetails)
      return res.send({ status: "error", message: "You Are Not Authrized" });

    const payload = {
      uniqueName: uniqueName,
      yearsOfExperience: yearsOfExperience,
      briefBio: briefBio,
      specialities: specialities,
      consent: consent,
      profilePhoto: req?.files?.profilePhoto[0]?.path,
      voiceNote: req?.files?.voiceNote[0]?.path,
    };

    const result = await applicant.updateOne(
      { _id: parsedId },
      { $set: { profileForm: payload, status: "onboarded" } }
    );

    return res.send({ status: "Ok", message: "Form Submitted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.consultantLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const checkingUser = await consultant.findOne({ "auth.email": email });
    if (!checkingUser) {
      return res.send({
        status: "error",
        message: "Email Address Or Password Invalid",
      });
    }
    if (checkingUser?.status === "Inactive")
      return res.send({
        status: "error",
        message: "Consultant is Inactive, Please Contact Support!",
      });

    const isMatch = await bcrypt.compare(password, checkingUser.auth.password);

    if (!isMatch) {
      return res.send({
        status: "error",
        message: "Email Address Or Password Invalid",
      });
    }

    const payload = {
      userId: checkingUser._id,
      email: checkingUser.auth.email,
    };
    const secret = process.env.ADMIN_SECRET;
    const token = jwt.sign(payload, secret);

    const userInfo = {
      isFirstLogin: checkingUser.isFirstLogin,
      email: checkingUser.auth.email,
      name: checkingUser.personalInfo.fullname,
      profilePhoto: checkingUser.profileForm.profilePhoto,
    };

    return res.send({
      status: "Ok",
      message: "Login Successful",
      data: { token: token, userInfo: userInfo },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const consultantInfo = await consultant.findOne({ "auth.email": email });

    if (!consultantInfo)
      return res.send({
        status: "error",
        message: "This Email is Not Registered With Any Account",
      });
    console.log(consultantInfo);
    const otp = generateOTP();

    const resultOfUpdate = await consultant.updateOne(
      { _id: consultantInfo._id },
      { $set: { otp: otp } }
    );

    console.log("resultOfUpdate", resultOfUpdate);

    const mailResult = await sendEmail(
      consultantTemplates.forgetPasswordOtp(
        consultantInfo.personalInfo.fullname,
        consultantInfo.auth.email,
        otp
      )
    );
    if (mailResult) {
      return res.send({ status: "Ok", message: "OTP Sent Successfully" });
    } else {
      return res
        .status(400)
        .send({ status: "error", message: "Not Able to Send the Mail" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

function generateOTP() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}

module.exports.verifyOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;

    const consultantDetails = await consultant.findOne({ "auth.email": email });
    console.log(consultantDetails);

    if (!consultantDetails)
      return res.send({
        status: "error",
        message: "Wrong OTP! Please Try Again",
      });

    if (consultantDetails.otp == otp) {
      return res.send({
        status: "Ok",
        message: "OTP Verification Successfull",
      });
    } else {
      return res.send({ status: "error", message: "OTP Not Matched!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { confirmNewPassword, email } = req.body;

    const hashedPassword = await bcrypt.hash(confirmNewPassword, 10);

    const result = await consultant.updateOne(
      { "auth.email": email },
      { $set: { "auth.password": hashedPassword } }
    );
    console.log(result);
    if (result.modifiedCount === 1) {
      return res.send({
        status: "Ok",
        message: "Password updated successfully",
      });
    } else {
      return res.send({
        status: "error",
        message: "Failed to update password, please try again",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    const { newPassword, email } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await consultant.updateOne(
      { "auth.email": email },
      { $set: { "auth.password": hashedPassword, isFirstLogin: false } }
    );
    if (result.modifiedCount === 1) {
      return res.send({
        status: "Ok",
        message: "Password updated successfully",
      });
    } else {
      return res.send({
        status: "error",
        message: "Failed to update password, please try again",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.consultantListing = async (req, res) => {
  try {
    const { searchQuery, page = 1, pageSize = 10 } = req.body; // Default to page 1 and 10 items per page

    const regexQuery = searchQuery
      ? {
          $regex: searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        }
      : undefined;

    const query = {
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

    // Calculate pagination
    const limit = parseInt(pageSize, 10);
    const skip = (parseInt(page, 10) - 1) * limit;

    // Fetch consultants with pagination
    const consultants = await consultant
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    const totalCount = await consultant.countDocuments(query);

    return res.send({
      status: "Ok",
      message: "Consultants Listed Successfully",
      data: consultants,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.consultantStatusUpdate = async (req, res) => {
  try {
    const { userId, status } = req.body;
    const parsedId = new ObjectId(userId);
    const resultUpdate = await consultant.updateOne(
      { _id: parsedId },
      { $set: { status: status } }
    );

    if (resultUpdate.modifiedCount === 1) {
      const payload = { status: status, userId: userId };
      console.log("payload", payload);
      main.emitStatus(payload);
      return res.send({ status: "Ok", message: "Status Updated Successfully" });
    } else {
      return res.send({ status: "error", message: "Status Not Updated" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.consultantDetails = async (req, res) => {
  try {
    const { userId } = req.body;
    const parsed = new ObjectId(userId);

    const consultantDetails = await consultant.findById(parsed);

    return res.send({
      status: "Ok",
      message: "User Details Fetched Successfully",
      data: consultantDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.deleteConsultant = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await consultant.deleteOne({ _id: userId });
    console.log(result);
    return res.send({
      status: "Ok",
      message: "Consultant Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.adminDashboardData = async (req, res) => {
  try {
    const pendingCount = await applicant.countDocuments({ status: "pending" });
    const consultantCount = await consultant.countDocuments();
    const usersCount = await user.countDocuments();
    const appointmentCount = await appointmentModel.countDocuments();

    const areaChartData = {
      name: "Appointments",
      data: await getMonthlyAppointments(),
    };

    const data = {
      pending: pendingCount,
      users: usersCount,
      consultants: consultantCount,
      appointments: appointmentCount,
      areaChartData: areaChartData,
    };

    return res.send({
      status: "Ok",
      message: "Admin Data fetched",
      data: data,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

async function getMonthlyAppointments() {
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

    // Query the database for appointment counts within the range
    const appointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: startOfMonth.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
        $lte: endOfMonth.toISOString().split("T")[0],
      },
    });

    // Push each month's data (in descending order of months)
    appointmentsByMonth.push(appointments);
  }

  return appointmentsByMonth;
}
