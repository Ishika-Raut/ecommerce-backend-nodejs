import express from "express"
import { register } from "../controllers/authController.js";
import { validateData } from "../middlewares/validateData.js";
import { registerValidator } from "../validators/authValidator.js";
const authRoute = express.Router();

authRoute.post("/register", validateData(registerValidator), register);


export default authRoute;