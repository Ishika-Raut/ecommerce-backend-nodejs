import { User } from "../models/authModel.js";
import bcrypt from "bcrypt";
import { adminAccountTemplate } from "../template/adminAccountTemplate.js";
import { ApiError } from "../utils/apiError.js";
import { sendEamil } from "../services/sendEmailService.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Seller } from "../models/sellerModel.js";
import { accountStatus } from "../configs/enums/authEnum.js";
import { Category } from "../models/categoryModel.js";

export const addAdmin = async (req, res, next) => {
    try 
    {
        const { firstName, lastName, email, phone, password } = req.body;
        const user = await User.findOne({email});
        if(user && user.role === "Admin")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is already a Admin!`);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newAdmin = await User.create({
            firstName, 
            lastName,
            email,
            phone,
            password: hashedPassword,
            isEmailVerified: true,
            isPhoneVerified: true, 
            role: "Admin",
            accountStatus: "Active"
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


export const updateAdminStatus = async (req, res, next) => {
    try 
    {
        const { email, status } = req.body;
        const user = await User.findOne({email});
        if(!user || user.role !== "Admin")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is not an Admin!`);
        }
        
        if(user.accountStatus === "Active" && status === "Deactive")
        {
            user.accountStatus = status
            await user.save();
            return ApiResponse(res, HTTP_STATUS.CREATED, `Admin is deactivated!`,
                {
                     email: user.email
                });
        } 
        else 
        {
             user.accountStatus = status
            await user.save();
            return ApiResponse(res, HTTP_STATUS.CREATED, `Admin is Activated!`,
            {
                email: user.email
            }
        );
        }
    } 
    catch (error) 
    {
        console.log("Deactivate Sub-admin error", error);
        next(error);
    }
}


//Approve or Reject the request
export const  approveOrRejectRequest = async (req, res, next) => {
    try 
    {
        const requestId = req.params.id;
        const { requestStatus } = req.query;
       
        const sellerRequest = await Seller.findById(requestId);
        if(!sellerRequest)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `No seller request for this id!`);
        }
        
        sellerRequest.status = requestStatus;
        await sellerRequest.save();

        if(requestStatus == "Approved")
        {
            const userId = sellerRequest.userId;

            const user = await User.findById(userId);
            if(!user)
            {
                return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user exist!`);
            }

            user.role = "Seller";
            await user.save();
        }
        return ApiResponse(res, HTTP_STATUS.OK, `Request for Seller is fullfilled!`);
    } 
    catch (error) 
    {
        console.log("Approve request error", error);
        next(error);
    }
}



export const addCategory = async (req, res, next) => {
    try 
    {
        const { categoryName } = req.body;

        const category = Category.findOne({categoryName});
        if(!category)
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${categoryName} already exist!`);
        }
        
        const id = req.user.id;
        await Category.create({
            categoryName,
            adminId: id,
        })
        return ApiResponse(res, HTTP_STATUS.CREATED, `Category added!`);

    } catch (error) {
        console.log("Add Category error", error);
        next(error);
    }
}


