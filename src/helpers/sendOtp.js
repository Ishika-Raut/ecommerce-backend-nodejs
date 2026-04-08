import crypto from "crypto";
import { Otp } from "../models/otpModel.js";
import { emailVerifiyTemplate } from "../template/emailVerifyTemplate.js";
import { sendEamil } from "../services/sendEmailService.js";

export const sendOtp = async (userId, email) => {
    try 
    {
        const existingOtp = await Otp.findOne({ userId });

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
            await existingOtp.save();
        } 
        else 
        {
            //Create new OTP
            await Otp.create({
                userId,
                otp: hashedOtp,
                otpExpiration
            });
        }

        // choose template to send email
        const html = emailVerifiyTemplate(otp);

        //call send email service
        await sendEamil(email, "User Email Verification", html);

    } catch (error) {
        console.log("Send otp error", error);
        throw error;
    }
}