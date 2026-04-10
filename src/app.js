import express from "express"; 
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);



app.use(globalErrorHandler)

export default app;