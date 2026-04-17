import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import { User } from "../models/authModel.js";
import bcrypt from "bcrypt";
import { adminAccountTemplate } from "../template/adminAccountTemplate.js";
import { sendEamil } from "../services/sendEmailService.js";

//one-time seed script - This avoids hardcoding credentials, runs only when you want it
//Run once per environment (local).
export const createAdmin = async () => {
    try 
    {
        await mongoose.connect(process.env.MONGO_URL);
        
        //check if admin exist
        const isAdminExist = await User.findOne({ 
            role: "SuperAdmin", 
            email: process.env.ADMIN_EMAIL,
            //phone: process.env.ADMIN_PHONE,
        });
        if(isAdminExist)
        {
            // do nothing if admin exist - jsut close db conn and return
            await mongoose.connection.close();
            return;
        }

        const password = process.env.ADMIN_PASSWORD;
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            firstName: "Super", 
            lastName: "Admin",
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            isEmailVerified: true,
            isPhoneVerified: true,
            role: "SuperAdmin", //must match with it schema enum
            accountStatus: "Active"
        });

        const html = adminAccountTemplate(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
        await sendEamil(process.env.ADMIN_EMAIL, "Super Admin Account Created",html);
    } 
    catch (error) 
    {
        console.log("Create super admin error", error);
        throw error;
    }
    finally
    {
        await mongoose.connection.close();
        process.exit();
    }
}

createAdmin();