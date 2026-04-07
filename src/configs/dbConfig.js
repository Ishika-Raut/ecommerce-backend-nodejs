import mongoose from "mongoose";

export const connectDB = async () => {
    try 
    {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("MongoDB connected done!");
    } 
    catch (error) 
    {
        console.log("MongoDB connect error", error);
        process.exit(1);
    }
}

