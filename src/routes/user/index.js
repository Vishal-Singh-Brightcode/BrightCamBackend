require("dotenv").config();
import { Router } from "express";
import jwt from "jsonwebtoken";
import { sendInvitation } from "../../controllers/user_utility/index";
import User from "../../models/user.model";
export const userRouter = Router();

userRouter.post("/send-invite-to-join-call", sendInvitation);

userRouter.post("/user-info", async (req, res) => {
  try {
    const { userId, deviceToken } = req.body;

    if (userId && deviceToken) {
      const user = await User.findById({ _id: userId });

      if (user) {
        user.pushWithFCM.deviceToken = deviceToken;

        await user.save();

        const secretKey = process.env.SECRET_KEY;

        const payload = {
          email: user.email,
        };

        jwt.sign(
          payload,
          secretKey,
          { algorithm: "HS256" },
          function (err, token) {
            if (err) {
              console.log("Error ==> ", err.message);

              return res.status(500).send({ error: "Server error" });
            } else {
              return res.status(200).send({
                message: "Login successfull",
                token,
                userCred: {
                  username: user.name,
                  email: user.email,
                  userId: user._id,
                },
              });
            }
          }
        );
      } else {
        return res.status(400).send({ error: "Bad request" });
      }
    } else {
      return res.status(400).send({ error: "Bad request" });
    }
  } catch (err) {
    console.log("err ========== ", err);
    return res.status(500).send({ error: "Internal Server Error" });
  }
});
