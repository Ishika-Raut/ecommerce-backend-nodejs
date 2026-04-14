import Joi from "joi";

export const registerValidator = Joi.object({
    name: Joi.string().min(5).max(50).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).required()
});


export const verifyOtpValidator = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(4).pattern(/^\d+$/).required()  // Length is 4 and Must be digits only
});


export const loginValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});


export const updateAdminValidator = Joi.object({
  email: Joi.string().email().required(),
});


export const sellerRequestValidator = Joi.object({
    businessName: Joi.string().min(5).max(50).trim().required(),
    address: Joi.object({
        city: Joi.string().min(2).max(50).trim().required(),
        state: Joi.string().min(2).max(50).trim().required(),
        pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),   // Indian pincode validation
    }).required(),
});