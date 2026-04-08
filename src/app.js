import express from "express"; 
import authRoute from "./routes/authRoute.js";
import { globalErrorHandler } from "./middlewares/gloabalErrorHandler.js";


const app = express();

app.use(express.json());
app.use("/api/auth", authRoute);



app.use(globalErrorHandler)

export default app;