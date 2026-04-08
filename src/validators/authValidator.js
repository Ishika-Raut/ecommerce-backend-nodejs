import Joi from "joi";

export const registerValidator = Joi.object({
    name: Joi.string().min(5).max(50).trim().required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().min(8).required()
});