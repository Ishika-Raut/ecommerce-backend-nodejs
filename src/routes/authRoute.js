import express from "express"
import { googleOAuthLogin, login, logout, register, sendOtp, verifyOtp } from "../controllers/authController.js";
import { validateData } from "../middlewares/validateData.js";
import { loginValidator, registerValidator, sendOtpValidator, verifyOtpValidator } from "../validators/authValidator.js";
import { authenticate } from "../middlewares/authenticate.js";
const authRoute = express.Router();

//no need of role- authorize here
authRoute.post("/register", validateData(registerValidator), register);
authRoute.post("/send-otp", validateData(sendOtpValidator), sendOtp);
authRoute.post("/verify", validateData(verifyOtpValidator), verifyOtp);
// authRoute.post("/verify-phone", validateData(verifyPhoneOtpValidator), verifyPhoneOtp);
authRoute.post("/login", validateData(loginValidator), login);
authRoute.post("/oauth-login", googleOAuthLogin);
authRoute.post("/logout", authenticate, logout);


// authRoute.post("/refresh-token", refreshAccessToken);

export default authRoute;