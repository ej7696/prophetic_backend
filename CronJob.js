const cron = require("node-cron");
const twilio = require("twilio");
const { DateTime } = require("luxon");
const Appointment = require("./models/appointmentModel");
require("dotenv").config();
const template = require("./Templates/UserEmailTemplates");
const nodemailer = require("nodemailer");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const twilioNumber = process.env.TWILIO_NUMBER;

const scheduleACall = async () => {
  try {
    const now = DateTime.utc().toISO();
    const twentyFourHoursLater = DateTime.utc().plus({ hours: 1 }).toISO();
    const appointments = await Appointment.aggregate([
      {
        $match: {
          status: "upcoming",
          isScheduled: "n",
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          "$appointmentDate",
                          " ",
                          "$timeSlot.startTime",
                        ],
                      },
                      timezone: "$timeZone",
                    },
                  },
                  new Date(now),
                ],
              },
              {
                $lte: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          "$appointmentDate",
                          " ",
                          "$timeSlot.startTime",
                        ],
                      },
                      timezone: "$timeZone",
                    },
                  },
                  new Date(twentyFourHoursLater),
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "consultants",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant",
        },
      },
      {
        $project: {
          appointmentDate: 1,
          duration: 1,
          timeZone: 1,
          "timeSlot.startTime": 1,
          "timeSlot.endTime": 1,
          userNumber: { $arrayElemAt: ["$user.phoneNumber", 0] },
          consultantNumber: {
            $arrayElemAt: ["$consultant.personalInfo.phoneNumber", 0],
          },
          userFirstName: { $arrayElemAt: ["$user.firstName", 0] },
          userLastName: { $arrayElemAt: ["$user.lastName", 0] },
          consultantName: {
            $arrayElemAt: ["$consultant.personalInfo.fullname", 0],
          },
        },
      },
    ]);

    for (let index = 0; index < appointments.length; index++) {
      const { _id } = appointments[index];
      const update = {
        $set: {
          isScheduled: "y",
        },
      };
      const response = await Appointment.findByIdAndUpdate(_id, update);
    }

    console.log("appointments", appointments);

    appointments.forEach((appointment) => {
      const {
        appointmentDate,
        timeSlot,
        timeZone,
        duration,
        userNumber,
        consultantNumber,
        consultantName,
        userLastName,
        userFirstName,
        _id,
      } = appointment;

      const appointmentStart = DateTime.fromFormat(
        `${appointmentDate} ${timeSlot.startTime}`,
        "yyyy-MM-dd HH:mm",
        { zone: timeZone }
      );

      const appointmentTime = appointmentStart.setZone("UTC");
      const now = DateTime.utc();
      // console.log("timeZone -- ", timeZone);
      // console.log("appointmentStart -- ", appointmentStart);
      // console.log("row", `${appointmentDate} ${timeSlot.startTime}`);
      console.log("appointmentTime -- ", appointmentTime);
      console.log("now", now);
      // console.log("url", `${process.env.STATUSCALLBACK_URL}${_id}`);
      if (appointmentTime > now) {
        cron.schedule(
          appointmentTime.toFormat("m H d M *"),
          async () => {
            try {
              const callToUser = await client.calls.create({
                twiml: `
                  <Response>
                    <Say voice="woman">Please wait while we connect your call with ${userFirstName} ${userLastName}.</Say>
                    <Dial record="record-from-ringing" recordingStatusCallback = "${process.env.RECORDING_STATUS_CALLBACK_URL}${_id}">
                      ${userNumber}
                    </Dial>
                  </Response>`,
                to: consultantNumber,
                from: twilioNumber,
                timeLimit: +duration * 60,
                // timeLimit: 120,
                statusCallback: `${process.env.STATUSCALLBACK_URL}${_id}`,
                statusCallbackEvent: [
                  "initiated",
                  "ringing",
                  "in-progress",
                  "completed",
                ],
              });

              console.log("callToUser", callToUser);

              console.log(`Calls initiated for appointment ${appointment._id}`);
            } catch (error) {
              console.error("Error during Twilio call:", error);
            }
          },
          {
            scheduled: true,
            timezone: "UTC",
          }
        );

        console.log(`Call scheduled for ${appointmentTime.toISO()}`);
      }
    });
  } catch (error) {
    console.error("Error scheduling calls:", error);
  }
};

cron.schedule("* * * * *", () => {
  console.log("Cron is running...");
  sendReminder();
  scheduleACall();
});

async function sendReminder() {
  try {
    const now = DateTime.utc().toISO();
    const twentyFourHoursLater = DateTime.utc().plus({ hours: 1 }).toISO();

    const appointments = await Appointment.aggregate([
      {
        $match: {
          status: "upcoming",
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          "$appointmentDate",
                          " ",
                          "$timeSlot.startTime",
                        ],
                      },
                      timezone: "$timeZone",
                    },
                  },
                  new Date(now),
                ],
              },
              {
                $lte: [
                  {
                    $dateFromString: {
                      dateString: {
                        $concat: [
                          "$appointmentDate",
                          " ",
                          "$timeSlot.startTime",
                        ],
                      },
                      timezone: "$timeZone",
                    },
                  },
                  new Date(twentyFourHoursLater),
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "consultants",
          localField: "consultantId",
          foreignField: "_id",
          as: "consultant",
        },
      },
      {
        $project: {
          appointmentDate: 1,
          duration: 1,
          timeZone: 1,
          "timeSlot.startTime": 1,
          "timeSlot.endTime": 1,
          userEmail: { $arrayElemAt: ["$user.email", 0] },
          userNumber: { $arrayElemAt: ["$user.phoneNumber", 0] },
          consultantNumber: {
            $arrayElemAt: ["$consultant.personalInfo.phoneNumber", 0],
          },
          userFirstName: { $arrayElemAt: ["$user.firstName", 0] },
          userLastName: { $arrayElemAt: ["$user.lastName", 0] },
          consultantName: {
            $arrayElemAt: ["$consultant.personalInfo.fullname", 0],
          },
          consultantEmail: {
            $arrayElemAt: ["$consultant.personalInfo.email", 0],
          },
        },
      },
    ]);

    console.log("Appointments For mail", appointments);

    appointments.forEach((appointment) => {
      const {
        appointmentDate,
        timeSlot,
        timeZone,
        userEmail,
        consultantEmail,
        userFirstName,
        consultantName,
        _id,
      } = appointment;

      const appointmentStart = DateTime.fromFormat(
        `${appointmentDate} ${timeSlot.startTime}`,
        "yyyy-MM-dd HH:mm",
        { zone: timeZone }
      );

      const timeForStart = appointmentStart.setZone("UTC");
      const now = DateTime.utc();
      const reminderTime = timeForStart.minus({ minutes: 10 });

      console.log("timeZone", timeZone);
      console.log("appointmentStart", appointmentStart);
      console.log("Current Time", now.toISO());
      console.log("Reminder Time", reminderTime.toISO());

      // Ensure reminderTime is in the future
      if (reminderTime > now) {
        const cronExpression = reminderTime.toFormat("m H d M *");

        cron.schedule(cronExpression, async () => {
          try {
            const mailOptionsForUser = template.appointmentReminderToUser(
              userEmail,
              userFirstName
            );
            const mailOptionsForConsultant =
              template.appointmentReminderToConsultant(
                consultantEmail,
                consultantName
              );

            const mailResponse = await Promise.allSettled([
              sendEmail(mailOptionsForUser),
              sendEmail(mailOptionsForConsultant),
            ]);

            const isMailsent = mailResponse.every(
              (res) => res.status === "fullfilled"
            );

            if (isMailsent) {
              const updateStatus = Appointment.findByIdAndUpdate(_id, {
                isMailSent: false,
              });
              console.log("updateStatus", updateStatus);
            }

            console.log("Mail scheduled successfully:", mailResponse);
          } catch (error) {
            console.error("Error sending mail:", error);
          }
        });
      } else {
        console.log("Reminder time is in the past, not scheduling.");
      }
    });
  } catch (error) {
    console.log(error);
  }
}

async function sendEmail(mailOptions) {
  try {
    let transporter = nodemailer.createTransport({
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
