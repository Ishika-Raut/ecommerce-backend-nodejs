import Joi from "joi";

export const registerValidator = Joi.object({
    firstName: Joi.string().min(3).max(50).trim().required(),
    lastName: Joi.string().min(3).max(50).trim().required(),
    password: Joi.string().min(8).required(),
});


export const sendOtpValidator = Joi.object({
    userId: Joi.string().required(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    type: Joi.string().valid("email", "sms").required(),
});


export const verifyOtpValidator = Joi.object({
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    otp: Joi.string().length(4).pattern(/^\d+$/).required(),  // Length is 4 and Must be digits only
    type: Joi.string().valid("email", "sms").required(),
});


export const loginValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});


export const requestForPasswordResetValidator = Joi.object({
  email: Joi.string().email().required(),
});


export const resetPasswordValidator = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
  confirmPassword: Joi.string().min(8).required()
});




export const sellerRequestValidator = Joi.object({
    businessName: Joi.string().min(5).max(50).trim().required(),
    address: Joi.object({
        city: Joi.string().min(2).max(50).trim().required(),
        state: Joi.string().min(2).max(50).trim().required(),
        pincode: Joi.string().pattern(/^[0-9]{6}$/).required(),   // Indian pincode validation
    }).required(),
});


