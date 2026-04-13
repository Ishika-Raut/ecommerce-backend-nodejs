import mongoose from "mongoose";

const role = ["Customer", "Seller", "SuperAdmin", "Admin"]

const authSchema = new mongoose.Schema({
    name: {
        type:String,
        required: true
    },
    email: {
        type:String,
        required: true,
        unique: true
    },
    password: {
        type: String,

    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isActive:
    {
        type: Boolean,
        default: true
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
    //refresh token is stored one per user --> single device.
    refreshToken: {
        type: String
    }
}, 
{
    timestamps: true
})

export const User = mongoose.model("User", authSchema);