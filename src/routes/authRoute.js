import express from "express"
import { login, logout, register, verifyOtp } from "../controllers/authController.js";
import { validateData } from "../middlewares/validateData.js";
import { loginValidator, registerValidator, verifyOtpValidator } from "../validators/authValidator.js";
import { authenticate } from "../middlewares/authenticate.js";
const authRoute = express.Router();

authRoute.post("/register", validateData(registerValidator), register);
authRoute.post("/verify-otp", validateData(verifyOtpValidator), verifyOtp);
authRoute.post("/login", validateData(loginValidator), login)
authRoute.post("/logout", authenticate, logout);
// authRoute.post("/refresh-token", refreshAccessToken);

export default authRoute;