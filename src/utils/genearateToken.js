import jwt from "jsonwebtoken";

export const generateToken = ({payload, secret, expiresIn}) => {
    try 
    {
        const token = jwt.verify(payload, secret, { expiresIn });
        return token;
    } catch (error) {
        console.log("Generate token error", error);
        throw error;
    }
}