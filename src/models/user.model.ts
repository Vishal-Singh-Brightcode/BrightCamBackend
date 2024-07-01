import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  emailVerificationCode: String,
  isVerified: { type: Boolean, default: false },
  pushWithFCM: {
    deviceToken: String,
  },
  localization: {
    timezone: String,
  },
  schedule: [],
});

const User = mongoose.model("User", UserSchema);

export default User;
