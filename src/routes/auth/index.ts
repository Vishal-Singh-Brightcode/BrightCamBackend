import { Router } from "express";
import { login, sendVerificationCode, signUp, verifyOTP } from "../../controllers/auth";

export const authRouter = Router();

authRouter.post('/send_verification_code', sendVerificationCode);

authRouter.post('/sign-up', signUp);

authRouter.post('/login', login);

authRouter.post('/verify-code', verifyOTP);


