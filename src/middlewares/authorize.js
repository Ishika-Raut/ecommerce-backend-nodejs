import { ApiError } from "../utils/apiError.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";

//... automatically takes and coverts parameters in array = ["param1", "param2", ---]
export const authorize = (...roles) => {
    return (req, res, next) => {
        // user role is extracted from token (coming from authenticate middleware)

        const role = req.user.role;
        if(!roles.includes(role))
        {
            return ApiError(res, HTTP_STATUS.FORBIDDEN, "Access Denied!");
        }
        next();
    }
}