import { Router } from "express";
import {
  createInstantMeeting,
  endMeeting,
  getMeetingDetails,
  getUserSchedule,
  scheduleMeeting,
  startMeeting,
  verifyMeetingCreds,
} from "../../controllers/meeting";

export const meetingRouter = Router();

meetingRouter.get("/create-instant-meeting/:userId", createInstantMeeting);

meetingRouter.post("/meeting-details", getMeetingDetails);

meetingRouter.post("/schedule-meeting", scheduleMeeting);

meetingRouter.post("/start-meeting", startMeeting);

meetingRouter.post("/end-meeting", endMeeting);

meetingRouter.post("/verify-meeting-creds", verifyMeetingCreds);

meetingRouter.get("/user-schedule/:userId", getUserSchedule);
