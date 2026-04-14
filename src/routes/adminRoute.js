import express from "express"
import { registerValidator, updateAdminValidator } from "../validators/authValidator.js";
import { authorize } from "../middlewares/authorize.js";
import { authenticate } from "../middlewares/authenticate.js";
import { addAdmin, approveOrRejectRequest, deactivateAdmin } from "../controllers/adminController.js";
import { validateData } from "../middlewares/validateData.js";

const adminRoute = express.Router();

adminRoute.post("/add", validateData(registerValidator), authenticate, authorize("SuperAdmin"), addAdmin);
adminRoute.patch("/deactivate", validateData(updateAdminValidator), authenticate, authorize("SuperAdmin"), deactivateAdmin);
adminRoute.post("/request/:id", authenticate, authorize("Admin"), approveOrRejectRequest)

// authRoute.post("/refresh-token", refreshAccessToken);

export default adminRoute;