import Creds from "../../models/serviceAccount.model";

const admin = require("firebase-admin");

const getServiceAccountCreds = async () => {
  const serviceAccount = await Creds.findOne({
    _id: process.env.SERVICE_ACCOUNT_ID,
  });

  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(JSON.stringify(serviceAccount))
    ),
  });
};

getServiceAccountCreds();

// Define message payload
const message = {
  notification: {
    title: "Hello from Node.js",
    body: "This is a test notification sent from Node.js server!",
  },
  data: {
    meetingID: "123456",
    passcode: "123",
    hostEmail: "someone",
    hostId: "1",
  },
  //topic: "your-topic", // or specify a device token or registration token
  token:
    "dFKFnzwISmWm7uIwT2jB24:APA91bFc28xqxQUSS2MoVC81_qjj7lSj-7SlEjpA7WdULxHrpl4Bt6bXRaTO2zsmNBSG_KKyCMj_8oKSxliO7Ai3BeK-kUwiXdMhOSeGe75nqnDF7-gqli6uAYQBToiHUOFkYgM1jPgY",
};

export const sendPushNotification = async () => {
  // Send FCM message
  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

export const sendPushAlerts = async (users, message) => {
  // Send FCM message
  console.log("users =======", users);
  try {
    for (let user of users) {
      if (user.pushWithFCM) {
        message["token"] = user.pushWithFCM.deviceToken;
        const response = await admin.messaging().send(message);
        console.log("Successfully sent push alert : to ", user.email);
      }
    }

    return;
  } catch (error) {
    console.error(
      "Error sending push alerts: =================== ",
      error.errorInfo
    );
    return;
  }
};

export const sendMeetingReminder = async (users, meetingAlert) => {
  return await sendPushAlerts(users, meetingAlert);
};
