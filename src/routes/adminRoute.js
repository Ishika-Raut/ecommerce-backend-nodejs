import express from "express"
import { authorize } from "../middlewares/authorize.js";
import { authenticate } from "../middlewares/authenticate.js";
import { addAdmin, approveOrRejectRequest, updateAdminStatus } from "../controllers/adminController.js";
import { validateData } from "../middlewares/validateData.js";
import { addAdminValidator, updateAdminStatusValidator } from "../validators/adminValidator.js";

const adminRoute = express.Router();

adminRoute.post("/add", validateData(addAdminValidator), authenticate, authorize("SuperAdmin"), addAdmin);
adminRoute.patch("/account-status", validateData(updateAdminStatusValidator), authenticate, authorize("SuperAdmin"), updateAdminStatus);
adminRoute.post("/request/:id", authenticate, authorize("Admin"), approveOrRejectRequest)

// authRoute.post("/refresh-token", refreshAccessToken);

export default adminRoute;