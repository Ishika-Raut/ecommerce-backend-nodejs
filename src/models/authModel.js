import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
    namd:{
        type:String
    },
    email:{
        type:String
    }
})

export const User = mongoose.model("User",authSchema);