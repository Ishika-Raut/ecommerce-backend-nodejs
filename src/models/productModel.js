import mongoose from "mongoose";
import { productStatus } from "../configs/enums/productEnum.js";

const productSchema = mongoose.Schema({

    sellerId: {
        type:String,
        required: true
    },
    productName: {
        type:String,
    },
    brandName: {
        type:String,
    },
    price: {
        type:Number,
    },
    stock: {
        type:Number,
    },
    category: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true
    }],
    description: {
        type:String,
    },
    images: [{
        type:String,
        default: [] //empty array
    }],
    productStatus: {
        type: String,
        enum: productStatus,
        default: productStatus[0] //"draft"
    },
    isDeleted: {
        type: Boolean,
        default: false,
    }
},
{
    timestamps: true
});

export const Product = mongoose.model("Product", productSchema);