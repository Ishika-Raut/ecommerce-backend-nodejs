import Joi from "joi";

export const addAdminValidator = Joi.object({
    firstName: Joi.string().min(3).max(50).trim().required(),
    lastName: Joi.string().min(3).max(50).trim().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(8).required(),
});


export const updateAdminStatusValidator = Joi.object({
  email: Joi.string().email().required(),
  status: Joi.string().valid("Active", "Deactive").required(),
});