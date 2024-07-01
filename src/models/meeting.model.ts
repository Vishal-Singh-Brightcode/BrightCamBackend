import mongoose from "mongoose";
const { Schema } = mongoose;

// export interface MeetingTypes {
//   instant: "INSTANT";
//   scheduled: "SCHEDULED";
// }

const MeetingSchema = new Schema({
  meetingType: String,
  hostEmail: { type: String },
  hostId: { type: String || Number || Object },
  name: String,
  meetingId: { type: String || Number },
  passcode: String || Number,
  meetingLink: String,
  schedullingDetails: {
    date: String,
    from: String,
    to: String,
    timezone: String,
    duration: Number,
    isHeld: Boolean,
    frequency: String,
  },
  invitees: { type: Array },
  connectedParticipants: Array,
  meetingOptions: Object,
  isActive: { type: Boolean, default: true },
});

const Meeting = mongoose.model("Meeting", MeetingSchema);

export default Meeting;
