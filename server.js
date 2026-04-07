import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";

import { connectDB } from "./src/configs/dbConfig.js";

const PORT = process.env.PORT;

connectDB();

app.listen(PORT, () => {
    console.log(`Server started at port: ${PORT}`);
})