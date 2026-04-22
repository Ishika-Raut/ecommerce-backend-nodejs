import mongoose from "mongoose";
import { accountStatus, role } from "../configs/enums/authEnum.js";


const authSchema = new mongoose.Schema({
    firstName: {
        type:String,
        required: true
    },
    lastName: {
        type:String,
        required: true
    },
    password: {
        type: String,
    },
    email: {
        type:String,
        unique: true
    },
    phone:{
        type: String,
        unique: true,
        sparse: true
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    accountStatus: {
        type: String,
        enum: accountStatus,
        default: accountStatus[0] //"Pending"
    },
    role: {
        type: String,
        enum: role,
        default: role[0] //"Customer"
    },
    provider: {
        type: String
    },
    providerId: {
        type: String
    },
    passwordResetToken: {
    type: String,
    default: null
    },
    passwordResetTokenExpiration: {
        type: Date,
        default: null
    },
    //refresh token is stored one per user --> single device.
    refreshToken: {
        type: String
    }
}, 
{
    timestamps: true
})

export const User = mongoose.model("User", authSchema);