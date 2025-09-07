import nodemailer from "nodemailer";
import { email_template } from "../lib/emailTemp.js";
const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "parthamakhal80@gmail.com",
    pass: "idsz odvt edkl odyl",
  },
});

const sendEmail = async (email, verificationCode) => {
    try {
        const info = await transporter.sendMail({
            from: '"SmartNotes" <parthamakhal80@gmail.com>',
            to: email,
            subject: "Email Verification",
            text: `Your verification code is: ${verificationCode}`,
            html:email_template.replace("{verificationCode}",verificationCode),
        });
        console.log("Email sent:", info.messageId);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

export default sendEmail;
