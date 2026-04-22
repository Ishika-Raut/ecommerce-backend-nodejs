import express from "express"
import { addProduct, deleteProduct, updateProduct, uploadImage } from "../controllers/productController.js";
import { validateData } from "../middlewares/validateData.js";
import { addProductValidator, updateProductValidator } from "../validators/productValidator.js";
import { authorize } from "../middlewares/authorize.js";
import { authenticate } from "../middlewares/authenticate.js";
import upload from "../services/uploadImageService.js";


const productRoute = express.Router();
productRoute.use(authenticate);


productRoute.post("/upload-images", upload.array("images", 5), uploadImage);
productRoute.post("/add-product", validateData(addProductValidator), upload.array("image", 5), authorize("Seller"), addProduct);
productRoute.post("/update/:id", validateData(updateProductValidator), upload.array("image", 5), authorize("Seller"), updateProduct);
productRoute.delete("/delete/:id", authorize("Seller"), deleteProduct);


export default productRoute;