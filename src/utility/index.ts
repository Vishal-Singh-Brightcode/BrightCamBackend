import nodemailer from "nodemailer";
import schedule from "node-schedule";
import { sendMeetingReminder } from "../services/pushNotifications";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_MAIL,
    pass: process.env.ZOHO_PASSWORD,
  },
});

export const sendMail = async (
  subject: string,
  email: string | string[],
  html: string
) => {
  try {
    const mailInfo = await transporter.sendMail({
      from: `"OFLEP CONNECT" <${process.env.ZOHO_MAIL}>`,
      to: email,
      subject: subject,
      html,
    });

    return mailInfo;
  } catch (error) {
    console.log("Error sending mail ==> ", error);
    throw error;
  }
};

//- in JavaScript - 0 - January, 11 - December.
export const meetingRemindersScheduler = (users: any, meetingAlert: any) => {
  const date = new Date(2024, 3, 4, 15, 7, 0);

  const job = schedule.scheduleJob(date, function () {
    sendMeetingReminder(users, meetingAlert);
    console.log(
      `Sent meeting alert on ${new Date().toDateString()} at ${new Date().toLocaleTimeString()}`
    );
  });
};

const errorAndTheCodes: any = {
  Not_Found: 404,
  Missing_Credentials: 400,
  Server_Error: 500,
  Unauthorised: 403,
  Unauthenticated: 401,
};

export const getErrorCode = (error: string) => {
  return errorAndTheCodes[error];
};
