import { Router } from "express";
import {
  login,
  saveBiometricsPublicKey,
  sendVerificationCode,
  signUp,
  validateGoogleLogin,
  verifyOTP,
} from "../../controllers/auth";

export const authRouter = Router();

authRouter.post("/send-verification-code", sendVerificationCode);

authRouter.post("/sign-up", signUp);

authRouter.post("/login", login);

authRouter.post("/verify-code", verifyOTP);

authRouter.post("/save-biometrics-pub-key", saveBiometricsPublicKey);

authRouter.post("/validate-user", validateGoogleLogin);
