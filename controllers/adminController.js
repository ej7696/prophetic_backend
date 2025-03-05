const admin = require("../models/admin");
const Appointments = require("../models/appointmentModel");
const Availablity = require("../models/availablity");
const Consultant = require("../models/consultantModel");
const User = require("../models/fronted/userModel");
const Enquiry = require("../models/Enquiry");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const consultantTemplates = require("../Templates/ConsultantTemplates");
const nodeMailer = require("nodemailer");
const Newsletter = require("../models/fronted/Newsletter");
const Subscribers = require("../models/fronted/Subscribers");
const Applicant = require("../models/applicant");
require("dotenv").config();

module.exports.adminLogin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const checkingUser = await admin.findOne({ email });
    if (!checkingUser) {
      return res.send({
        status: "error",
        message: "Email Address Or Password Invalid",
      });
    }
    // if (checkingUser.password !== password)
    //   return res.send({
    //     status: "error",
    //     message: "Username Or Password Not Matched",
    //   });
    if (checkingUser.status !== "active") {
      return res.status(202).send({
        status: false,
        message: "Account is inactive. Please contact super admin",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(
      password,
      checkingUser.password
    );
    if (!isPasswordValid) {
      return res.status(202).send({
        status: false,
        message: "Email Address Or Password Invalid",
      });
    }
    const payload = {
      userId: checkingUser._id,
      email: checkingUser.email,
    };
    const expireTime = rememberMe ? "1d" : "1h";
    const secret = process.env.ADMIN_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: expireTime });
    const userInfo = {
      name: checkingUser.name,
      profilePhoto: checkingUser.profilePhoto,
      email: checkingUser.email,
      id: checkingUser._id,
      modules: checkingUser.modules,
      type: checkingUser.type,
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

module.exports.changePassword = async (req, res) => {
  try {
    const { email, confirmNewPassword } = req.body;
    const result = await admin.updateOne(
      { email },
      { $set: { password: confirmNewPassword } }
    );
    return res.send({ status: "Ok", message: "Password Changed" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const updateData = {
      name: name,
    };
    if (req?.file?.path) {
      updateData.profilePhoto = req.file.path;
    }

    const result = await admin.findOneAndUpdate(
      { email: email },
      { $set: updateData },
      { returnDocument: "after", new: true }
    );
    return res.send({ status: "Ok", message: "Profile Updated", data: result });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.consultantAppointments = async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10, status } = req.body;

    const skip = (page - 1) * pageSize;

    const condition = { consultantId: userId };
    if (status) {
      condition.status = status;
    }

    const consultantAppointments = await Appointments.find(condition)
      .populate({
        path: "userId",
        select: "firstName lastName profileImage",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    const totalCount = await Appointments.countDocuments(condition);

    return res.send({
      status: true,
      message: "Consultant appointments listed",
      data: consultantAppointments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount: totalCount,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred during fetching the data",
    });
  }
};

module.exports.consultantAvailablity = async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.body;
    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;

    const consultantAvailable = await Availablity.findOne({
      consultantId: userId,
    })
      .select({
        availablity: { $slice: [skip, limit] },
      })
      .lean();

    if (!consultantAvailable || consultantAvailable.availablity.length === 0) {
      return res.status(202).send({
        status: false,
        message: "No availability found for the consultant",
      });
    }

    const totalRecords = await Availablity.aggregate([
      { $match: { consultantId: new ObjectId(userId) } },
      { $project: { totalSlots: { $size: "$availablity" } } },
    ]);

    const totalAvailabilities =
      totalRecords.length > 0 ? totalRecords[0].totalSlots : 0;

    return res.send({
      status: true,
      message: "Consultant availability list",
      data: consultantAvailable.availablity,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAvailabilities / limit),
        totalRecords: totalAvailabilities,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred during fetching the data",
    });
  }
};

module.exports.consultantsAndUsers = async (req, res) => {
  try {
    const { cStatus = "Active", uStatus = "Active" } = req.body;

    const consultants = await Consultant.find({ status: cStatus });
    const users = await User.find({ status: uStatus });
    return res.send({
      status: true,
      message: "Consultant and User list fetched",
      data: { users: users, consultants: consultants },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred during fetching the data",
    });
  }
};

module.exports.enquiryList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const allEnquiries = await Enquiry.find()
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });
    const totalRecords = await Enquiry.countDocuments();

    return res.send({
      status: true,
      message: "Enquiries Fetched Successfully",
      data: allEnquiries,
      pagination: {
        totalRecords: totalRecords,
        totalPages: Math.ceil(totalRecords / pageSize),
        currentPage: page,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred during fetching the data",
    });
  }
};

module.exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params; // Get the enquiry ID from request parameters

    if (!id) {
      return res
        .status(400)
        .send({ status: false, message: "Enquiry ID is required" });
    }

    // Check if the enquiry exists
    const existingEnquiry = await Enquiry.findById(id);
    if (!existingEnquiry) {
      return res
        .status(404)
        .send({ status: false, message: "Enquiry not found" });
    }

    // Delete the enquiry
    await Enquiry.findByIdAndDelete(id);

    return res.send({
      status: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteEnquiry:", error);
    return res.status(500).send({
      status: false,
      message: "An error occurred while deleting the enquiry",
    });
  }
};

module.exports.forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const consultantInfo = await admin.findOne({ email: email });

    if (!consultantInfo)
      return res.send({
        status: "error",
        message: "This Email is Not Registered With Any Account",
      });
    console.log(consultantInfo);
    const otp = generateOTP();

    const resultOfUpdate = await admin.updateOne(
      { _id: consultantInfo._id },
      { $set: { otp: otp } }
    );

    console.log("resultOfUpdate", resultOfUpdate);

    const mailResult = await sendEmail(
      consultantTemplates.forgetPasswordOtp(
        consultantInfo.name,
        consultantInfo.email,
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

    const consultantDetails = await admin.findOne({ email: email });
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

    const result = await admin.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
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

module.exports.AddNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const attachments = req.files ? req.files.map((file) => file.filename) : [];

    if (!subject) {
      return res
        .status(400)
        .send({ status: false, message: "Subject is required" });
    }
    if (!content) {
      return res
        .status(400)
        .send({ status: false, message: "Content is required" });
    }

    const newNewsletter = new Newsletter({
      subject,
      content,
      attachments,
    });

    await newNewsletter.save();

    const subscribers = await Subscribers.find().select("email");

    const mailOptions = {
      from: process.env.MAIL_ID,
      to: subscribers.map((sub) => sub.email),
      subject: subject,
      html: content,
      attachments: attachments.map((filename) => ({
        filename,
        path: `public/attachments/${filename}`,
      })),
    };

    const emailSent = await sendEmail(mailOptions);
    if (emailSent) {
      console.log("Emails sent successfully");
    } else {
      console.log("Failed to send emails");
    }

    return res.status(201).send({
      status: true,
      message: "Newsletter saved successfully and emails sent",
      data: newNewsletter,
    });
  } catch (error) {
    console.error("Error in AddNewsletter:", error);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
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

module.exports.SubscribersList = async (req, res) => {
  try {
    const { page, pageSize } = req.query;

    console.log(page, pageSize);

    let subscribers, totalRecords, totalPages;

    if (!page || !pageSize) {
      subscribers = await Subscribers.find().sort({ createdAt: -1 });
      totalRecords = subscribers.length;
      totalPages = 1;
    } else {
      const skip = (page - 1) * pageSize;
      subscribers = await Subscribers.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);
      totalRecords = await Subscribers.countDocuments();
      totalPages = Math.ceil(totalRecords / pageSize);
    }

    return res.send({
      status: true,
      message: "Subscribers fetched successfully",
      data: subscribers,
      pagination: {
        currentPage: page || 1,
        totalPages,
        totalRecords,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred during fetching the data",
    });
  }
};

module.exports.DeleteDeclinedUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Applicant.findById(userId);

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    await Applicant.findByIdAndDelete(userId);

    return res.status(200).send({
      status: true,
      message: "User successfully deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred during the deletion process",
    });
  }
};

module.exports.DeleteSubscriber = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await Subscribers.findById(userId);

    if (!user) {
      return res.status(404).send({
        status: false,
        message: "User not found",
      });
    }

    await Subscribers.findByIdAndDelete(userId);

    return res.status(200).send({
      status: true,
      message: "User successfully deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      status: false,
      message: "An error occurred during the deletion process",
    });
  }
};
