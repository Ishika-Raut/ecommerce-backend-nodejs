import { User } from "../models/authModel.js";
import bcrypt from "bcrypt";
import { adminAccountTemplate } from "../template/adminAccountTemplate.js";
import { ApiError } from "../utils/apiError.js";
import { sendEamil } from "../services/sendEmailService.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";
import { ApiResponse } from "../utils/apiResponse.js";

export const addAdmin = async (req, res, next) => {
    try 
    {
        const { name, email, password } = req.body;
        const user = await User.findOne({email});
        if(user && user.role === "Admin")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is already a Admin!`);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newAdmin = await User.create({
            name, 
            email,
            password: hashedPassword,
            isEmailVerified: true, 
            role: "Admin",
        });

        const html = adminAccountTemplate(email, password);
        await sendEamil(email, "Admin Account Created", html);

        return ApiResponse(res, HTTP_STATUS.CREATED, `Admin is created!`,
            {
                name: newAdmin.name,
                email: newAdmin.email
            }
        );
    } 
    catch (error) 
    {
        console.log("Add Admin error", error);
        next(error);
    }
}


export const deactivateAdmin = async (req, res, next) => {
    try 
    {
        const { email } = req.body;
        const user = await User.findOne({email});
        if(!user || user.role !== "Admin")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is not an Admin!`);
        }
        user.isActive = false;
        await user.save();

        return ApiResponse(res, HTTP_STATUS.CREATED, `Admin is deactivated!`,
            {
                email: user.email
            }
        );
    } 
    catch (error) 
    {
        console.log("Deactivate Sub-admin error", error);
        next(error);
    }
}