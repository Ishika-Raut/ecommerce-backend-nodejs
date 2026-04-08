import { ApiError } from "../utils/apiError.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";

//This method takes Joi Schema  - registerValidation, loginValidation, etc
export const validateData = (schema) => (req, res, next) => {

    //schema.validate() - built in method 
    //req.body - data sent by client
    //error - contains validn error, if any
    //value - contains clean and validated data
    const {error, value} = schema.validate(
        req.body,
        {
            // stops validn at first error - to show only 1st error
            abortEarly: true,  
            // remove extra fields that are present in model but not present in registerValidation schema
            stripUnknown: true  
        }
    );

    if(error)
    {
         //error.details[0].message - Extract first error message
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, error.details[0].message);
    }
    // replace req.body with cleaned data
    req.body = value;

    next();
}