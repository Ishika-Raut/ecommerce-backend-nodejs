import crypto from "crypto";
import { Otp } from "../models/otpModel.js";
import { emailVerifyTemplate } from "../template/emailVerifyTemplate.js";
import { sendEamil } from "../services/sendEmailService.js";
import { sendSms } from "../services/sendSmsService.js";

export const sendOtp = async (userId, data, type) => {
    try 
    {
        const existingOtp = await Otp.findOne({ userId });
        console.log("existingOtp = ", existingOtp);
        //Generate 4-digit otp
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        //hash otp
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        //set expiry for otp - 5 minutes
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); 

        //Only ONE active OTP per user should exist at a time
        if (existingOtp) 
        {
            //Update Existing OTP
            existingOtp.otp = hashedOtp;
            existingOtp.otpExpiration = otpExpiration;
            existingOtp.otpType = type;
            await existingOtp.save();
        } 
        else 
        {
            //Create new OTP
            await Otp.create({
                userId,
                otp: hashedOtp,
                otpExpiration,
                otpType: type,
            });
        }
        console.log("type = ", type);
        if(type === "email")
        {
            // choose template to send email
            const html = emailVerifyTemplate(otp);
            console.log("html = ", html);
            //call send email service
            console.log("email data = ", data);
            await sendEamil(data, "User Email Verification", html);
            console.log("type === email");
        }
        else if(type === "sms")
        {
            console.log("phone data = ", data);
            // call send SMS service 
            await sendSms(data, otp);
             console.log("type === sms");
        }

    } catch (error) {
        console.log("Send otp error", error);
        throw error;
    }
}