import { productStatus } from "../configs/enums/productEnum.js";
import Joi from "joi";

import mongoose from "mongoose";

const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid ObjectId");
  }
  return value;
};

export const addProductValidator = Joi.object({
    sellerId: Joi.string().required().trim(),

    productName: Joi.string().trim().optional(),

    brandName: Joi.string().trim().optional(),

    price: Joi.number().min(0).optional(),

    stock: Joi.number().integer().min(0).optional(),

    category: Joi.array().items(Joi.string().custom(objectId, "ObjectId validation")).min(1).required(),

    description: Joi.string().allow("").optional(),

    images: Joi.array().items(Joi.string()).default([]),

    productStatus: Joi.string().valid(...productStatus).default(productStatus[0]),
});



export const updateProductValidator = Joi.object({
    sellerId: Joi.string().optional(),

    productName: Joi.string().trim().optional(),

    brandName: Joi.string().trim().optional(),

    price: Joi.number().min(0).optional(),

    stock: Joi.number().integer().min(0).optional(),

    category: Joi.array().items(Joi.string().custom(objectId, "ObjectId validation")).min(1).optional(),  

    description: Joi.string().allow("").optional(),

    images: Joi.array().items(Joi.string()).optional(),

    productStatus: Joi.string().valid(...productStatus).optional(),
});