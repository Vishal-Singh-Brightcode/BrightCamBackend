import Meeting from "../../models/meeting.model";
import User from "../../models/user.model";
import { v4 as uuidv4 } from "uuid";
import { sendInvitation, sendScheduledMeetingInvite } from "../user_utility";

const meetingTypes = {
  instant: "INSTANT",
  schedulled: "SCHEDULLED",
};

export const createInstantMeeting = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await User.findOne({ _id: userId });

    const meetingId = await generateMeetingId();

    let meetingDetails = {
      meetingType: meetingTypes.instant,
      hostEmail: user.email,
      hostId: user._id,
      name: `${user.name}'s meeting`,
      meetingId,
      passcode: 123,

      invitees: [],
      meetingOptions: {},
      isActive: true,
    };
    meetingDetails.meetingLink = `https://members.oflep.com/join-call`;
    const instantMeeting = await Meeting.create(meetingDetails);
    console.log("Instant meeting created => ", instantMeeting);
    res.status(200).send({ meetingDetails: instantMeeting });
  } catch (error) {
    console.log("Error while creating an instant meeting => ", error);
    res.status(500).send({ error: error.message });
  }
};

export const scheduleMeeting = async (req, res) => {
  try {
    let meetingDetails = req.body;

    let meetingDetailsForMail;

    const {
      date,
      startTime,
      endTime,
      invitedPeople,
      frequency,
      timezone,
      hostId,
      hostEmail,
    } = meetingDetails;

    const user = await User.findOne({ _id: String(hostId) });

    if (user) {
      meetingDetails.host = user.name;
      const meetingId = await generateMeetingId();
      meetingDetails.meetingId = meetingId;
      meetingDetails.passcode = 123;

      let durationInMinutes = calculateTimeDuration(startTime, endTime);

      // create meeting
      let meetingDetailsForModal = {
        hostEmail: user.email,
        hostId: user._id,
        name: `${user.name}'s meeting`,
        meetingId,
        passcode: 123,
        schedullingDetails: {
          date,
          from: startTime,
          to: endTime,
          duration: durationInMinutes,
          timezone,
          frequency,
        },
        invitees: invitedPeople,
        meetingOptions: {},
        meetingType: "SCHEDULED",
        isActive: true,
      };

      meetingDetailsForMail = {
        ...meetingDetails,
        duration: durationInMinutes,
        meetingLink: `http://localhost:4000/join-call`,
      };

      const scheduledMeeting = await Meeting.create(meetingDetailsForModal);

      user.schedule.push(scheduledMeeting);

      await user.save();

      await sendScheduledMeetingInvite(
        meetingDetailsForMail,
        meetingDetailsForModal
      );

      res.status(200).send(scheduledMeeting);
    } else {
      return res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.log("Error while scheduling a meeting: ", error);
    res.status(500).send({ error: error.message });
  }
};

export const getUserSchedule = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findOne({ _id: userId });
    if (user) {
      return res.status(200).send({ schedule: user.schedule });
    } else {
      return res
        .status(404)
        .send({ message: "User not found", error: error.message });
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

export const startMeeting = async (req, res) => {
  try {
    const { meetingId, passcode } = req.body.meetingCred;
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      res.status(200).send({ message: "Meeting got started" });
    } else {
      res.status(404).send({ error: "Meeting not found" });
    }
  } catch (error) {
    console.log("Error while starting a meeting: ", error);
    res.status(500).send({ error: error.message });
  }
};

export const getMeetingDetails = async (req, res) => {
  try {
    const { meetingId, passcode, userId } = req.body;
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      res.status(200).send({ meetingDetails: meeting });
    } else {
      res.status(404).send({ error: "Meeting not found" });
    }
  } catch (error) {
    console.log("Error while starting a meeting: ", error);
    res.status(500).send({ error: error.message });
  }
};

export const endMeeting = async (req, res) => {
  try {
    const { meetingId, passcode } = req.body.meetingCred;
    const meeting = await Meeting.findOne({ meetingId });
  } catch (error) {
    console.log("Error while ending a meeting: ", error);
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const { meetingId, passcode } = req.body.meetingCred;
    const meeting = await Meeting.findOne({ meetingId });
  } catch (error) {
    console.log("Error while ending a meeting: ", error);
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { meetingId, passcode, newParticipant } = req.body.meetingCred;
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      let temp = [];
      meeting.connectedParticipants.forEach((participant) => {
        if (participant != newParticipant) {
          temp.push(newParticipant);
        }
      });
      meeting.connectedParticipants = [
        ...meeting.connectedParticipants,
        ...temp,
      ];
      await meeting.save();
      res.status(200).send({ message: "Participant has been added" });
    } else {
      res.status(200).send({ message: "Participant already exists" });
    }
  } catch (error) {
    console.log("Error while adding participant: ", error);
    res.status(500).send({ error: error.message });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { meetingId, passcode, participantToBeRemoved } =
      req.body.meetingCred;
    const meeting = await Meeting.findOne({ meetingId });
    if (meeting) {
      let temp = meeting.connectedParticipants.filter(
        (participant) => participant != participantToBeRemoved
      );

      meeting.connectedParticipants = temp;
      await meeting.save();
      res.status(200).send({ message: "Participant has been removed" });
    } else {
      res.status(200).send({ message: "Participant does not exist" });
    }
  } catch (error) {
    console.log("Error while removing participant: ", error);
    res.status(500).send({ error: error.message });
  }
};

export const verifyMeetingCreds = async (req, res) => {
  const meetingDetails = req.body;
  const { meetingId, passcode, userId } = req.body;

  const meeting = await Meeting.findOne({ meetingId });

  if (meeting) {
    meeting.isVerified = true;
    console.log("Meeting => ", meeting);
    res.status(200).send({ isVerified: true });
  } else
    res.status(401).send({
      isVerified: false,
    });
};

const generateMeetingId = async () => {
  let meetingId = uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';

  let isMeetingIdUnique = false;

  while (!isMeetingIdUnique) {
    const duplicateMeeting = await Meeting.findOne({ meetingId });
    if (duplicateMeeting) {
      /////////////
      meetingId = uuidv4();
    } else {
      isMeetingIdUnique = true;
    }
  }
  return meetingId;
};

export const calculateTimeDuration = (start, end) => {
  // Timestamps
  const timestamp1 = new Date(start);
  const timestamp2 = new Date(end);

  // Calculate time difference in milliseconds
  const timeDifferenceInMilliseconds = Math.abs(timestamp2 - timestamp1);

  // Convert milliseconds to hours, minutes, and seconds
  const millisecondsInHour = 1000 * 60 * 60;
  const millisecondsInMinute = 1000 * 60;
  const millisecondsInSecond = 1000;

  const hours = Math.floor(timeDifferenceInMilliseconds / millisecondsInHour);
  const minutes = Math.floor(
    timeDifferenceInMilliseconds / millisecondsInMinute
  );
  const seconds = Math.floor(
    timeDifferenceInMilliseconds / millisecondsInSecond
  );

  console.log(
    `Time difference: ${hours} hours, ${minutes} minutes, ${seconds} seconds`
  );

  return minutes;
};
