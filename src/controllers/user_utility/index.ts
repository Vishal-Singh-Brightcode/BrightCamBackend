require("dotenv").config();
import { Request, Response } from "express";

import { meetingRemindersScheduler, sendMail } from "../../utility";
const path = require("path");
import fs from "fs/promises";
import User from "../../models/user.model";
import { sendPushAlerts } from "../../services/pushNotifications";

// interface ConnectedUsers {
//   [key: string]: any; // You can replace 'any' with the actual type of values you expect in the object
// }

export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const { invitees, meetingDetails } = req.body;

    const {
      meetingId,
      hostId,
      host,
      meetingLink,
      meetingType,
      meetingPasscode,
      hostEmail,
    } = meetingDetails;

    const filePath = path.join(
      __dirname,

      "../../public/templates/joinCallInvite.html"
    );

    const joinCallInviteMail = await fs.readFile(filePath, "utf-8");

    for (let invitee of invitees) {
      const userOnTheApp = await User.findOne({ email: invitee });
      if (userOnTheApp) {
        ////////////////////////////////
      }

      let transformedMessage = joinCallInviteMail.replace(
        /#MEETING_HOST#/g,
        host
      );

      transformedMessage = transformedMessage.replace(/#INVITEE#/g, "User"); //////// user just for now

      transformedMessage = transformedMessage.replace(
        /#MEETING_ID#/g,
        meetingId
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_PASSCODE#/g,
        meetingPasscode
      );

      transformedMessage = transformedMessage.replace(
        /#SUPPORT_MAIL#/g,
        process.env.SUPPORT_MAIL as string
      );

      const encodedHostId = encodeURIComponent(
        Buffer.from(hostEmail).toString("base64")
      );

      const encodedJoineeId = encodeURIComponent(
        Buffer.from(invitee).toString("base64")
      );

      const encodedMeetingId = encodeURIComponent(
        Buffer.from(meetingId).toString("base64")
      );

      const encodedMeetingPasscode = encodeURIComponent(
        Buffer.from(String(meetingPasscode)).toString("base64")
      );

      console.log(
        "MEETING_LINK ===========",
        `${meetingLink}/${encodedHostId}/${encodedJoineeId}/${encodedMeetingId}/${encodedMeetingPasscode}`
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_LINK#/g,
        `${meetingLink}/${encodedHostId}/${encodedJoineeId}/${encodedMeetingId}/${encodedMeetingPasscode}`
      );

      await sendMail("Meeting Invite", invitees, transformedMessage);
    }

    res.send({ message: "Invitations have been sent" });
  } catch (error: any) {
    console.log(error);
    res.status(500).send({ error: error?.message });
  }
};

export const sendScheduledMeetingInvite = async (
  meetingDetails: any,
  meetingModal: any
) => {
  try {
    const {
      invitedPeople,
      date,
      startTime,
      endTime,
      frequency,
      timezone,
      meetingLink,
      host,
      hostId,
      hostEmail,
      meetingId,
      passcode,
      duration,
    } = meetingDetails;
    const filePath = path.join(
      __dirname,

      "../../public/templates/scheduledMeetingInvite.html"
    );

    const scheduledMeetingInvite = await fs.readFile(filePath, "utf-8");

    const appUsers = [];

    for (let invitee of invitedPeople) {
      const userOnTheApp = await User.findOne({ email: invitee });
      if (userOnTheApp) {
        userOnTheApp.schedule.push(meetingModal);
        appUsers.push(userOnTheApp);
        await userOnTheApp.save();
      }
      let transformedMessage = scheduledMeetingInvite.replace(
        /#SUPPORT_MAIL#/g,
        process.env.SUPPORT_MAIL as string
      );

      transformedMessage = transformedMessage.replace(/#MEETING_HOST#/g, host);

      const hostEmailBase64 = Buffer.from(hostEmail).toString("base64");

      const inviteeEmailBase64 = Buffer.from(invitee).toString("base64");

      const meetingIdEncoded = Buffer.from(meetingId).toString("base64");

      const meetingCode = Buffer.from(passcode.toString()).toString("base64");

      transformedMessage = transformedMessage.replace(
        /#MEETING_LINK#/g,
        `${meetingLink}/${hostEmailBase64}/${inviteeEmailBase64}/${meetingIdEncoded}/${meetingCode}`
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_ID#/g,
        meetingId
      );

      transformedMessage = transformedMessage.replace(/#INVITEE#/g, "User"); //////// user just for now

      // transformedMessage = transformedMessage.replace(/#APP_LINK#/g, appLink);

      transformedMessage = transformedMessage.replace(
        /#MEETING_PASSCODE#/g,
        passcode
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_DATE#/g,
        new Date(date).toLocaleDateString()
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_START_TIME#/g,
        new Date(startTime).toLocaleTimeString()
      );

      transformedMessage = transformedMessage.replace(
        /#MEETING_DURATION#/g,
        duration
      );
      if (appUsers.length) {
        //send push alerts
        const inviteMessage = {
          notification: {
            title: "Invitation",
            body: "You are invited.",
          },
          data: {
            // You can add custom data here
            // For example, you can specify a custom key-value pair
            // 'key': 'value'
          },
        };
        await sendPushAlerts(appUsers, inviteMessage);
      }

      await sendMail("Meeting Invite", invitedPeople, transformedMessage);
      let data = JSON.stringify({
        meetingId,
        passcode,
        hostEmail,
        hostId,
      });
      // schedulling job
      const meetingAlert = {
        notification: {
          title: "Invitation",
          body: "You are invited.",
        },
        data: { data },
      };
      meetingRemindersScheduler(appUsers, meetingAlert);
    }
  } catch (error) {
    console.log("Error:", error);
  }
};

export const joinCall = async (req: Request, res: Response) => {
  const { hostId, joineeId, meetingId, passcode } = req.params;

  const decodedHostId = Buffer.from(hostId, "base64").toString("utf-8");
  console.log(
    "hostId ========== ",
    hostId,
    "decodedHostId ======= ",
    decodedHostId
  );
  const decodedJoineeId = Buffer.from(joineeId, "base64").toString("utf-8");

  const decodedMeetingId = Buffer.from(meetingId, "base64").toString("utf-8");

  const decodedPasscode = Buffer.from(passcode, "base64").toString("utf-8");

  const filePath = path.join(__dirname, "../../public/webrtc/joinCall.html");

  let joinCallWebPage = await fs.readFile(filePath, "utf-8");

  joinCallWebPage = joinCallWebPage.replace("#MEETING_ID#", decodedMeetingId);

  joinCallWebPage = joinCallWebPage.replace(
    "#MEETING_PASSCODE#",
    decodedPasscode
  );

  // joinCallWebPage = joinCallWebPage.replace(
  //   "#USER_MEETING_ID#",
  //   decodedMeetingId
  // );

  // joinCallWebPage = joinCallWebPage.replace(
  //   "#USER_MEETING_PASSCODE#",
  //   decodedPasscode
  // );

  joinCallWebPage = joinCallWebPage.replace("#HOST_ID#", decodedHostId);

  joinCallWebPage = joinCallWebPage.replace("#JOINEE_ID#", decodedJoineeId);

  res.status(200).send(joinCallWebPage);
};
