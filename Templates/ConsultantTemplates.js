require("dotenv").config();
const senderMail = `"Prophetic Pathway" ${process.env.MAIL_ID}`;

module.exports.forgetPasswordOtp = (name, receiverMail, otp) => {
  return {
    from: senderMail,
    to: receiverMail,
    subject: "Reset Your Password – OTP Confirmation",
    html: `
            <p>Dear ${name},</p>
            <p>We received a request to reset the password for your account on Prophetic Pathway. To proceed, please use the One-Time Password (OTP) below to verify your request:</p>

            <h3>Your OTP: ${otp}</h3>

            <p>Please enter it on the password reset page to continue with the process.</p>

            <p>If you did not request a password reset, please ignore this email or contact our support team immediately at <a href="mailto:contactus@propheticpathway.com">contactus@propheticpathway.com</a> for assistance.</p>

            <p>Blessings,<br/>Prophetic Pathway Team!<br/><a href="https://propheticpathway.com">PropheticPathway.com</a></p>
        `,
  };
};
