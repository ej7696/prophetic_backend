require("dotenv").config();

const senderMail = `"Prophetic Pathway" ${process.env.MAIL_ID}`;

module.exports.acceptPending = (name, receiverMail) => {
  return (mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: "Next Steps in Your Application Process",
    html: `
        <p>Dear ${name},</p>

        <p>We are pleased to inform you that you have qualified to move forward in our selection process! Congratulations on making it this far.</p>

        <p>The next step involves an interview with our team of seasoned prophetic consultants. This is an exciting opportunity for you to showcase your skills and insights.</p>

        <p>We will be reaching out soon to schedule a time for the interview with you. If you have any questions in the meantime, please feel free to reach out.</p>

        <p>Thank you for your continued interest in joining our team!</p>

        <p>Best regards,</p>
        <p>Prophetic Pathway Team</p>
    `,
  });
};

module.exports.declinedPending = (name, receiverMail) => {
  return (mailOptions = {
    from: senderMail, // Sender address
    to: receiverMail, // Recipient address (applicant's email)
    subject: "Update on Your Application", // Subject line
    html: `
          <p>Dear ${name},</p>
  
          <p>Thank you for your interest in the Spiritual Consultant Position at Prophetic Pathway. We appreciate the time and effort you put into your application.</p>
  
          <p>After careful consideration, we regret to inform you that you have not qualified to move to the next step in our selection process. This decision was not easy, as we received many strong applications.</p>
  
          <p>We encourage you to apply for future opportunities that align with your skills and experience. Thank you once again for your interest in our team.</p>
  
          <p>Wishing you the best in your job search.</p>
  
          <p>Sincerely,</p>
          <p>Prophetic Pathway Team</p>
        `,
  });
};

module.exports.acceptInterview = (name, receiverMail, profileFormLink = "") => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Congratulations on Advancing to Your Onboarding Process",
    html: `
          <p>Dear ${name},</p>
  
          <p>We are excited to inform you that you have successfully passed the interview and are now qualified to move forward in the onboarding process! Congratulations on this wonderful achievement!</p>
  
          <p>To get started, please click the link below to fill out your profile information form:</p>
          <p><a href="${
            profileFormLink ?? "#"
          }" style="color: blue; text-decoration: underline;" target="_blank">Profile Information Form</a></p>
  
          <p>To assist you in completing the form, we have also attached a Profile Information Form Guide. This guide will help you navigate the form and ensure that all necessary information is provided.</p>
  
          <p>Once we receive your completed profile information form, we will reach out to schedule your training session.</p>
  
          <p>If you have any questions or need assistance while filling out the form, please don’t hesitate to contact us. We’re thrilled to have you on board and look forward to supporting you as you embark on this new journey!</p>
  
          <p>Best regards,</p>
          <p>Prophetic Pathway Team</p>
        `,
    attachments: [
      {
        filename: "Prophetic_Consultant_Profile_Form_Guide.pdf",
        path: "./Templates/Attachments/Prophetic_Consultant_Profile_Form_Guide.pdf",
      },
    ],
  };
};

module.exports.acceptOnboard = (name, receiverMail) => {
  return (mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: "Congratulations on Your Profile Approval!",
    html: `
        <p>Dear ${name},</p>
        <p>Congratulations! We are thrilled to inform you that your consultant profile has been successfully approved for Prophetic Pathway. We are excited to have you join our team of spiritual consultants dedicated to guiding and inspiring others.</p>

        <h3>Access Your Consultant Panel</h3>
        <p>You can now access your consultant panel using the following link:</p>
        <p><a href="${
          process.env.CONSULTANT_PANEL ?? "#"
        }" style="color: blue; text-decoration: underline;" target="_blank">Consultant Panel</a></p>

        <h3>Login Information</h3>
        <ul>
            <li>Email: ${receiverMail}</li>
            <li>Default Password: Prophetic@123</li>
        </ul>

        <p><strong>Important: Password Update</strong></p>
        <p>Upon your first login, you will see a pop-up message prompting you to change your password for enhanced security. Please follow the instructions to update your password.</p>

        <h3>Familiarize Yourself</h3>
        <p>We encourage you to take a moment to familiarize yourself with your profile and explore the features available to you. This will help you connect more effectively with those seeking your guidance.</p>

        <p>If you have any questions or need assistance, feel free to reach out to our support team at <a href="mailto:contactus@propheticpathway.com">contactus@propheticpathway.com</a>.</p>

        <p>Once again, congratulations! We look forward to your valuable contributions to Prophetic Pathway.</p>

        <p>Blessings,<br/>Prophetic Pathway Team!<br/><a href="https://propheticpathway.com">PropheticPathway.com</a></p>
    `,
  });
};

module.exports.declinedOnboard = (
  name,
  receiverMail,
  profileFormLink = "#",
  reason = "/n"
) => {
  return (mailOptions = {
    from: senderMail,
    to: receiverMail,
    subject: "Action Needed: Update Your Profile on Prophetic Pathway",
    html: `
      <p>Dear <strong>${name}</strong>,</p>
      <p>We hope you’re doing well! We have reviewed your profile on Prophetic Pathway and noticed some information that requires correction. To ensure your profile accurately reflects your expertise, we kindly ask you to make the necessary updates.</p>
      <p><strong>What Needs to Be Corrected/Updated:</strong></p>
      <p><span style="font-style: italic; color: red;">${reason.replace(
        /\n/g,
        "<br>"
      )}</span></p>
      <p>To update your profile, please click the link below:</p>
      <p><a href=${profileFormLink} style="text-decoration: none, color:'blue'">Update Your Profile</a></p>
      <p>We appreciate your attention to this matter and look forward to seeing your updated information!</p>
      <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
      <p>Best regards,</p>
      <p>The Prophetic Pathway Team</p>
    `,
  });
};
