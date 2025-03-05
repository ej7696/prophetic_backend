const mongoose = require("mongoose");
const twilio = require("twilio");
const { format } = require("date-fns");
const { utcToZonedTime } = require("date-fns-tz");
const crypto = require("crypto"); // For generating reset tokens
const { ObjectId } = mongoose.Types;
const nodeMailer = require("nodemailer");
require("dotenv").config();
// const mail = require('../Utils/sendMails')
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../../models/fronted/userModel");
const consultant = require("../../models/consultantModel");
const Review = require("../../models/fronted/ReviewModel");
const ContactUs = require("../../models/fronted/ContactModel");
const FavouriteConsultant = require("../../models/fronted/favouriteConsultantModel");
const Joi = require("joi");
const { updateUserProfileSchema } = require("../../validations/userValidation"); // Import validation schema
const UserEmailTemplates = require("../../Templates/UserEmailTemplates");
const Availablity = require("../../models/availablity");
const Appointment = require("../../models/appointmentModel");
const { DateTime } = require("luxon");

const accountSid = "ACe23edef458ecb357421451a66fbc70bd"; // Twilio Account SID
const authToken = "d193f85fb9a9acc68a0987c172ff8a88"; // Twilio Auth Token
const client = twilio(accountSid, authToken);
const twilioNumber = "+18774477915"; // Twilio Virtual Number

function generateOTP() {
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
}

async function getAverageRating(consultantId) {
  const averageRatings = await Review.aggregate([
    {
      $match: { consultantId }, // Match the specific consultant ID
    },
    {
      $group: {
        _id: "$consultantId",
        averageRating: { $avg: "$rating" }, // Calculate average rating
      },
    },
  ]);

  // If no ratings found, return 0
  if (!averageRatings.length) {
    return 0;
  }

  return averageRatings[0].averageRating; // Return the average rating
}

// Function to get the UTC offset for a specific time zone
function getTimezoneOffset(timeZone) {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  });
  const parts = formatter.formatToParts(date);
  const offset = parts.find((part) => part.type === "timeZoneName").value;
  return offset;
}

module.exports.consultantList = async (req, res) => {
  try {
    // Get the token from the request header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token format
    let favouriteConsultantIds = new Set(); // Initialize as an empty set
    let userId = null;

    let decoded;

    if (token) {
      try {
        const secret = process.env.ADMIN_SECRET;
        const decoded = jwt.verify(token, secret); // Verify token with the secret key
        userId = decoded.userId;
        // Fetch the user's favorite consultants if the token is valid
        const userFavourites = await FavouriteConsultant.find({
          userId,
        }).select("consultantId");

        // Create a set of favorite consultant IDs for easy lookup
        favouriteConsultantIds = new Set(
          userFavourites.map((fav) => fav.consultantId.toString())
        );
      } catch (error) {
        return res.status(202).json({
          status: false,
          message: "Invalid token. Please login again.",
        });
      }
    }

    const { sortBy, specialty, name, rating, page = 1, limit = 10 } = req.query;

    // Define query for filtering consultants
    let query = { status: "Active" };
    // Filter by Name
    if (name) {
      //query["personalInfo.fullname"] = { $in: [name] };
      query["personalInfo.fullname"] = { $regex: new RegExp(name, "i") }; // "i" for case-insensitive
    }
    // Filter by Name
    if (
      sortBy &&
      (sortBy == "Available" || sortBy == "Busy" || sortBy == "Away")
    ) {
      query["workingStatus"] = { $in: [sortBy] };
    }
    if (specialty) {
      const specialtiesArray = specialty.split(","); // Convert comma-separated specialties to array
      query["profileForm.specialities"] = { $in: specialtiesArray }; // Match consultants with any of the specialties
    }

    // console.log(query);
    // Fetch the consultants with selected fields
    // let consultantList = consultant
    //   .find(query)
    //   .select("personalInfo profileForm");

    const pipelineArray = [
      { $match: query },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "consultantId",
          as: "ratings",
        },
      },

      {
        $project: {
          _id: 1,
          fullname: "$personalInfo.fullname",
          phoneNumber: "$personalInfo.phoneNumber",
          profilePhoto: "$profileForm.profilePhoto",
          averageRating: { $avg: { $ifNull: ["$ratings.rating", 0] } },
        },
      },
    ];

    let ratingFilter = "";
    if (rating > 0) {
      pipelineArray.push({
        $match: {
          averageRating: { $gte: parseFloat(rating) || 0 }, // Filter consultants by rating if specified
        },
      });
    }

    let consultantList = consultant.aggregate(pipelineArray);
    // console.log("consultantList", consultantList);

    // Apply sorting based on the sortBy parameter
    if (sortBy) {
      switch (sortBy) {
        case "Available":
          // consultantList = consultantList.sort({ "profileForm.isAvailable": -1 });  // Available first
          break;
        case "Busy":
          // consultantList = consultantList.sort({ "profileForm.isAvailable": 1 });   // Busy first
          break;
        case "New":
          consultantList = consultantList.sort({ createdAt: -1 }); // Newest first
          break;
        case "StarRating":
          consultantList = consultantList.sort({ averageRating: -1 }); // Highest rated first
          break;
        case "Alphabetical":
          consultantList = consultantList.sort({ fullname: 1 }); // Alphabetical order
          console.log("in the block");
          break;
        default:
          consultantList = consultantList.sort({ fullname: 1 }); // Default to alphabetical
          break;
      }
    }

    // Apply pagination (convert page and limit to numbers)
    const skip = (page - 1) * limit;
    consultantList = consultantList.skip(skip).limit(parseInt(limit));

    // Execute the query
    const consultants = await consultantList;
    // console.log(consultants);

    // Map the consultant data to include only the required fields
    // Use Promise.all to fetch average ratings concurrently for each consultant
    const consultantInfoArray = await Promise.all(
      consultants.map(async (item) => {
        const averageRating = await getAverageRating(item._id); // Get average rating for each consultant

        return {
          _id: item._id,
          fullname: item.fullname,
          phoneNumber: item.phoneNumber,
          profilePhoto: item.profilePhoto,
          rating: averageRating || 0,
          isFavourite: favouriteConsultantIds.has(item._id.toString()) ? 1 : 0, // Check if the consultant is a favorite
        };
      })
    );

    // If no consultants found, return a 404 error
    if (!consultantInfoArray.length) {
      return res.json({
        status: false,
        message: "Consultants are not available",
      });
    }

    // Get total number of documents for pagination
    const totalConsultantsPipeline = [...pipelineArray]; // Clone the pipeline
    totalConsultantsPipeline.push({ $count: "count" }); // Add count stage

    // Execute the total count query
    const totalConsultantsResult = await consultant.aggregate(
      totalConsultantsPipeline
    );
    const totalConsultants = totalConsultantsResult[0]?.count || 0;

    const specialtyList = [
      "Deliverance",
      "Healing",
      "Interpretation of Dreams",
      "Interpretation of Visions",
      "Interpretation of Tongues",
      "Counseling",
      "Prayer and Intercession",
      "Spiritual Gift Activation & Mentorship",
    ];

    // Respond with the filtered and sorted list of consultants
    return res.status(200).json({
      status: true,
      message: "Consultants List",
      specialty: specialtyList,
      data: consultantInfoArray,
      pagination: {
        totalConsultants, // Total number of consultants available
        currentPage: parseInt(page), // Current page number
        totalPages: Math.ceil(totalConsultants / limit), // Total pages
      },
    });
  } catch (error) {
    console.error("Error retrieving consultants:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while retrieving consultants.",
    });
  }
};

module.exports.getConsultantDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { timezone } = req.query;

    // Validate the _id format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(202).json({
        status: false,
        message: "Invalid Consultant ID",
      });
    }

    // Get the token from the request header
    const token = req.headers.authorization?.split(" ")[1]; // Bearer token format
    let favouriteConsultantIds = new Set(); // Initialize as an empty set
    let userId = null;

    let decoded;

    if (token) {
      try {
        const secret = process.env.ADMIN_SECRET;
        const decoded = jwt.verify(token, secret); // Verify token with the secret key
        userId = decoded.userId;
        // Fetch the user's favorite consultants if the token is valid
        const userFavourites = await FavouriteConsultant.find({
          userId,
        }).select("consultantId");

        // Create a set of favorite consultant IDs for easy lookup
        favouriteConsultantIds = new Set(
          userFavourites.map((fav) => fav.consultantId.toString())
        );
      } catch (error) {
        return res.status(202).json({
          status: false,
          message: "Invalid token. Please login again.",
        });
      }
    }

    // Fetch the consultant details by _id
    const consultantDetails = await consultant
      .findById(id)
      .select(
        "personalInfo profileForm professionalInfo workingStatus availablity"
      );

    // If consultant is not found, return a 404 response
    if (!consultantDetails) {
      return res.status(202).json({
        status: false,
        message: "Consultant not found",
      });
    }

    // Fetch consultant's availability
    const consultantAvailability = await Availablity.findOne({
      consultantId: consultantDetails._id,
    }).select("availablity");

    // If no availability is found, return an empty array
    // const availabilityData = consultantAvailability
    //   ? consultantAvailability.availablity
    //   : [];

    const timeZones = [
      {
        name: "Hawaii-Aleutian Time Zone",
        timezone: "America/Adak",
        key: "HST",
        offset: getTimezoneOffset("Pacific/Honolulu"),
      },
      {
        name: "Alaska Time Zone",
        timezone: "America/Anchorage",
        key: "AKST",
        offset: getTimezoneOffset("America/Anchorage"),
      },
      {
        name: "Pacific Time Zone (PT)",
        timezone: "America/Los_Angeles",
        key: "PST",
        offset: getTimezoneOffset("America/Los_Angeles"),
      },
      {
        name: "Mountain Time Zone (MT)",
        timezone: "America/Denver",
        key: "MST",
        offset: getTimezoneOffset("America/Denver"),
      },
      {
        name: "Central Standard Time (CST)",
        timezone: "America/Chicago",
        key: "CST",
        offset: getTimezoneOffset("America/Chicago"),
      },
      {
        name: "Eastern Time Zone (ET)",
        timezone: "America/New_York",
        key: "EST",
        offset: getTimezoneOffset("America/New_York"),
      },
      {
        name: "West Africa Time Zone (WAT)",
        timezone: "Africa/Lagos",
        key: "WAT",
        offset: getTimezoneOffset("Africa/Lagos"),
      }, // Added WAT
      {
        name: "Indian Standard Time (IST)",
        timezone: "Asia/Kolkata",
        key: "IST",
        offset: getTimezoneOffset("Asia/Kolkata"),
      },
    ];

    let availabilityData = [];

    if (consultantAvailability) {
      if (timezone) {
        availabilityData = consultantAvailability.availablity.filter(
          (avail) => {
            const defaultTimezone = avail.timezone;
            const timeSlots = avail.timeSlots.map((slot) => {
              console.log("slot", slot);
              const startTime = DateTime.fromFormat(
                `${avail.date} ${slot.startTime}`,
                "yyyy-MM-dd HH:mm",
                { zone: defaultTimezone }
              )
                .setZone(timezone)
                .toFormat("yyyy-MM-dd HH:mm");
              const endTime = DateTime.fromFormat(
                `${avail.date} ${slot.endTime}`,
                "yyyy-MM-dd HH:mm",
                {
                  zone: defaultTimezone,
                }
              )
                .setZone(timezone)
                .toFormat("yyyy-MM-dd HH:mm");

              slot = {
                startTime: startTime.split(" ")[1],
                endTime: endTime.split(" ")[1],
              };
              avail.date = startTime.split(" ")[0];
              return slot;
            });
            avail.timeSlots = timeSlots;

            if (
              `${avail.date}` >=
              DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd")
            ) {
              return avail;
            }
          }
        );
      } else {
        availabilityData = consultantAvailability.availablity.filter(
          (avail) => {
            if (
              `${avail.date}` >=
              DateTime.now()
                .setZone(timeZones[0].timezone)
                .toFormat("yyyy-MM-dd")
            ) {
              return avail;
            }
          }
        );
      }
    }

    // Fetch reviews for the consultant, populated with the user's name
    const reviewsList = await Review.find({
      consultantId: consultantDetails._id,
    })
      .populate("userId", "firstName lastName") // Populate with user's name
      .sort({ rating: -1 })
      .limit(5);

    // Transform the reviews list to the desired structure
    const formattedReviews = reviewsList?.map((review) => {
      // Format the review date to 'MM-DD-YYYY'
      const formattedDate = format(new Date(review.date), "MM-dd-yyyy");

      return {
        _id: review._id,
        consultantId: review.consultantId,
        userId: review.userId._id,
        firstName: review?.userId?.firstName || "",
        lastName: review?.userId?.lastName || "",
        rating: review?.rating || "",
        review: review.review,
        date: formattedDate,
      };
    });

    const timeDuration = [{ time: 15, key: "minute" }];

    const averageRating = await getAverageRating(consultantDetails._id);

    const consultantData = {
      _id: consultantDetails._id,
      fullname: consultantDetails?.personalInfo?.fullname || "",
      phoneNumber: consultantDetails?.personalInfo?.phoneNumber,
      email: consultantDetails?.personalInfo?.email,
      rating: averageRating || 0,
      experience: consultantDetails?.profileForm?.yearsOfExperience || "",
      profilePhoto: consultantDetails?.profileForm?.profilePhoto,
      briefBio: consultantDetails?.profileForm?.briefBio || "",
      specialities: consultantDetails?.profileForm?.specialities || "",
      voiceNote: consultantDetails?.profileForm?.voiceNote || 0,
      isFavourite: favouriteConsultantIds.has(consultantDetails._id.toString())
        ? 1
        : 0,
      workingStatus: consultantDetails?.workingStatus || "",
      reviews: formattedReviews,
      availability: availabilityData,
      timeDuration: timeDuration,
      timeZones: timeZones,
    };

    const similarConsultants = await consultant
      .find({
        _id: { $ne: consultantDetails._id },
        "profileForm.specialities": {
          $in: consultantDetails?.profileForm?.specialities || [],
        },
      })
      .select("personalInfo profileForm workingStatus ")
      .limit(5);

    const similarConsultantsData = [];

    for (let i = 0; i < similarConsultants.length; i++) {
      const consultant = similarConsultants[i];
      const consultantData = {
        _id: consultant._id,
        fullname: consultant?.personalInfo?.fullname || "",
        profilePhoto: consultant?.profileForm?.profilePhoto,
        rating: await getAverageRating(consultant._id),
        workingStatus: consultant?.workingStatus || "",
        isFavourite: await FavouriteConsultant.find({
          userId: userId,
          consultantId: consultant._id,
        }),
      };
      similarConsultantsData.push(consultantData);
    }

    // Respond with the consultant details
    return res.status(200).json({
      status: true,
      message: "Consultant Details",
      data: consultantData,
      similarConsultants: similarConsultantsData,
    });
  } catch (error) {
    console.error("Error fetching consultant details:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while fetching consultant details.",
    });
  }
};

module.exports.getAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { timezone } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(202).json({
        status: false,
        message: "Invalid Consultant ID",
      });
    }

    const consultantDetails = await consultant
      .findById(id)
      .select("availablity");

    if (!consultantDetails) {
      return res.status(202).json({
        status: false,
        message: "Consultant not found",
      });
    }

    const consultantAvailability = await Availablity.findOne({
      consultantId: consultantDetails._id,
    }).select("availablity");

    let availabilityData = [];

    if (consultantAvailability) {
      if (timezone) {
        availabilityData = consultantAvailability.availablity.filter(
          (avail) => {
            const defaultTimezone = avail.timezone;
            const timeSlots = avail.timeSlots.map((slot) => {
              const startTime = DateTime.fromFormat(
                `${avail.date} ${slot.startTime}`,
                "yyyy-MM-dd HH:mm",
                { zone: defaultTimezone }
              )
                .setZone(timezone)
                .toFormat("yyyy-MM-dd HH:mm");
              const endTime = DateTime.fromFormat(
                `${avail.date} ${slot.endTime}`,
                "yyyy-MM-dd HH:mm",
                {
                  zone: defaultTimezone,
                }
              )
                .setZone(timezone)
                .toFormat("yyyy-MM-dd HH:mm");
              slot = {
                startTime: startTime.split(" ")[1],
                endTime: endTime.split(" ")[1],
              };
              avail.date = startTime.split(" ")[0];
              return slot;
            });
            avail.timeSlots = timeSlots;

            if (
              `${avail.date}` >=
              DateTime.now().setZone(timezone).toFormat("yyyy-MM-dd")
            ) {
              return avail;
            }
          }
        );
      } else {
        availabilityData = consultantAvailability.availablity;
      }
    }

    const timeZones = [
      {
        name: "Indian Standard Time (IST)",
        timezone: "Asia/Kolkata",
        key: "IST",
        offset: getTimezoneOffset("Asia/Kolkata"),
      },

      {
        name: "Hawaii-Aleutian Time Zone",
        timezone: "America/Adak",
        key: "HST",
        offset: getTimezoneOffset("Pacific/Honolulu"),
      },
      {
        name: "Alaska Time Zone",
        timezone: "America/Anchorage",
        key: "AKST",
        offset: getTimezoneOffset("America/Anchorage"),
      },
      {
        name: "Pacific Time Zone (PT)",
        timezone: "America/Los_Angeles",
        key: "PST",
        offset: getTimezoneOffset("America/Los_Angeles"),
      },
      {
        name: "Mountain Time Zone (MT)",
        timezone: "America/Denver",
        key: "MST",
        offset: getTimezoneOffset("America/Denver"),
      },
      {
        name: "Central Standard Time (CST)",
        timezone: "America/Chicago",
        key: "CST",
        offset: getTimezoneOffset("America/Chicago"),
      },
      {
        name: "Eastern Time Zone (ET)",
        timezone: "America/New_York",
        key: "EST",
        offset: getTimezoneOffset("America/New_York"),
      },
      {
        name: "West Africa Time Zone (WAT)",
        timezone: "Africa/Lagos",
        key: "WAT",
        offset: getTimezoneOffset("Africa/Lagos"),
      }, // Added WAT
    ];
    const timeDuration = [{ time: 15, key: "minute" }];

    // Respond with the consultant details
    return res.status(200).json({
      status: true,
      message: "Availability Details",
      timeDuration: timeDuration,
      timeZone: timeZones,
      data: availabilityData,
    });
  } catch (error) {
    console.error("Error fetching consultant details:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while fetching consultant details.",
    });
  }
};

module.exports.addFavouriteConsultant = async (req, res) => {
  try {
    const { consultantId } = req.body;
    const { userId } = req.user;

    console.log("userId", userId);

    // Validation: check if userId and consultantId are provided
    if (!userId || !consultantId) {
      return res.status(202).json({
        status: false,
        message: "User ID and Consultant ID are required.",
      });
    }

    // Check if User and Consultant exist
    const userExists = await User.findById(userId);
    const consultantExists = await consultant.findById(consultantId);

    if (!userExists) {
      return res.status(202).json({
        status: false,
        message: "User not found.",
      });
    }

    if (!consultantExists) {
      return res.status(202).json({
        status: false,
        message: "Consultant not found.",
      });
    }

    // Check if this favourite already exists
    const favouriteExists = await FavouriteConsultant.findOne({
      userId,
      consultantId,
    });

    if (favouriteExists) {
      // If it exists, remove the consultant from favourites
      await FavouriteConsultant.findByIdAndDelete(favouriteExists._id);
      return res.status(200).json({
        status: true,
        message: "Consultant has been removed from your favourites.",
      });
    } else {
      // If it doesn't exist, add the consultant to favourites
      const newFavourite = new FavouriteConsultant({ userId, consultantId });
      await newFavourite.save();

      return res.status(201).json({
        status: true,
        message: "Consultant has been added to your favourites.",
        data: newFavourite,
      });
    }
  } catch (error) {
    console.error("Error adding favourite consultant:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while adding favourite consultant.",
    });
  }
};

module.exports.getFavouriteConsultants = async (req, res) => {
  try {
    const { userId } = req.user;

    // Validation: check if userId is provided
    if (!userId) {
      return res.status(202).json({
        status: false,
        message: "User ID is required.",
      });
    }

    // Check if User exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(202).json({
        status: false,
        message: "User not found.",
      });
    }

    // Retrieve favourite consultants for the user
    const favourites = await FavouriteConsultant.find({ userId }).populate({
      path: "consultantId",
      model: consultant, // Explicitly define the model here if needed
    });

    // Map the consultant data to include only the required fields
    // Use Promise.all to fetch average ratings concurrently for each consultant
    const favouritesArray = await Promise.all(
      favourites.map(async (fav) => {
        const averageRating = await getAverageRating(fav.consultantId._id);

        return {
          consultantId: fav.consultantId._id,
          fullname: fav.consultantId.personalInfo.fullname,
          phoneNumber: fav.consultantId.personalInfo.phoneNumber,
          profilePhoto: fav.consultantId.profileForm.profilePhoto,
          rating: averageRating || 0,
          workingStatus: fav.consultantId.workingStatus || "",
        };
      })
    );

    return res.status(200).json({
      status: true,
      message: "Favourite consultants retrieved successfully.",
      data: favouritesArray,
    });
  } catch (error) {
    console.error("Error retrieving favourite consultants:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while retrieving favourite consultants.",
    });
  }
};

module.exports.bookAppointment = async (req, res) => {
  try {
    // Get the token from the request header
    const { userId } = req.user;

    // Validate token
    if (!userId) {
      return res.status(202).json({
        status: false,
        message: "User not found.",
      });
    }

    const {
      consultantId,
      appointmentDate,
      startTime,
      endTime,
      timeZone,
      duration,
      userEmail,
      reminder,
    } = req.body;

    // Validation checks
    if (
      !consultantId ||
      !appointmentDate ||
      !startTime ||
      !endTime ||
      !timeZone ||
      !duration ||
      !userEmail
    ) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const appointmentDateTime = DateTime.fromISO(
      `${appointmentDate}T${startTime}`,
      {
        zone: timeZone,
      }
    );

    const currentDateTime = DateTime.now().setZone(timeZone);

    if (appointmentDateTime <= currentDateTime) {
      return res.send({
        status: false,
        message: `Can't schedule appointments in the past time ${appointmentDateTime.toFormat(
          "yyyy-MM-dd HH:mm"
        )} in ${timeZone}`,
      });
    }
    // Check if an overlapping appointment exists for the same user and consultant
    const existingAppointment = await Appointment.findOne({
      consultantId,
      appointmentDate,
      timeZone,
      status: "upcoming",
      "timeSlot.startTime": { $lt: endTime },
      "timeSlot.endTime": { $gt: startTime },
    });

    if (existingAppointment) {
      return res.status(202).json({
        status: false,
        message: "The selected time slot allready booked.",
      });
    }

    // Create a new appointment
    const newAppointment = new Appointment({
      consultantId,
      userId,
      appointmentDate,
      timeSlot: {
        startTime: startTime,
        endTime: endTime,
      },
      timeZone,
      duration,
      userEmail,
      reminder,
    });

    // Save the appointment
    const saveAppointment = await newAppointment.save();
    const lastInsertedId = saveAppointment._id;

    //const userDetail = await User.findOne({ _id: userId });

    const userDetail = await Appointment.findOne({ _id: lastInsertedId })
      .populate({
        path: "consultantId",
        select: "personalInfo",
      })
      .populate({
        path: "userId",
        select: "firstName lastName",
      })
      .exec();

    const UserFullname =
      userDetail?.userId?.firstName + " " + userDetail?.userId?.lastName ||
      "Unknown";

    //Send book appoiment email to user
    const mailResult = await sendEmail(
      UserEmailTemplates.GetUserConfirmationAppointmentEmail(
        UserFullname,
        userEmail,
        appointmentDate,
        startTime,
        endTime,
        duration
      )
    );

    const consulatantName =
      userDetail?.consultantId?.personalInfo?.fullname || "";
    const consulatantEmail =
      userDetail?.consultantId?.personalInfo?.email || "";
    console.log("userDetail", userDetail);
    //Send book appoiment email to consulatant
    const mailResult2 = await sendEmail(
      UserEmailTemplates.GetConsultantConfirmationAppointmentEmail(
        UserFullname,
        consulatantName,
        consulatantEmail,
        appointmentDate,
        startTime,
        endTime,
        duration
      )
    );

    return res.status(200).json({
      status: true,
      message: "Appointment booked successfully.",
      data: newAppointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while booking the appointment.",
    });
  }
};

module.exports.getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.user;
    const { status } = req.query; // Get status filter from query parameters

    // Validation: Check if userId exists
    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "User ID is required.",
      });
    }

    const query = { userId }; // Filter by userId

    // Add status filter to the query if provided
    if (status) {
      // Validate that the status is one of the allowed values
      const allowedStatuses = ["upcoming", "completed", "canceled"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          status: false,
          message: `Invalid status. Allowed values are: ${allowedStatuses.join(
            ", "
          )}.`,
        });
      }
      query.status = status; // Filter by status
    }

    // Find appointments for the user with the provided filter and populate consultant details
    const appointments = await Appointment.find(query)
      .populate({
        path: "consultantId",
        select: "personalInfo profileForm",
      })
      .sort({ updatedAt: -1 })
      .exec();

    // If no appointments are found
    if (!appointments.length) {
      return res.status(202).json({
        status: false,
        message: "No appointments found for the user.",
      });
    }

    const appointmentDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const {
          consultantId,
          appointmentDate,
          timeSlot,
          timeZone,
          duration,
          canceledBy,
        } = appointment;

        const existingReview = await Review.findOne({
          userId,
          consultantId: consultantId._id,
          appointmentId: appointment._id,
        });
        const hasReview = !!existingReview; // Convert to boolean (true if review exists, false otherwise)

        const formattedDate = format(new Date(appointmentDate), "EEEE, MMMM d");

        // Dynamically construct the detail message with time slot and timezone
        let detail = "";
        if (appointment.status == "upcoming") {
          detail = `Your appointment with ${consultantId.personalInfo.fullname} is scheduled to start on ${formattedDate} at ${timeSlot.startTime} ${timeZone} for ${duration} minutes`;
        }
        if (appointment.status == "completed") {
          detail = `Your appointment with ${consultantId.personalInfo.fullname} was held on ${formattedDate} at ${timeSlot.startTime} ${timeZone}. `;
        }
        if (appointment.status == "canceled") {
          detail = `Your appointment with ${
            consultantId.personalInfo.fullname
          } scheduled for ${formattedDate} at ${
            timeSlot.startTime
          } ${timeZone} have been canceled by ${
            canceledBy === "c" ? consultantId?.personalInfo?.fullname : "you"
          }.`;
        }

        return {
          appointmentId: appointment._id,
          consultant: {
            _id: consultantId._id,
            fullname: consultantId.personalInfo.fullname,
            profilePhoto: consultantId.profileForm.profilePhoto,
            specialities: consultantId.profileForm.specialities,
          },
          detail,
          appointmentDate,
          timeSlot,
          timeZone,
          duration,
          status: appointment.status,
          cancelReason: appointment.cancelReason || "",
          hasReview,
        };
      })
    );

    // Return the filtered data
    return res.status(200).json({
      status: true,
      message: "Appointments retrieved successfully.",
      data: appointmentDetails,
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
  try {
    const { userId } = req.user; // Extract userId from the token
    const { appointmentId, cancelReason } = req.body; // Get appointmentId and cancelReason from request body

    // Validation: Check if appointmentId and cancelReason are provided
    if (!appointmentId || !cancelReason) {
      return res.status(400).json({
        status: false,
        message: "Appointment ID and cancellation reason are required.",
      });
    }

    // Find the appointment and ensure it belongs to the user
    //const appointment = await Appointment.findOne({ _id: appointmentId, userId });

    const appointment = await Appointment.findOne({ _id: appointmentId })
      .populate({
        path: "consultantId",
        select: "personalInfo",
      })
      .populate({
        path: "userId",
        select: "firstName lastName email",
      })
      .exec();

    if (!appointment) {
      return res.status(202).json({
        status: false,
        message: "Appointment not found or does not belong to the user.",
      });
    }

    // Update the appointment status to 'canceled' and set the cancelReason
    appointment.status = "canceled";
    appointment.cancelReason = cancelReason;

    await appointment.save(); // Save the changes to the database

    const conFullname =
      appointment?.consultantId?.personalInfo?.fullname || "Unknown";
    const email = appointment?.consultantId?.personalInfo?.email || "Unknown";
    const startTime = appointment?.timeSlot?.startTime || "Not provided";
    const endTime = appointment?.timeSlot?.endTime || "Not provided";
    const appointmentDate = appointment?.appointmentDate || "Not provided";
    const UserFullname =
      appointment?.userId?.firstName + " " + appointment?.userId?.lastName ||
      "Unknown";
    const UserEmail =
      appointment?.userId?.email + " " + appointment?.userId?.email ||
      "Unknown";

    //Email to Consultant
    const mailResult = await sendEmail(
      UserEmailTemplates.AppointmentCancellationToConsultant(
        conFullname,
        UserFullname,
        email,
        appointmentDate,
        startTime,
        endTime
      )
    );

    //Email to User
    const mailResult2 = await sendEmail(
      UserEmailTemplates.AppointmentCancellationToUser(
        UserFullname,
        UserEmail,
        appointmentDate,
        startTime,
        endTime
      )
    );

    return res.status(200).json({
      status: true,
      message: "Appointment canceled successfully.",
      data: {
        appointmentId: appointment._id,
        status: appointment.status,
        cancelReason: appointment.cancelReason,
      },
    });
  } catch (error) {
    console.error("Error canceling appointment:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while canceling the appointment.",
    });
  }
};

module.exports.addReview = async (req, res) => {
  try {
    const { userId } = req.user; // Extract userId from token (assumed that token is verified)
    const { consultantId, rating, review, appointmentId } = req.body; // Get consultantId, rating, and review from request body

    // Validation: Ensure all required fields are provided
    if (!consultantId || !rating || !review) {
      return res.status(202).json({
        status: false,
        message: "Consultant ID, rating, and review are required.",
      });
    }

    // Ensure the consultant exists
    const consultantExists = await consultant.findById(consultantId);
    if (!consultantExists) {
      return res.status(202).json({
        status: false,
        message: "Consultant not found.",
      });
    }

    // Check if the user has already left a review for this consultant (optional: to avoid duplicate reviews)
    const existingReview = await Review.findOne({
      userId,
      consultantId,
      appointmentId,
    });
    if (existingReview) {
      return res.status(202).json({
        status: false,
        message: "You have already reviewed this consultant.",
      });
    }

    // Create a new review
    const newReview = new Review({
      userId,
      consultantId,
      rating,
      review,
      appointmentId,
    });

    // Save the review in the database
    await newReview.save();

    return res.status(200).json({
      status: true,
      message: "Review submitted successfully.",
      data: {
        consultantId: newReview.consultantId,
        userId: newReview.userId,
        userId: newReview.userId,
        appointmentId: newReview.appointmentId,
        review: newReview.review,
        date: newReview.date,
      },
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while submitting the review.",
    });
  }
};

module.exports.contactUs = async (req, res) => {
  try {
    // Extract data from the request body
    const { firstName, lastName, email, subject, description } = req.body;

    // Validation to ensure all fields are provided
    if (!firstName || !lastName || !email || !subject) {
      return res.status(202).json({
        status: false,
        message: "All fields are required.",
      });
    }

    // Create a new contact document
    const newContact = new ContactUs({
      firstName,
      lastName,
      email,
      subject,
      description,
    });

    // Save the contact form details in the database
    await newContact.save();

    // Return a success response
    return res.status(200).json({
      status: true,
      message: "Contact form submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while submitting the contact form.",
    });
  }
};

module.exports.getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.user; // Get user ID from the verified token

    // Validation: Check if appointmentId and userId exist
    if (!appointmentId || !userId) {
      return res.status(202).json({
        status: false,
        message: "Appointment ID and User ID are required.",
      });
    }

    // Find the appointment by appointmentId and userId (ensures the user owns the appointment)

    const appointment = await Appointment.findOne({ _id: appointmentId })
      .populate({
        path: "consultantId",
        select: "personalInfo",
      })
      .exec();

    //const appointment = await Appointment.find({ _id : appointmentId });

    console.log(appointment);
    let formattedDate = "";
    if (appointment.appointmentDate) {
      formattedDate = format(
        new Date(appointment.appointmentDate),
        "EEEE, MMMM d"
      );
    }

    // Dynamically construct the detail message with time slot and timezone
    const detail = `Your appointment with ${appointment.consultantId.personalInfo.fullname} is scheduled to start on ${formattedDate}, ${appointment.timeSlot.startTime} ${appointment.timeZone} for ${appointment.duration} minutes`;

    // Construct the appointment details response
    const appointmentDetails = {
      appointmentId: appointment._id,
      consultant: {
        _id: appointment.consultantId._id,
        fullname: appointment.consultantId.personalInfo.fullname,
      },
      detail,
      appointmentDate: appointment.appointmentDate,
      startTime: appointment.timeSlot.startTime,
      endTime: appointment.timeSlot.endTime,
      timeZone: appointment.timeZone,
      duration: appointment.duration,
      email: appointment.userEmail || "",
      status: appointment.status,
      cancelReason: appointment.cancelReason || "",
    };

    // Return the appointment details
    return res.status(200).json({
      status: true,
      message: "Appointment details retrieved successfully.",
      data: appointmentDetails,
    });
  } catch (error) {
    console.error("Error retrieving appointment details:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while retrieving appointment details.",
    });
  }
};

module.exports.scheduleCall = async (req, res) => {
  try {
    // Extract data from the request body
    const { firstName, lastName, email, subject, description } = req.body;

    const customerNumber = "+919783864873";

    const appointmentTime = "2024-10-16T14:30";
    const now = new Date();
    const callTime = new Date(appointmentTime - 2 * 60 * 1000); // 2 minutes before appointment
    const consultantNumber = "+918003205932";

    if (now > callTime) {
      console.error("Appointment is in the past or less than 2 minutes away.");
      return;
    }

    // Delay the call until 2 minutes before the appointment

    // Delay the call until 2 minutes before the appointment
    setTimeout(() => {
      client.calls
        .create({
          twiml:
            "<Response><Say>Please wait while we connect your call.</Say><Dial><Number>" +
            consultantNumber +
            "</Number></Dial></Response>",
          to: customerNumber, // Customer's phone number
          from: twilioNumber, // Twilio virtual number
        })
        .then((call) => console.log(`Call SID: ${call.sid}`))
        .catch((err) => console.error(`Error scheduling call: ${err}`));
    }, callTime - now);

    // Return a success response
    return res.status(200).json({
      status: true,
      message: "Contact form submitted successfully.",
    });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(400).json({
      status: false,
      message: "An error occurred while submitting the contact form.",
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

module.exports.getTopConsultant = async (req, res) => {
  try {
    const { userId, limit } = req.body;
    const parsed = new ObjectId(userId);
    const topConsultants = await Appointment.aggregate([
      {
        $group: {
          _id: "$consultantId",
          numberOfAppointments: { $sum: 1 },
        },
      },
      {
        $addFields: {
          consultantId: { $toObjectId: "$_id" },
        },
      },
      {
        $lookup: {
          from: "consultants",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultantDetails",
        },
      },
      {
        $unwind: "$consultantDetails",
      },
      {
        $lookup: {
          from: "reviews",
          localField: "consultantId",
          foreignField: "consultantId",
          as: "consultantReviews",
        },
      },
      {
        $lookup: {
          from: "favouriteconsultants",
          let: { consultantId: "$consultantId", userId: parsed },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$consultantId", "$$consultantId"] },
                    { $eq: ["$userId", "$$userId"] },
                  ],
                },
              },
            },
          ],
          as: "favoriteConsultant",
        },
      },
      {
        $project: {
          _id: 0,
          numberOfAppointments: 1,
          consultantId: 1,
          name: "$consultantDetails.personalInfo.fullname",
          profilePhoto: "$consultantDetails.profileForm.profilePhoto",
          specialities: "$consultantDetails.profileForm.specialities",
          rating: { $ifNull: [{ $avg: "$consultantReviews.rating" }, 0] },
          favorite: "$favoriteConsultant",
        },
      },
      {
        $sort: {
          numberOfAppointments: -1,
        },
      },
      {
        $limit: +limit,
      },
    ]);

    return res.send({
      status: true,
      message: "Top consultants fetched successfully",
      data: topConsultants,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred while fetching top consultants.",
    });
  }
};

module.exports.getAllReviews = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send({
        status: false,
        message: "Invalid consultant ID provided",
      });
    }

    const { page = 1, pageSize = 10 } = req.query;
    const skip = (page - 1) * pageSize;
    const consultId = new ObjectId(id);

    const reviews = await Review.find({ consultantId: consultId })
      .populate({ path: "userId", select: "firstName lastName" })
      .skip(skip)
      .limit(pageSize)
      .sort({ date: -1 });
    const reviewCount = await Review.countDocuments({
      consultantId: consultId,
    });

    return res.send({
      status: true,
      message: "Reviews fetched",
      data: reviews,
      totalReviews: reviewCount,
      pagination: {
        totalRecords: reviewCount,
        currentPage: page,
        totalPages: Math.ceil(reviewCount / pageSize),
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send({
      status: false,
      message: "An error occurred while fetching data",
    });
  }
};
