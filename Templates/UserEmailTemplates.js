require("dotenv").config();

const senderMail = `"Prophetic Pathway" ${process.env.MAIL_ID}`;

module.exports.NewOtp = (name, receiverMail, otp) => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Your OTP for Prophetic Pathway Signup",
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333333;">
            <p style=" font-size: 16px; text-transform: capitalize;">Dear ${name},</p>
            <p style=" font-size: 14px; ">Thank you for signing up on Prophetic Pathway. To complete your registration, please use the following One-Time Password (OTP):</p>

            <h3 style="color: #1d264d; font-size: 28px; text-align: center; margin: 20px 0;">${otp}</h3>

            <p style=" font-size: 14px; ">This OTP is valid for the next 1 hour. Please enter it on the signup screen to verify your account.</p>
            <p style=" font-size: 14px; ">If you did not initiate this request, please contact our support team at <a href="mailto:contactus@propheticpathway.com" style="color: #1d264d; text-decoration: none;">contactus@propheticpathway.com</a>.</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
            <p style="margin: 0; color: #ffffff;">Thank you,<br>Prophetic Pathway Team</p>
            <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
};

module.exports.ResetPasswordLink = (receiverMail, resetLink) => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Password Reset Request for Your Prophetic Pathway Account",
    html: `
        <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
            </div>
  
            <!-- Body -->
            <div style="padding: 20px; color: #333333;">
               
              <p style=" font-size: 14px; ">We received a request to reset the password for your account on Prophetic Pathway. </p>
  
              <h3 style="color: #1d264d; font-size: 18px; text-align: center; margin: 20px 0;"><a href="${resetLink}">Reset Password</a></h3>
  
            
              <p>If you did not request a password reset, please ignore this email or contact our support team immediately at  <a href="mailto:contactus@propheticpathway.com" style="color: #1d264d; text-decoration: none;">contactus@propheticpathway.com</a>.</p>
            </div>
  
            <!-- Footer -->
            <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
              <p style="margin: 0; color: #ffffff;">Thank you,<br>Prophetic Pathway Team</p>
              <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
  };
};

// module.exports.AppointmentCancellationToConsultant = (
//   conFullname,
//   UserFullname,
//   email,
//   appointmentDate,
//   startTime,
//   endTime
// ) => {
//   return {
//     from: senderMail,
//     to: email,
//     subject: "Client Appointment Cancellation Notification",
//     html: `
//         <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
//           <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">

//             <!-- Header -->
//             <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
//               <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
//             </div>

//             <!-- Body -->
//             <div style="padding: 20px; color: #333333;">

//              <p style=" font-size: 16px; text-transform: capitalize; "><b>Dear ${conFullname}</b></p>

//               <p style=" font-size: 14px; ">We regret to inform you that the client, <b>${UserFullname}</b>, has canceled their prophetic consultation session scheduled on <b> ${appointmentDate} at ${startTime} to ${endTime}. </b></p>

//               <p style=" font-size: 14px; ">If you have any questions or need further assistance, please feel free to reach out.</p>

//               <p style=" font-size: 14px; ">Thank you for your understanding.</p>
//             </div>

//             <!-- Footer -->
//             <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
//               <p style="margin: 0; color: #ffffff;">Best regards,<br>Prophetic Pathway Team</p>
//               <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
//             </div>
//           </div>
//         </div>
//       `,
//   };
// };
module.exports.AppointmentCancellationToConsultant = (
  conFullname,
  UserFullname,
  email,
  appointmentDate,
  startTime,
  endTime
) => {
  return {
    from: senderMail,
    to: email,
    subject: "Client Appointment Cancellation Notification",
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333333;">
            <p style="font-size: 16px; text-transform: capitalize;"><b>Dear ${conFullname},</b></p>
            <p style="font-size: 14px;">
              We regret to inform you that the client, <b>${UserFullname}</b>, has canceled their prophetic consultation session scheduled on <b>${appointmentDate}</b> from <b>${startTime}</b> to <b>${endTime}</b>.
            </p>
            <p style="font-size: 14px;">
              We understand that schedules change, and we appreciate your flexibility.
            </p>
            <p style="font-size: 14px;">If you have any questions or need further assistance, please feel free to reach out.</p>
            <p style="font-size: 14px;">Thank you for your understanding.</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
            <p style="margin: 0; color: #ffffff;">Best regards,<br>Prophetic Pathway Team</p>
            <p style="margin: 5px 0;"><a href="https://www.propheticpathway.com" style="color: #ffffff; text-decoration: none;">propheticpathway.com</a></p>
            <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
};

// module.exports.AppointmentCancellationToUser = (
//   UserFullname,
//   email,
//   appointmentDate,
//   startTime,
//   endTime
// ) => {
//   return {
//     from: senderMail,
//     to: email,
//     subject: "Appointment Cancellation Confirmation - Prophetic Pathway",
//     html: `
//         <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
//           <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">

//             <!-- Header -->
//             <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
//               <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
//             </div>

//             <!-- Body -->
//             <div style="padding: 20px; color: #333333;">

//              <p style=" font-size: 16px; text-transform: capitalize; "><b>Dear ${UserFullname}</b></p>

//               <p style=" font-size: 14px; ">We are writing to confirm the cancellation of your prophetic consultation session scheduled on <b> ${appointmentDate} at ${startTime} to ${endTime}. </b></p>

//               <p style=" font-size: 14px; ">To reschedule your consultation, please visit our website at <a href="https://propheticpathway.com/" target="_blank">propheticpathway.com</a>.</p>

//               <p style=" font-size: 14px; ">Thank you for choosing Prophetic Pathway. We look forward to assisting you in the future!</p>
//             </div>

//             <!-- Footer -->
//             <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
//               <p style="margin: 0; color: #ffffff;">Best regards,<br>Prophetic Pathway Team</p>
//               <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
//             </div>
//           </div>
//         </div>
//       `,
//   };
// };
module.exports.AppointmentCancellationToUser = (
  userName,
  email,
  appointmentDate,
  startTime
) => {
  return {
    from: senderMail,
    to: email,
    subject: "Appointment Cancellation Confirmation - Prophetic Pathway",
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333333;">
            <p style="font-size: 16px; text-transform: capitalize;"><b>Dear ${userName},</b></p>
            <p style="font-size: 14px;">
              We are writing to confirm that you have successfully canceled your prophetic consultation session scheduled on <b>${appointmentDate}</b> at <b>${startTime}</b>. We understand that plans change and appreciate you keeping us informed.
            </p>
            <p style="font-size: 14px;">
              If you'd like to reschedule your consultation, you can do so by visiting our website at <a href="https://www.propheticpathway.com" style="color: #1d264d; text-decoration: none;">propheticpathway.com</a>.
            </p>
            <p style="font-size: 14px;">Thank you for choosing Prophetic Pathway. We hope to assist you in the future!</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
            <p style="margin: 0; color: #ffffff;">Warm regards,<br>Prophetic Pathway Team</p>
            <p style="margin: 5px 0;"><a href="https://www.propheticpathway.com" style="color: #ffffff; text-decoration: none;">propheticpathway.com</a></p>
            <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
};

module.exports.AppointmentCanceledByConsultantToUser = (
  recieversMail,
  name,
  date,
  time
) => {
  return (mailOptions = {
    from: senderMail,
    to: recieversMail,
    subject: "Appointment Cancellation Notice",
    html: `<p>Dear ${name},</p>
           <p>We regret to inform you that your prophetic consultation session scheduled on <strong>${date}</strong> at <strong>${time}</strong> has been canceled by the consultant due to unforeseen circumstances. We sincerely apologize for any inconvenience this may cause.</p>
           <p>You can reschedule your consultation by visiting our website at <a href="https://propheticpathway.com">propheticpathway.com</a>.</p>
           <p>Thank you for your understanding, and we look forward to assisting you at a more convenient time.</p>
           <p>Warm regards,<br>Prophetic Pathway Team<br><a href="https://propheticpathway.com">propheticpathway.com</a></p>`,
  });
};

module.exports.AppointmentCancellationConfirmationToConsultant = (
  recieversMail,
  consultantName,
  clientUsername,
  date,
  time
) => {
  return {
    from: senderMail,
    to: recieversMail,
    subject: "Appointment Cancellation Confirmation",
    html: `<p>Dear ${consultantName},</p>
           <p>We are writing to confirm that you have canceled the prophetic consultation session with <strong>${clientUsername}</strong> scheduled on <strong>${date}</strong> at <strong>${time}</strong>.</p>
           <p>If there are any further updates or assistance required, please don't hesitate to reach out to us. We appreciate your efforts to keep our clients informed and updated.</p>
           <p>Thank you for your time and understanding.</p>
           <p>Best regards,<br>Prophetic Pathway Team<br><a href="https://propheticpathway.com">propheticpathway.com</a></p>`,
  };
};

module.exports.GetUserConfirmationAppointmentEmail = (
  UserFullname,
  userEmail,
  appointmentDate,
  startTime,
  endTime,
  duration
) => {
  return {
    from: senderMail,
    to: userEmail,
    subject: "Appointment Confirmation - Prophetic Pathway",
    html: `
        <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
            </div>
  
            <!-- Body -->
            <div style="padding: 20px; color: #333333;">

             <p style=" font-size: 16px; text-transform: capitalize; "><b>Dear ${UserFullname}</b></p>
               
              <p style=" font-size: 14px; ">Thank you for scheduling a consultation session with us at Prophetic Pathway. We are pleased to confirm your appointment as follows:</p>
             
             <p style=" font-size: 16px; "> <b>Date:</b> ${appointmentDate}</p>
              <p style=" font-size: 16px; "><b>Time:</b> ${startTime} -  ${endTime}</p>
             <p style=" font-size: 16px; "> <b>Duration:</b>  ${duration} minutes</p>

   
              <p style=" font-size: 14px; ">You will receive a reminder email 10 minutes before your appointment. At the scheduled time, we will give you a call to connect you with your consultant.</p>

              <p style=" font-size: 14px; ">To make the most of your session, we recommend making a list of any specific topics or questions you would like to discuss, so you don’t forget them.</p>
              
              <p style=" font-size: 14px; ">If you need to reschedule, you can easily do so through our website at <a href="https://propheticpathway.com/" target="_blank">propheticpathway.com</a>. For any questions or further assistance, please don’t hesitate to reach out through the CONTACT US page on our website or email us at <b>contactus@propheticpathway.com</b>.</p>

              <p style=" font-size: 14px; ">We look forward to connecting with you soon!</p>
            </div>
  
            <!-- Footer -->
            <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
              <p style="margin: 0; color: #ffffff;">Best regards,<br>Prophetic Pathway Team</p>
              <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
  };
};

module.exports.GetConsultantConfirmationAppointmentEmail = (
  UserFullname,
  consulatantName,
  consulatantEmail,
  appointmentDate,
  startTime,
  endTime,
  duration
) => {
  return {
    from: senderMail,
    to: consulatantEmail,
    subject: "Appointment Confirmation - Prophetic Pathway",
    html: `
        <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
            </div>
  
            <!-- Body -->
            <div style="padding: 20px; color: #333333;">

             <p style=" font-size: 16px; text-transform: capitalize; "><b>Dear ${consulatantName}</b></p>
               
              <p style=" font-size: 14px; ">We are pleased to confirm your upcoming prophetic consultation session. Please find the details below:</p>
              <p style=" font-size: 16px; "> <b>Client Username:</b> ${UserFullname}</p>
             <p style=" font-size: 16px; "> <b>Date:</b> ${appointmentDate}</p>
              <p style=" font-size: 16px; "><b>Time:</b> ${startTime} -  ${endTime}</p>
             <p style=" font-size: 16px; "> <b>Duration:</b>  ${duration} minutes</p>

   
              <p style=" font-size: 14px; ">As a reminder, you will receive a reminder email 10 minutes before the appointment. Please log in to the website 5 minutes prior to the scheduled time to ensure you are ready. Start calling the end user 2 minutes before the appointment time to address any connection issues and avoid delays.</p>

              <p style=" font-size: 14px; ">As a Prophetic Pathway consultant, you are required to provide detailed, genuine, and accurate prophetic guidance to your clients. Your commitment to delivering exceptional service is crucial, as it encourages clients to give you the best ratings and reviews. Higher ratings increase your chances of attracting returning clients as well as new clients.</p>
              
              <p style=" font-size: 14px; ">If you need to reschedule, you can easily do so through our website at <a href="https://propheticpathway.com/" target="_blank">propheticpathway.com</a>.If you have any questions or need assistance, please feel free to reach out.</b>.</p>

              <p style=" font-size: 14px; ">Thank you for your dedication, and we wish you a successful session!</p>
            </div>
  
            <!-- Footer -->
            <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
              <p style="margin: 0; color: #ffffff;">Best regards,<br>Prophetic Pathway Team</p>
              <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
  };
};

module.exports.contactUsForm = (receiverMail, message) => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Contact Us Inquiry",
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333333;">
            
            <p style=" font-size: 14px; ">First Name : ${message.firstName} </p>
            <p style=" font-size: 14px; ">Last Name : ${message.lastName}</p>
            <p style=" font-size: 14px; ">Email : ${message.email}</p>
            <p style=" font-size: 14px; ">Phone Number : ${message.phoneNumber}</p>
            <p style=" font-size: 14px; ">Message : ${message.message}</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
            <p style="margin: 0; color: #ffffff;">Thank you,<br>Prophetic Pathway Team</p>
            <p style="margin: 5px 0;">&copy; 2024 Prophetic Pathway. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
};

module.exports.earlyAccess = (receiverMail, message) => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Early Access",
    html: `
      <div style="background-color: #f0f4f8; padding: 20px; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <div style="background-color: #1d264d; padding: 20px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Prophetic Pathway</h1>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333333;">
            <p style=" font-size: 14px; ">Full Name : ${message.fullName} </p>
            <p style=" font-size: 14px; ">Email : ${message.email}</p>
            <p style=" font-size: 14px; ">Phone Number : ${message.phoneNumber}</p>
          </div>

          <!-- Footer -->
          <div style="background-color: #1d264d; padding: 10px; color: #ffffff; text-align: center; font-size: 14px;">
            <p style="margin: 5px 0;">&copy; 2025 Prophetic Pathway. All rights reserved.</p>
          </div>
        </div>
      </div>
    `,
  };
};

module.exports.appointmentReminderToUser = (
  receiverMail,
  userName,
  date,
  time,
  duration
) => {
  return (mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: "Reminder: Your Prophetic Consultation Session Starts Soon",
    html: `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #2c3e50;">Reminder: Your Prophetic Consultation Session Starts Soon</h2>
            
            <p>Dear ${userName},</p>
            
            <p>This is a friendly reminder that your prophetic consultation session starts in just <strong>10 minutes</strong>!</p>
            
            <p>You will receive an automated connection call <strong>1 minutes</strong> before your scheduled appointment time, which will link you with your prophetic consultant. To enhance your experience, please make sure to find a quiet place where you can have some alone time during your session.</p>
            
            <p>We look forward to connecting with you soon!</p>
            
            <p>Best regards,</p>
            <p><strong>Prophetic Pathway Team</strong><br/>
            <a href="https://propheticpathway.com" style="color: #3498db; text-decoration: none;">Propheticpathway.com</a></p>
        </div>
    </body>
    </html>
    `,
  });
};

module.exports.appointmentReminderToConsultant = (
  receiverMail,
  consultantName
) => {
  return (mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: "Reminder: Upcoming Prophetic Consultation Session",
    html: `
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; background-color: #f9f9f9;">
            <h2 style="text-align: center; color: #2c3e50;">Reminder: Upcoming Prophetic Consultation Session</h2>
            
            <p>Dear ${consultantName},</p>
            
            <p>This is a friendly reminder that your prophetic consultation session is in just <strong>10 minutes</strong>!</p>
            
            <p>You will receive an automated connection call <strong>1 minutes</strong> before your scheduled appointment time to connect you with your client. Please ensure you find a quiet place where you can have some alone time during your session to create the best environment for both you and the customer.</p>
            
            <p>Thank you for your commitment, and we wish you a wonderful consultation!</p>
            
            <p>Best regards,</p>
            <p><strong>Prophetic Pathway Team</strong><br/>
            <a href="https://propheticpathway.com" style="color: #3498db; text-decoration: none;">Propheticpathway.com</a></p>
        </div>
    </body>
    </html>
    `,
  });
};
