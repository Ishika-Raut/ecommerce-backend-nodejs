import { Category } from "../models/categoryModel.js";
import { Product } from "../models/productModel.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";


export const addProduct = async (req, res, next) => {
    try 
    {
        const { productName, brandName, price, stock, category, description, images, action } = req.body;
        console.log("images = ", images);
        const id = req.user.id

        // parse category - for multi-part form
        let parsedCategory = category;

        try 
        {
            // if category is "string" --> convert it in array otherwise keep it as it is
            parsedCategory = typeof category === "string" ? JSON.parse(category) : category;
        } 
        catch (error) 
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Invalid category format");
        }

        if (parsedCategory) 
        {
            if (!Array.isArray(parsedCategory)) 
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Category must be an array!");
            }
            if (parsedCategory.length === 0) 
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "At least one category required!");
            }
        }

        //check category in db
        const categories = await Category.find({_id: { $in: parsedCategory}}); //array of ids traverse
        if(categories.length !== parsedCategory.length)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "Some categories not found!");
        }

        // validate images
        if (images && !Array.isArray(images)) 
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Images must be an array!");
        }

        const safeImages = images || [];

        const isCompleted = 
            productName && 
            brandName && 
            price !== undefined && 
            stock !== undefined && 
            description && 
            safeImages.length > 0;

        let productStatus = "Draft";
        
        if(action === "Publish")
        {           
            if (!isCompleted) 
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required to publish product");
            }
            productStatus = "Active";   
        }
        
        await Product.create({
            sellerId: id,
            productName,
            brandName,
            price,
            stock,
            category: parsedCategory,
            description,
            images: safeImages,
            productStatus
        });

        return ApiResponse(res, HTTP_STATUS.CREATED, `Product added!`);

    } catch (error) {
        console.log("Add Product error", error);
        next(error);
    }
}



export const updateProduct = async (req, res, next) => {
  try 
  {
        const { id } = req.params; 
        const { productName, brandName, price, stock, category, description, action, images } = req.body;

        const sellerId = req.user.id;

        const product = await Product.findOne({ _id: id, sellerId, isDeleted: false });
        if (!product) 
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "Product not found");
        }
        
        if (category !== undefined) 
        {
            try 
            {
                parsedCategory = typeof category === "string" ? JSON.parse(category) : category;
            } 
            catch (error) 
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Invalid category format");
            }

            if (parsedCategory) 
            {
                if (!Array.isArray(parsedCategory)) {
                    parsedCategory = [parsedCategory];
                }

                if (parsedCategory.length === 0) {
                    return ApiError(res, HTTP_STATUS.BAD_REQUEST, "At least one category required!");
                }

                const categories = await Category.find({ _id: { $in: parsedCategory } });

                if (categories.length !== parsedCategory.length) {
                    return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Some categories not found!");
                }

                product.category = parsedCategory;
            }
        }
        if (images !== undefined) 
        {
            if (!Array.isArray(images)) {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Images must be an array");
            }

            product.image = images;    // replaces images in db
            // product.image = [...product.image, ...images];   // append images in db
        }

        // update fields only if provided
        if (productName !== undefined) 
            product.productName = productName;
        if (brandName !== undefined) 
            product.brandName = brandName;
        if (price !== undefined) 
            product.price = price;
        if (stock !== undefined) 
            product.stock = stock;
        if (description !== undefined) 
            product.description = description;

       
        const isCompleted =
            product.productName &&
            product.brandName &&
            product.price !== undefined &&
            product.stock !== undefined &&
            product.description &&
            product.image &&
            product.image.length > 0;

        if (action === "Publish") 
        {
            if (!isCompleted) {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, "All fields are required to publish product");
            }
            product.productStatus = "Active";
        } 
        else 
        {
            // if incomplete --> always Draft
            product.productStatus = isCompleted ? product.productStatus : "Draft";
        }

        await product.save();

        return ApiResponse(res, HTTP_STATUS.OK, "Product updated successfully");
    } 
    catch (error) 
    {
        console.log("Update Product error", error);
        next(error);
    }
};



export const uploadImage = async (req, res, next) => {
    try 
    {
        if (!req.files || req.files.length === 0) 
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "No files uploaded!");
        }

        // Extract file paths
        // req.files - multiple uploaded files coming from multer   
        // ?. - optional chaining - If req.files exists --> run .map(), if not exist(undefined) --> return empty array []
        // .map(file => file.path) - from each uploaded file extracts only file path 
        const imageUrls = req.files?.map(file => file.path) || [];

       return ApiResponse(res, HTTP_STATUS.OK, "Images uploaded!", imageUrls);
    } 
    catch (error) 
    {
        console.log("Upload image error", error);
        next(error);
    }
};



export const deleteProduct = async (req, res, next) => {
    try 
    {
        const { id } = req.params;
        const sellerId = req.user.id;

        const product = await Product.findOne({ _id: id, sellerId });

        if (!product) {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "Product not found");
        }

        product.isDeleted = true;
        await product.save();

        return ApiResponse(res, HTTP_STATUS.OK, "Product deleted (soft delete)");
    } 
    catch (error) 
    {
        console.log("Delete Product error", error);
        next(error);
    }
};



