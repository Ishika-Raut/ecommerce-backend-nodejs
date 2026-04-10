import mongoose from "mongoose";

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
    role: {
        type: String,
        enum: ["USER", "SELLER", "ADMIN"],
        default: "USER"
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