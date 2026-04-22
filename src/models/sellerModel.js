import mongoose from "mongoose";

const status = ["Pending", "Rejected", "Approved"];

const sellerSchema = mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
    businessName: {
        type: String,
        required: true,
        unique: true,  //one seller profile for one user
    },
    address: {
        city: {
            type: String,
        },
        state: {
            type: String,
        },
        pincode: {
            type: String,
        },
    },
    status: {
        type: String,
        enum: status,
        default: status[0] //"Pending"
    }
},
{
    timestamps: true
});

export const Seller = mongoose.model("Seller", sellerSchema);