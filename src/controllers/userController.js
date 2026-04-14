import { User } from "../models/authModel.js";
import { Seller } from "../models/sellerModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";


export const requestForSeller = async (req, res, next) => {
    try 
    {
        const userId = req.user.id;  // extract user._id from incoming token
        // authenticate middleware passes token to controller 
        
        const { businessName, address } = req.body;
        const { city, state, pincode } = address;

        //find user
        const user = await User.findById(userId);
        if (!user) {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "No user found!");
        }

        // already seller check
        if (user.role === "Seller") {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "You are already a seller");
        }

        // already pending request check
        const existingRequest = await Seller.findOne({
            userId,
            status: "pending",
        });

        if (existingRequest) 
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Request already pending");
        }

        await Seller.create({
            userId,
            businessName,
            address: {
                city,
                state,
                pincode
            },
        });
        return ApiResponse(res, HTTP_STATUS.CREATED, 
            "Your request has been sent to admin!",
            {
                name: user.name,
                email: user.email
            },
        );
    }   
    catch (error) 
    {
        console.log("Request for Seller error", error);
        next(error);
    }
}