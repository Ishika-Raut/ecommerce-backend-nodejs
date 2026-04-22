import express from "express"; 
import cookieParser from "cookie-parser";
import authRoute from "./routes/authRoute.js";
import { globalErrorHandler } from "./middlewares/globalErrorHandler.js";
import adminRoute from "./routes/adminRoute.js";
import userRoute from "./routes/userRoute.js";
import productRoute from "./routes/productRoute.js";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/user", userRoute);
app.use("/api/seller", productRoute);


app.use(globalErrorHandler)

export default app;