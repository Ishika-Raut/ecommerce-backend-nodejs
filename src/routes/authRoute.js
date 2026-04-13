import express from "express"
import { googleOAuthLogin, login, logout, register, verifyOtp } from "../controllers/authController.js";
import { validateData } from "../middlewares/validateData.js";
import { loginValidator, registerValidator, updateAdmin, verifyOtpValidator } from "../validators/authValidator.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { addAdmin, deactivateAdmin } from "../controllers/adminController.js";
const authRoute = express.Router();

authRoute.post("/register", validateData(registerValidator), authorize("Customer", "Seller"), register);
authRoute.post("/verify-otp", validateData(verifyOtpValidator), authorize("Customer", "Seller"), verifyOtp);
authRoute.post("/login", validateData(loginValidator), login);
authRoute.post("/oauth-login", authorize("Customer", "Seller"), googleOAuthLogin);
authRoute.post("/logout", authenticate, logout);

authRoute.post("/add", validateData(registerValidator), authenticate, authorize("SuperAdmin"), addAdmin);
authRoute.patch("/deactivate", validateData(updateAdmin), authenticate, authorize("SuperAdmin"), deactivateAdmin);

// authRoute.post("/refresh-token", refreshAccessToken);

export default authRoute;