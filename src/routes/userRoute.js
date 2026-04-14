import express from "express"
import { requestForSeller } from "../controllers/userController.js";
import { sellerRequestValidator } from "../validators/authValidator.js";
import { authorize } from "../middlewares/authorize.js";
import { authenticate } from "../middlewares/authenticate.js";
import { validateData } from "../middlewares/validateData.js";


const userRoute = express.Router();
userRoute.use(authenticate);

userRoute.post("/request-seller", validateData(sellerRequestValidator), authorize("Customer"), requestForSeller);

export default userRoute;