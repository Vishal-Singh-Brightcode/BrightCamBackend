require('dotenv').config();
import { Request, Response } from 'express';
import User from '../../models/user.model';
import bcrypt from 'bcrypt';
import { getErrorCode, sendMail } from '../../utility';
import jwt from 'jsonwebtoken';
import otpGenerator from 'otp-generator';
import fs from 'fs/promises';

export const sendVerificationCode = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const verificationCode: string = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
        const filePath: string = process.env.VERIFICATION_MAIL_TEMP as string;
        const message = await fs.readFile(filePath, 'utf-8');
        const text1 = message.replace("#V-CODE#", verificationCode);
        const text2 = text1.replace("#SUPPORT_MAIL#", process.env.SUPPORT_MAIL as string);
        const transformedMessage = text2.replace("#SUPPORT_MAIL#", process.env.SUPPORT_MAIL as string);

        // saving verification code
        await User.create({
            email
        });

        await sendMail(email, transformedMessage);



        res.status(200).send({ message: `Verification code sent successfully to email address ${email}` });

    } catch (error: any) {
        console.log("Error sending verification code ==> ", error);
        res.status(500).send({ error: error.message })
    }
}
export const signUp = async (req: Request, res: Response) => {
    try {
        console.log("Request body", req.body);
        const { username, email, password } = req.body;

        if (email && password) {
            const hash = bcrypt.hash(password, 10, async function (err: any, hash: any) {
                if (err) {
                    console.log("Error ==> ", err.message)
                    throw new Error('Server_Error');
                } else {
                    const newUser = await User.create({ name: username, email, password: hash });
                    const secretKey = process.env.SECRET_KEY;
                    const payload = {
                        email
                    }
                    jwt.sign(payload, secretKey, { algorithm: 'RS256' }, function (err: any, token: any) {
                        if (err) {
                            console.log("Error ==> ", err.message);
                            throw new Error("Something went wrong");
                        }
                        console.log("token ==> ", token);
                        res.status(200).send({ message: "Sign up successfull", token });
                    });

                }
            });


        }
        else throw new Error("Missing_Credentials");


    } catch (error: any) {
        console.log("Error while signing up ==> ", error);
        res.status(getErrorCode(error.message) | 500).send({ error: error.message })
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (email && password) {
            console.log("Email ==> ", email, "Password ==> ", password, "  at Login");

            const user = await User.findOne({ email });
            if (user) {
                const secretKey = process.env.SECRET_KEY;
                const payload = {
                    email
                }

                bcrypt.compare(password, user.password, function (err: any, result: any) {
                    if (err) {
                        throw new Error("Server_Error");
                    }
                    else if (!result) {
                        throw new Error("Unauthenticated");
                    }
                });

                jwt.sign(payload, secretKey, { algorithm: 'RS256' }, function (err: any, token: any) {
                    if (err) {
                        console.log("Error ==> ", err.message);
                        throw new Error("Something went wrong");
                    }
                    console.log("token ==> ", token);
                    res.status(200).send({ message: "Login successfull" });
                });

            } else {
                throw new Error('User_Not_Found');
            }

        } else throw new Error("Missing_Credentials");

    } catch (error: any) {
        console.log("Error while signing up ==> ", error);
        res.status(getErrorCode(error.message) | 500).send({ error: error.message })
    }
}

export const verifyOTP = async (req: Request, res: Response) => {
    try {
        res.status(200).send({ message: "Email verified successfully", status: 'VERIFIED' });
    } catch (error: any) {
        console.log('Error ==> ', error);
        res.status(getErrorCode(error.message) | 500).send({ error: error.message })
    }
}


