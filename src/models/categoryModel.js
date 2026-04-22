import mongoose from "mongoose";

const categorySchema = mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true, 
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true, 
    },
},
{
    timestamps: true
});

export const Category = mongoose.model("Category", categorySchema);