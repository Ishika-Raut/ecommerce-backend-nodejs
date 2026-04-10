import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/authModel.js";
import { ApiError } from "../utils/apiError.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";
import { sendOtp } from "../helpers/sendOtp.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Otp } from "../models/otpModel.js";
import { generateAccessAndRefreshTokens } from "../helpers/generateAccessAndRefreshTokens.js";
import { generateToken } from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";


export const register = async (req, res, next) =>   {
    try 
    {
        const { name, email, password } = req.body;
        const user = await User.findOne({email});
        
        //Case 1- User exist and verified
        if(user && user.isEmailVerified)
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, `${email} is already registered and verified!`);
        }

        //case 2- User exist but not verified
        if(user && !user.isEmailVerified)
        {
            await sendOtp(user._id, user.email);
            return ApiResponse(res, HTTP_STATUS.OK, `OTP is sent on ${email}`);
        }

        //case 3- User does not exist and not  verified
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name, 
            email,
            password: hashedPassword,
            isEmailVerified: false, 
        })

        await sendOtp(newUser._id, email);

        return ApiResponse(res, HTTP_STATUS.CREATED, `User is registered and OTP sent on email: ${email}`,
            {
                name: newUser.name,
                email: newUser.email
            }
        );
    } catch (error) {
        console.log("Register user error", error);
        next(error);
    }
}



export const verifyOtp = async (req, res, next) => {
    try 
    {
        const { email, otp} = req.body;
        //find user
        const user = await User.findOne({email});
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user registered with email: ${email}`);
        }
        //find otp for user
        const existOtp = await Otp.findOne({userId: user._id});
        if (!existOtp) 
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "OTP not found");
        }
    // Check OTP expiration
    // user.otpExpiration time - 10:35
    // new Date() - gives current date and time - 10:36
    // 10:36 > 10:35 => true - OTP expired!
    if (!existOtp.otpExpiration || new Date() > existOtp.otpExpiration) 
    {
        return ApiError(res, HTTP_STATUS.BAD_REQUEST, "OTP expired");
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== existOtp.otp)
    {
       return ApiError(res, HTTP_STATUS.NOT_FOUND, "Invalid OTP!");
    }

    user.isEmailVerified = true;
    await user.save();

    //delete otp after verify
    await Otp.deleteOne({ _id: existOtp._id }); 

    return ApiResponse(res, HTTP_STATUS.OK, "OTP verified successfully");

    } catch (error) {
        console.log("Verify otp error", error);
        next(error);
    }
}



export const login = async (req, res, next) => {
    try 
    {
        const { email, password } = req.body;
        const user = await User.findOne({email});
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user registered with email: ${email}`);
        }
        if(!user.isEmailVerified)
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Your email is not verified!`);
        }
        const isPasswordMatched = bcrypt.compare(password, user.password);
        if(!isPasswordMatched)
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid Password!");
        }

        const accessToken = generateToken({
            payload: {id: user._id, email: user.email},
            secret: process.env.ACCESS_TOKEN_SECRET,
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        });

        const refreshToken = generateToken({
            payload: {id: user._id},
            secret: process.env.REFRESH_TOKEN_SECRET,
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })

        // Note: Currently, refreshToken is one per user, this allows single device login right now.
        // so multiple devices login would overwrite the previous refreshToken.
        user.refreshToken = refreshToken;

        await user.save();

        // store refreh token in HTTP cookie only
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true, // Prevents JS from accessing cookie. Protects against XSS (Cross-Site Scripting) attacks.
            secure: true, // Cookie will only be sent over HTTPS. Won’t work on plain HTTP
            sameSite: "Strict", // Cookie is sent only when request originates from same site
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS),
        });

        return ApiResponse(res, HTTP_STATUS.OK, 
            "User logged in successfully!",
            {
                name: user.name,
                email: user.email
            },
            { accessToken }   // send access token in authorization header
        );
    } catch (error) {
        console.log("Login user error", error);
        next(error);
    }
}



export const logout = async (req, res, next) => {
    try 
    {
        const oldRefreshToken = req.cookies.refreshToken;
        console.log(req.cookies.refreshToken);
        if (!oldRefreshToken) 
        {
            return ApiResponse(res, HTTP_STATUS.OK, "User already logged out!");
        }

        const user = await User.findOne({ refreshToken: oldRefreshToken });
        if(!user)
        { 
            //Token not found --> treat as already logged out
            res.clearCookie("refreshToken", {
                httpOnly: true,
                secure: true,
                sameSite: "Strict"
            });
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `User does not found!`);
        } 

        user.refreshToken = null;
        await user.save();

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "Strict"
        });

        return ApiResponse(res, HTTP_STATUS.OK, "User logged out successfully");
    } catch (error) {
        console.log("Logout user error", error);
        next(error);
    }
}



export const refreshAccessToken = async (req, res, next) => {
    try 
    {
        const oldRefreshToken = req.cookies.refreshToken;

        if (!oldRefreshToken)
        { 
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Refresh token missing");
        }
        const user = await User.findOne({ refreshToken: oldRefreshToken });
        if (!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "No user found!");
        }
        // Verify old refresh token - async(callback) version - dangerous
        // Why - Token might be invalid still further code execution continues 
        // jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        //     if (err || decoded.id !== user._id.toString())
        //         return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
        // }); //return inside callback does NOT stop outer function

       // Verify old refresh token - sync version - Execution stops immediately if error occurs
        let decoded;
        try 
        {
            decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
        } catch (err) {
            return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid or expired refresh token");
        }

        if (decoded.id !== user._id.toString()) {
            return ApiError(res, HTTP_STATUS.FORBIDDEN, "Invalid refresh token");
        }

        // Rotate tokens for this device
        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        // Update refresh token cookie
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "Strict",
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS)
        });

        // Send new access token in response
        return ApiResponse(res, HTTP_STATUS.OK, "New access and refresh tokens generated successfully", null, 
            {
                accessToken: newAccessToken
            }
        );
    } catch (error) {
        console.log("refresh access token error", error);
        next(error);
    }
}



/*
How OAuth 2.0 with Google works
1. User clicks Login with Google on frontend -> client redirects user to Google login page - FE
2. Google authenticates used - FE
3. Google returns a tokenId(OAuth + OpenID Connect) or authrzn code(traditional) to client - FE
4. Client sends token to backend
5. Backend verifies the token manually with Google
6. Backend gets user info from Google
7. Backend:
5.1. finds user in DB
5.2. or creates a new user
6. Backend issues JWT access + refresh tokens
7. Backend sets refresh token in cookie
8. User is logged in
*/
//Full Authoriztion code flow google sent authorzn code

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleOAuthLogin = async (req, res, next) => {
    try 
    {
        const { tokenId } = req.body;
        if(!tokenId)
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Token is required!");
        }
        const response = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = response.getPayload();
        const {email, name, sub:providerId} = payload;

        if(!email)
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, `This email has no Google account!`);
        }
        
        let user = await User.findOne({email});
        if(!user)
        {
            user = await User.create({
                name,
                email, 
                isEmailVerified: true,
                provider: "google",
                providerId
            });
        }
        if(user && user.provider && user.provider !== "google")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, "Email already registered!")
        }
        
        const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        // store refreh token in HTTP cookie only
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true, // Prevents JS from accessing cookie. Protects against XSS (Cross-Site Scripting) attacks.
            secure: true, // Cookie will only be sent over HTTPS. Won’t work on plain HTTP
            sameSite: "Strict", // Cookie is sent only when request originates from same site
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY_MS),
        });

        return ApiResponse(res, HTTP_STATUS.OK, 
            "User logged in successfully!",
            {
                name: user.name,
                email: user.email
            },
            { newAccessToken }   // send access token in authorization header
        );

    } catch (error) {
        console.log("Google OAuth login", error);
        next(error);
    }
}


