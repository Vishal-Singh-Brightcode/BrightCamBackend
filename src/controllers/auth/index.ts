require("dotenv").config();
import { Request, Response } from "express";
import User from "../../models/user.model";
import bcrypt from "bcrypt";
import { getErrorCode, sendMail } from "../../utility";
import jwt from "jsonwebtoken";
import otpGenerator from "otp-generator";
import fs from "fs/promises";
const { OAuth2Client } = require("google-auth-library");
const path = require("path");
const client = new OAuth2Client();

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const verificationCode: string = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });

    const filePath = path.join(
      __dirname,

      "../../public/templates/verifyEmail.template.html"
    );

    let verifyMailHtml = await fs.readFile(filePath, "utf-8");

    verifyMailHtml = verifyMailHtml.replace("#V-CODE#", verificationCode);
    verifyMailHtml = verifyMailHtml.replace(
      /#SUPPORT_MAIL#/g,
      process.env.SUPPORT_MAIL as string
    );

    const isUser = await User.findOne({ email });

    if (isUser) {
      isUser.emailVerificationCode = verificationCode;
      await isUser.save();
    } else {
      await User.create({
        email,
        emailVerificationCode: verificationCode,
      });
    }

    await sendMail("Email Verification", email, verifyMailHtml);
    // saving verification code

    res.status(200).send({
      message: `Verification code sent successfully to email address ${email}`,
    });
  } catch (error: any) {
    console.log("Error sending verification code ==> ", error);
    res.status(500).send({ error: error.message });
  }
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const username = firstName + "_" + lastName;

    if (email && password) {
      const hash = bcrypt.hash(
        password,
        10,
        async function (err: any, hash: any) {
          if (err) {
            console.log("Error ==> ", err.message);
            //throw new Error("Server_Error");
            return res.status(500).send({ error: err.message });
          } else {
            const user = await User.findOne({ email });
            if (!user) {
              return res.status(404).send({ error: "User not found" });
            }

            user.name = username;
            user.password = hash;

            await user.save();

            const secretKey = process.env.SECRET_KEY;
            const payload = {
              email,
            };
            jwt.sign(
              payload,
              secretKey,
              { algorithm: "HS256" },
              function (err: any, token: any) {
                if (err) {
                  console.log("Error ==> ", err.message);
                  //throw new Error("Something went wrong");
                  return res.status(500).send({ error: err.message });
                }

                const userCred = { username: user.name, email: user.email };

                return res
                  .status(200)
                  .send({ message: "Sign up successfull", token, userCred });
              }
            );
          }
        }
      );
    } else {
      //throw new Error("Missing_Credentials");
      return res.status(404).send({ error: "Credentials missing" });
    }
  } catch (error: any) {
    console.log("Error while signing up ==> ", error);
    return res
      .status(getErrorCode(error.message) | 500)
      .send({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, deviceToken } = req.body;
    if (email && password) {
      const user = await User.findOne({ email });

      if (user) {
        const secretKey = process.env.SECRET_KEY;
        const payload = {
          email,
        };

        if (user.pushWithFCM && deviceToken) {
          user.pushWithFCM.deviceToken = deviceToken;

          await user.save();
        }
        // password is 123
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          //throw new Error("Server_Error");
          return res.status(500).send({ error: "Unauthenticated" });
        }

        jwt.sign(
          payload,
          secretKey,
          { algorithm: "HS256" },
          function (err: any, token: any) {
            if (err) {
              console.log("Error ==> ", err.message);
              //throw new Error("Something went wrong");
              return res.status(500).send({ error: "Server error" });
            } else {
              //console.log("token ==> ", token);
              console.log("step 1");
              return res.status(200).send({
                message: "Login successfull",

                userCred: {
                  username: user.name,
                  email: user.email,
                  userId: user._id,
                  token,
                },
              });
            }
          }
        );
      } else {
        //throw new Error("User_Not_Found");
        return res.status(404).send({ error: "User not found" });
      }
    } else {
      //throw new Error("Missing_Credentials");
      return res.status(400).send({ error: "Missing_Credentials" });
    }
  } catch (error: any) {
    console.log("Error while signing up ==> ", error);
    return res
      .status(getErrorCode(error.message) | 500)
      .send({ error: error.message });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await User.findOne({ email });
    const isMatch = user?.emailVerificationCode === verificationCode;
    if (user && isMatch) {
      user.isVerified = true;
      await user.save();
      res.status(200).send({
        message: "Email has been verified successfully",
        status: "VERIFIED",
      });
    } else if (user && !isMatch) {
      res.status(401).send({
        message: "Email has not been verified",
        status: "NOT-VERIFIED",
      });
    } else {
      res
        .status(404)
        .send({ message: "User not found", status: "NOT-VERIFIED" });
    }
  } catch (error: any) {
    console.log("Error ==> ", error);
    res
      .status(getErrorCode(error.message) | 500)
      .send({ error: error.message });
  }
};

export const saveBiometricsPublicKey = async (req: Request, res: Response) => {
  try {
    const { email, publicKey } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      res.status(200).send({ message: "Ok" });
    } else {
      res.status(400).send({
        message:
          "No user has been found to be associated with the provided email.",
      });
    }
  } catch (error: any) {
    console.log("Error ==> ", error);
    res
      .status(500)
      .send({ message: "Something went wrong !", error: error.message });
  }
};

export const validateGoogleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken, email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];

    return res.status(200).send(payload);
  } catch (error: any) {
    res.status(500).send({ error: error.message });
  }
};
