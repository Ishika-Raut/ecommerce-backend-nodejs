import jwt from "jsonwebtoken";

export const generateToken = ({payload, secret, expiresIn}) => {
    try 
    {
        const token = jwt.sign(payload, secret, { expiresIn });
        return token;
    } catch (error) {
        console.log("Generate token error", error);
        throw error;
    }
}