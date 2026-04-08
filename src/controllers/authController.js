import bcrypt from "bcrypt";
import { User } from "../models/authModel.js";
import { ApiError } from "../utils/apiError.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";
import { sendOtp } from "../helpers/sendOtp.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const register = async (req, res, next) =>   {
    try 
    {
        const { name, email, password } = req.body;
        const user = await User.findOne({email});
        // if(user)
        // {
        //     return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is already registered!`);
        // }
        //Case 1- User exist and verified
        if(user && user.isEmailVerified)
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is already registered and verified!`);
        }

        //case 2- User exist but not verified
        if(user && !user.isEmailVerified)
        {
            await sendOtp(user._id, user.email);
            return ApiResponse(res, HTTP_STATUS.OK, `OTP is sent on ${email}`);
        }

        //case 3- User does not exist and not  verified
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name, 
            email,
            password: hashedPassword,
            isEmailVerified: false, 
        })

        await sendOtp(newUser._id, email);

        return ApiResponse(res, HTTP_STATUS.CREATED, `User is registered and OTP sent on email: ${email}`,
            {
                name: newUser.name,
                email: newUser.email
            }
        );
    } catch (error) {
        console.log("Register user error", error);
        next(error);
    }
}



