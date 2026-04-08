import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        //index: true
    },
    otp: {
        type: String,
        required: true
    },
    otpExpiration: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL - MongoDB will automatically remove expired OTPs
    }
}, 
{
    timestamps: true
});

export const Otp = mongoose.model("Otp", otpSchema);