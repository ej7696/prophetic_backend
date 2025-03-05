const mongoose = require("mongoose");
const crypto = require("crypto"); // For generating reset tokens
const { ObjectId } = mongoose.Types;
const nodeMailer = require("nodemailer");
require("dotenv").config();
// const mail = require('../Utils/sendMails')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const user = require("../../models/fronted/userModel");
const Appoinments = require("../../models/appointmentModel");
const { contactUsForm } = require("../../Templates/UserEmailTemplates");
const Enquiry = require("../../models/Enquiry");
const EarlyAccess = require("../../models/fronted/EarlyAccess");
const Subscriber = require("../../models/fronted/Subscribers");
const Newsletter = require("../../models/fronted/Newsletter");
const CallRecoard = require("../../models/callRecoarding");

const main = require("../../App");

const Joi = require("joi");
const { updateUserProfileSchema } = require("../../validations/userValidation"); // Import validation schema
const UserEmailTemplates = require("../../Templates/UserEmailTemplates");

function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
}

module.exports.sendOTP = async (req, res) => {
  try {
    const { email, firstName, phoneNumber } = req.body;

    // Check if a user with the same email already exists
    const existingUser = await user.findOne({ email });

    // Validate email format using a regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: false,
        message: "Invalid email format",
      });
    }

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User Email Address Already Exists",
      });
    }

    const existingUserByPhone = await user.findOne({ phoneNumber });
    if (existingUserByPhone) {
      return res.status(400).json({
        status: false,
        message: "Phone number already exists",
      });
    }

    const otp = generateOTP();

    const mailResult = await sendEmail(
      UserEmailTemplates.NewOtp(firstName, email, otp)
    );

    if (mailResult) {
      return res.status(201).json({
        status: true,
        message: "OTP sent successfully",
        email: email,
        otp: otp,
      });
    } else {
      return res.status(201).json({
        status: true,
        message: "Not Able to Send the Mail",
      });
    }
  } catch (error) {
    console.error("Error registering consultant:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while sending otp",
    });
  }
};

module.exports.resendOTP = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    // Check if a user with the same email already exists
    const existingUser = await user.findOne({ email });

    // Validate email format using a regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: false,
        message: "Invalid email format",
      });
    }

    const otp = generateOTP();
    const mailResult = await sendEmail(
      UserEmailTemplates.NewOtp(firstName, email, otp)
    );

    if (mailResult) {
      return res.status(201).json({
        status: true,
        message: "OTP sent successfully",
        email: email,
        otp: otp,
      });
    } else {
      return res.status(201).json({
        status: true,
        message: "Not Able to Send the Mail",
      });
    }
  } catch (error) {
    console.error("Error registering consultant:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while sending otp",
    });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password, fcmTotken, deviceId } = req.body;

    // Find user by email
    const checkingUser = await user.findOne({ email });
    if (!checkingUser) {
      return res.status(400).send({
        status: false,
        message: "Email Address Or Password Invalid",
      });
    }

    // Check if the user's OTP is verified
    if (checkingUser.verifyOtp !== "verified") {
      return res.status(403).send({
        status: false,
        message: "Account not verified. Please verify your account first.",
      });
    }

    // Check if the user is active
    if (checkingUser.status !== "Active") {
      return res.status(403).send({
        status: false,
        message: "Account is inactive. Please contact support.",
      });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(
      password,
      checkingUser.password
    );
    if (!isPasswordValid) {
      return res.status(400).send({
        status: false,
        message: "Email Address Or Password Invalid",
      });
    }

    // Generate JWT token
    const payload = {
      userId: checkingUser._id,
      email: checkingUser.email,
    };
    const secret = process.env.ADMIN_SECRET;
    const token = jwt.sign(payload, secret);

    // Save the token in the user record
    checkingUser.token = token;
    checkingUser.fcmTotken = fcmTotken;
    checkingUser.deviceId = deviceId;
    await checkingUser.save();

    // Remove the password field from the response
    const { password: _, ...userInfo } = checkingUser._doc;

    return res.status(200).send({
      status: true,
      message: "Login Successful",
      data: { userInfo: userInfo }, // Return user info without password
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(400).send({
      status: "error",
      message: "An error occurred during login",
    });
  }
};

module.exports.signup = async (req, res) => {
  try {
    // Destructure required fields from the request body
    const {
      firstName,
      lastName,
      dob,
      email,
      phoneNumber,
      password,
      countryCode,
      countryCode2,
      fcmTotken,
      deviceId,
    } = req.body;

    // Check if all required fields are provided
    if (
      !firstName ||
      !lastName ||
      !dob ||
      !email ||
      !phoneNumber ||
      !password
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Check if all required fields are provided
    if (
      !firstName ||
      !lastName ||
      !dob ||
      !email ||
      !phoneNumber ||
      !password
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Check if a user with the same email already exists
    const existingUser = await user.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: "User Email Address Already Exists",
      });
    }

    // Prepare the payload for the new consultant
    const payload = {
      firstName,
      lastName,
      dob,
      email,
      phoneNumber,
      password,
      countryCode,
      countryCode2,
      fcmTotken,
      deviceId,
      verifyOtp: "verified",
    };

    // Save the new consultant to the database

    const newUser = new user(payload);
    const savedUser = await newUser.save();

    if (savedUser) {
      return res.status(201).json({
        status: true,
        userInfo: savedUser,
        message: "User created successfully",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to create consultant",
      });
    }
  } catch (error) {
    console.error("Error registering consultant:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while registering the consultant",
    });
  }
};

module.exports.getUserDetail = async (req, res) => {
  try {
    // Get the token from the request header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token format

    // Check if the token is provided
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify the token
    let decoded;
    try {
      const secret = process.env.ADMIN_SECRET;
      decoded = jwt.verify(token, secret); // Verify token with the secret key
    } catch (error) {
      return res.status(401).json({
        status: false,
        message: "Invalid token. Please login again.",
      });
    }

    // Extract user ID from the token
    const userId = decoded.userId;

    // Fetch the user details from the database
    const userDetails = await user.findById(userId).select("-password"); // Exclude password

    // Check if user exists
    if (!userDetails) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    // Respond with user details
    return res.status(200).json({
      status: true,
      message: "User details retrieved successfully.",
      data: userDetails,
    });
  } catch (error) {
    console.error("Error retrieving user details:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while retrieving user details.",
    });
  }
};

module.exports.updateUserProfile = async (req, res) => {
  try {
    // Token extraction and validation
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
      });
    }

    let decoded;
    try {
      const secret = process.env.ADMIN_SECRET;
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json({
        status: false,
        message: "Invalid token. Please login again.",
      });
    }

    const userId = decoded.userId;

    // Validate incoming request data
    const {
      firstName,
      lastName,
      phoneNumber,
      alternateNumber,
      countryCode,
      countryCode2,
      dob,
    } = req.body;

    // Check if all required fields are provided
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: "All fields are required",
      });
    }

    // Prepare update object
    const updateData = {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber,
      countryCode: countryCode,
      countryCode2: countryCode2,
      alternateNumber: alternateNumber,
      dob: dob,
    };

    // If a file was uploaded, add it to the updateData
    if (req.upload?.filePath) {
      updateData.profileImage = req.upload.filePath;
    }

    // Update user information
    const updatedUser = await user
      .findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password");

    // Check if user was found and updated
    if (!updatedUser) {
      return res.json({
        status: false,
        message: "User not found.",
      });
    }

    // Respond with the updated user details
    return res.status(200).json({
      status: true,
      message: "User profile updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while updating user profile.",
    });
  }
};

module.exports.changePassword = async (req, res) => {
  try {
    // Token extraction and validation
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: false,
        message: "Access denied. No token provided.",
      });
    }

    let decoded;
    try {
      const secret = process.env.ADMIN_SECRET;
      decoded = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json({
        status: false,
        message: "Invalid token. Please login again.",
      });
    }

    const userId = decoded.userId;

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if all fields are provided
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.json({
        status: false,
        message:
          "All fields (currentPassword, newPassword, confirmPassword) are required.",
      });
    }

    // Check if newPassword and confirmPassword match
    if (newPassword !== confirmPassword) {
      return res.json({
        status: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Fetch user from the database
    const userToUpdate = await user.findById(userId);

    if (!userToUpdate) {
      return res.json({
        status: false,
        message: "User not found.",
      });
    }

    // Compare current password with the one in the database
    const isMatch = await bcrypt.compare(
      currentPassword,
      userToUpdate.password
    );
    if (!isMatch) {
      return res.json({
        status: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    console.log("currentPassword", userToUpdate);

    // Update the user's password in the database
    userToUpdate.password = newPassword;
    await userToUpdate.save();

    // Respond with success message
    return res.status(200).json({
      status: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while changing the password.",
    });
  }
};

module.exports.userList = async (req, res) => {
  try {
    const { searchTerm, page = 1, pageSize = 10 } = req.body; // Default to page 1 and pageSize 10
    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;

    // Build the search query
    let searchQuery = {};
    if (searchTerm) {
      const terms = searchTerm.split(" "); // Split search term by spaces

      searchQuery = {
        $and: terms.map((term) => ({
          $or: [
            { firstName: { $regex: term, $options: "i" } },
            { lastName: { $regex: term, $options: "i" } },
            { phoneNumber: { $regex: term, $options: "i" } },
          ],
        })),
      };
    }

    console.log("Search Query:", JSON.stringify(searchQuery, null, 2));

    // Fetch users with pagination
    const userData = await user
      .find(searchQuery)
      .sort({ createdAt: -1 }) // Sort by newest first
      .skip(skip) // Skip the documents for pagination
      .limit(limit); // Limit the number of documents per page

    // Get the total count of users matching the search query
    const totalRecords = await user.countDocuments(searchQuery);

    return res.send({
      status: "Ok",
      message: "User list fetched",
      data: userData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.statusUpdate = async (req, res) => {
  try {
    const { status, userId } = req.body;

    const parsed = new ObjectId(userId);
    const result = await user.updateOne(
      { _id: parsed },
      { $set: { status: status } }
    );
    if (result.modifiedCount) {
      const payload = { status: status, userId: userId };
      main.emitStatus(payload);
    }

    return res.send({
      status: "Ok",
      message: "User Status Updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    console.log(userId);

    if (!ObjectId.isValid(userId)) {
      return res.send({ status: "error", message: "Invalid User ID" });
    }

    const parsed = new ObjectId(userId);
    const result = await user.deleteOne({ _id: parsed });
    return res.send({
      status: "Ok",
      message: "User Deleted Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ status: "error", message: error.message });
  }
};

module.exports.forgotEmailLink = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user with the provided email exists
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({
        status: false,
        message: "Email address does not exist.",
      });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set the expiration time for the token (e.g., 1 hour)
    const expirationTime = Date.now() + 3600000; // 1 hour in milliseconds

    // Update the user with the reset token and expiration time
    existingUser.resetPasswordToken = resetToken;
    existingUser.resetPasswordExpires = expirationTime;
    await existingUser.save();

    // Create the reset link
    const resetLink = `${process.env.LINK_URL}/reset-password/${resetToken}?screen='${resetToken}'`; // Adjust the URL as needed
    console.log(resetLink);

    const mailResult = await sendEmail(
      UserEmailTemplates.ResetPasswordLink(email, resetLink)
    );

    if (mailResult) {
      return res.status(201).json({
        status: true,
        message: "Reset password link sent to your email.",
      });
    } else {
      return res.status(201).json({
        status: true,
        message: "Not Able to Send the Mail",
      });
    }

    // Send the email
    //await sendEmail(mailOptions);
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while sending the reset password email.",
    });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { password, token } = req.body; // New password from request body

    // Find the user by reset token
    const user_data = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user_data) {
      return res.status(400).json({
        status: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    // Update the user's password
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("password", hashedPassword);

    user_data.password = password; // Ensure you hash this password before saving
    user_data.resetPasswordToken = undefined; // Clear the reset token
    user_data.resetPasswordExpires = undefined; // Clear the expiration time
    await user_data.save();

    return res.status(200).json({
      status: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while resetting the password.",
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

module.exports.userDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;
    const parsed = new ObjectId(id);

    const userDetails = await user.findById(parsed);

    const skip = (page - 1) * pageSize;

    const userAppointments = await Appoinments.find({ userId: parsed })
      .populate({ path: "consultantId", select: "personalInfo" })
      .skip(skip)
      .limit(parseInt(pageSize))
      .sort({ date: -1 });

    const totalAppointments = await Appoinments.countDocuments({
      userId: parsed,
    });

    return res.send({
      status: true,
      message: "User Details Fetched Successfully",
      data: {
        user: userDetails,
        appointments: userAppointments,
      },
      pagination: {
        totalRecords: totalAppointments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalAppointments / pageSize),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while fetching user details.",
    });
  }
};

module.exports.contactUsForm = async (req, res) => {
  try {
    const payload = req.body;

    const newEquiry = new Enquiry(payload);
    const saveResponse = await newEquiry.save();
    console.log(saveResponse);

    const mailOptions = contactUsForm(
      "contactus@propheticpathway.com",
      req.body
    );
    const mailReponse = await sendEmail(mailOptions);
    if (mailReponse) {
      return res.send({
        status: true,
        message: "Your request has been submitted successfully.",
      });
    } else {
      return res.send({
        status: false,
        message: "Failed to send your message. Please try again later.",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      status: false,
      message:
        "An error occurred while processing your request. Please try again.",
    });
  }
};

module.exports.callDetailsHook = async (request, response) => {
  try {
    const { id } = request.params;

    const appointmentId = new ObjectId(id);

    const { CallSid, CallStatus, CallDuration } = request.body;
    console.log("callDetailsHook -- ", request.body);

    // Define update data based on CallStatus
    let updateData = {};
    if (CallStatus === "no-answer") {
      updateData = {
        status: "canceled",
        cancelReason: "Call not attended",
        CallSid: CallSid,
        callDuration: CallDuration || "0", // Assuming CallDuration is not provided for no-answer
      };
    } else if (CallStatus === "completed") {
      updateData = {
        status: "completed",
        CallSid: CallSid,
        callDuration: CallDuration,
      };
    }

    // Update the appointment in the database
    const updatedAppointment = await Appoinments.findOneAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    );
    console.log("updatedAppointment", updatedAppointment);
    return response.send({
      status: true,
      message: "Appointment Status updated",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.callRecordHook = async (req, res) => {
  try {
    const { id } = req.params;
    const { RecordingSid, RecordingUrl, RecordingStatus, CallSid, AccountSid } =
      req.body;

    const appointmentId = new ObjectId(id);

    const data = {
      appointmentId: appointmentId,
      RecordingSid: RecordingSid,
      RecordingUrl: RecordingUrl,
      RecordingStatus: RecordingStatus,
      CallSid: CallSid,
      AccountSid: AccountSid,
    };
    const newRecording = new CallRecoard(data);
    await newRecording.save();

    return res.send({
      status: true,
      message: "Recording fetched successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports.callFallbackHook = async (req, res) => {
  try {
    console.log("callFallbackHook -- ", req.body);
  } catch (error) {
    console.log(error);
  }
};

module.exports.addEarlyAccessUsers = async (req, res) => {
  try {
    const { fullName, phoneNumber, email } = req.body;
    if (!fullName || !phoneNumber || !email) {
      return res.status(400).send({ message: "All fields are required" });
    }

    const template = UserEmailTemplates.earlyAccess(
      "waitlist@propheticpathway.com",
      { fullName, phoneNumber, email }
    );

    const response = await sendEmail(template);

    if (response) {
      const earlyData = new EarlyAccess({ fullName, phoneNumber, email });
      const saveResponse = await earlyData.save();

      return res.status(201).send({
        status: true,
        message: "Saved Successfully",
        data: saveResponse,
      });
    } else {
      return res
        .status(400)
        .send({ status: false, message: "Failed to send email" });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports.earlyAccessList = async (req, res) => {
  try {
    const { page, limit, search = "" } = req.query;

    const searchFilter = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phoneNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    let earlyAccessList;
    let totalCount;

    if (!page || !limit) {
      earlyAccessList = await EarlyAccess.find(searchFilter).sort({
        createdAt: -1,
      });
      totalCount = earlyAccessList.length;
    } else {
      const pageNumber = Math.max(1, parseInt(page, 10));
      const pageSize = Math.max(1, parseInt(limit, 10));

      earlyAccessList = await EarlyAccess.find(searchFilter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize);

      totalCount = await EarlyAccess.countDocuments(searchFilter);
    }

    const totalPages = limit ? Math.ceil(totalCount / parseInt(limit, 10)) : 1;

    return res.status(200).send({
      status: true,
      message: "Early access list fetched",
      data: earlyAccessList,
      pagination: {
        total: totalCount,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error in earlyAccessList:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports.deleteEarlyAccess = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the document by ID
    const deletedEntry = await EarlyAccess.findByIdAndDelete(id);

    if (!deletedEntry) {
      return res
        .status(404)
        .send({ status: false, message: "Entry not found" });
    }

    return res.status(200).send({
      status: true,
      message: "Early access entry deleted successfully",
      data: deletedEntry,
    });
  } catch (error) {
    console.error("Error deleting early access entry:", error);
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

module.exports.AddSubscriber = async (req, res) => {
  try {
    const { email } = req.body;

    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res
        .status(202)
        .send({ status: false, message: "Subscriber already exists." });
    }

    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();

    return res
      .status(201)
      .send({ status: true, message: "Subscriber added successfully." });
  } catch (error) {
    console.error("Error in AddSubscriber:", error);
    return res
      .status(500)
      .send({ status: false, message: "Internal Server Error" });
  }
};
