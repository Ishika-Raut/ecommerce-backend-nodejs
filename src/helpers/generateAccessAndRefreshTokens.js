import { generateToken } from "../utils/generateToken.js";

export const generateAccessAndRefreshTokens = async (user) => {
    try 
    {       
        const newAccessToken = generateToken({
            payload: { id: user._id, email: user.email },
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        });

        const newRefreshToken = generateToken({
            payload: { id: user._id },
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        });

        return {
            newAccessToken,
            newRefreshToken
        }
    } catch (error) {
        console.log("Generate Access And Refresh Tokens error:", error);
        throw error;
    }
}