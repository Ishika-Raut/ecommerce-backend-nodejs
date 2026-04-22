import bcrypt from "bcrypt";
import crypto from "crypto";
import { User } from "../models/authModel.js";
import { ApiError } from "../utils/apiError.js";
import { HTTP_STATUS } from "../utils/httpStatusCodes.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Otp } from "../models/otpModel.js";
import { generateAccessAndRefreshTokens } from "../helpers/generateAccessAndRefreshTokens.js";
import { generateToken } from "../utils/generateToken.js";
import { OAuth2Client } from "google-auth-library";
import { sendEamil } from "../services/sendEmailService.js";
import { sendSms } from "../services/sendSmsService.js";
import { emailVerifyTemplate } from "../template/emailVerifyTemplate.js";
import { accountStatus } from "../configs/enums/authEnum.js";
import { forgetPasswordTemplate } from "../template/forgetPasswordTemplate.js";



export const register = async (req, res, next) =>   {
    try     
    {
        const { firstName, lastName, password } = req.body;
       
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            firstName, 
            lastName,
            password: hashedPassword,
        })

        return ApiResponse(res, HTTP_STATUS.CREATED, `User registered successfully!`,
            {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                _id: newUser._id
            }
        );
    } 
    catch (error) 
    {
        console.log("Register user error", error);
        next(error);
    }
}



export const sendOtp = async (req, res) => {
    try 
    {
        const { userId, email, phone, type } = req.body;

        const user = await User.findById(userId);
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user found!`);
        }

        if(user?.email && user?.phone)
        {
            if(user.accountStatus === accountStatus[1])
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, `User Already exist`);
            }
        }

        const existingOtp = await Otp.findOne({ userId, otpType: type });

        console.log("existingOtp = ", existingOtp);
        //Generate 4-digit otp
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        //hash otp
        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        //set expiry for otp - 5 minutes
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); 

        //Only ONE active OTP per user should exist at a time
        if (existingOtp) 
        {
            //Update Existing OTP
            existingOtp.otp = hashedOtp;
            existingOtp.otpExpiration = otpExpiration;
            existingOtp.otpType = type;
            await existingOtp.save();
        } 
        else 
        {
            //Create new OTP
            await Otp.create({
                userId,
                otp: hashedOtp,
                otpExpiration,
                otpType: type,
            });
        }

        if(type === "email")
        {
            if(!email)
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, `Please enter your email!`);
            }
            const html = emailVerifyTemplate(email, otp);
            await sendEamil(email, "User Email Verification", html);
            
            user.email = email;
            await user.save();
        }
        else if(type === "sms")
        {
            if(!phone)
            {
                return ApiError(res, HTTP_STATUS.BAD_REQUEST, `Please enter your phone number!`);
            }
            await sendSms(phone, otp);
            
            user.phone = phone;
            await user.save();
        }
         
        return ApiResponse(res, HTTP_STATUS.OK, `OTP sent successfully!`);
    } 
    catch (error) 
    {
        console.log("Send otp error", error);
        throw error;
    }
}



export const verifyOtp = async (req, res, next) => {
    try 
    {
        const { email, phone, otp, type } = req.body;
        let user;
        if(email)
        {
            //find user
            user = await User.findOne({email});
            if(!user){
                return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user registered with email: ${email}`);
            }
            await OTPVerify(user._id, otp, type, res)
            
            user.isEmailVerified = true;
            await user.save();
        }

        if(phone)
        {
            user = await User.findOne({phone});
            if(!user){
                return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user registered with phone number: ${phone}`);
            }
            await OTPVerify(user._id, otp, type, res)
            
            user.isPhoneVerified = true;
            await user.save();
        }
        if(user && user.isPhoneVerified && user.isEmailVerified)
        {
            user.accountStatus = accountStatus[1]
            await user.save();
        }
        return ApiResponse(res, HTTP_STATUS.OK, "OTP verified successfully");
    } 
    catch (error)
    {
        console.log("Verify otp error", error);
        next(error);
    }
}



export const OTPVerify = async (userId, otp, type, res) => {
    try 
    {
        //find otp for user
        const existOtp = await Otp.findOne({userId, otpType: type});
        console.log("existingOtp = ", existOtp);
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

        //delete otp after verify
        await Otp.deleteOne({ _id: existOtp._id });    
    } 
    catch (error) 
    {
        console.log("OTP Verify error", error);
        throw error;
    }
}



export const login = async (req, res, next) => {
    try 
    {
        const { email, password } = req.body;
        const user = await User.findOne({email});
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, `No user found!`);
        }
        if(!user.isEmailVerified)
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Your email is not verified!`);
        }
        if(user.provider === "google")
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Login with google account!`);
        }
        if(!user.isPhoneVerified)
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Your phone is not verified!`);
        }
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if(!isPasswordMatched)
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Invalid Password!");
        }

        const accessToken = generateToken({
            payload: {id: user._id, role: user.role, },
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

        return ApiResponse(res, HTTP_STATUS.OK, "User logged in successfully!",
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
1. User clicks Login with Google -> client redirects user to Google login page - FE
2. Google authenticates user - FE
3. Google returns a tokenId(OAuth + OpenID Connect) or authrzn code(traditional) to client - FE
4. Client sends token to backend
5. Backend verifies the tokenId manually with Google API verifyIdToken() - BE
6. Backend gets user info from tokenId (Google) - BE
7. Backend finds user in DB - BE
7.2. if user exists then make user login  - BE
7.2. if user does not exist then create a new user - register the user - BE
8. In both cases Backend issues JWT access + refresh tokens - BE
9. Backend sets refresh token in cookie and also stores it in db - BE
10. User is logged in
*/
//Full Authoriztion code flow google sent authorzn code

// OAuth2Client - This comes from Google’s official library
// Creating a Google OAuth client instance. 
// This client will be used to: verify Google tokens and talks securely with Google servers
// We pass CLIENT ID - So Google can verify: This token was issued for THIS app
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const googleOAuthLogin = async (req, res, next) => {
    try 
    {
        const { tokenId } = req.body;
        if(!tokenId)
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Token is required!");
        }
        // This sends your tokenId to Google (internally) and verifies it.
        // Google signs token using RS256 (private key)
        // Google SDK verifies - checks token signature, checks expiry, checks issuer (Google), checks audience (your app)
        // This method returns LoginTicket object after successful verification which contains verified payload (user data)
        console.log("tokenId = ", tokenId);
        const response = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        console.log("response = ", response);
        const payload = response.getPayload();  //Extracts actual user data from token
        const {email, name, sub:providerId} = payload;  //Take sub from payload and rename it as providerId

        if(!email)
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, `This email has no Google account!`);
        }
        
        let user = await User.findOne({email});
        // user - if user already exists in DB
        // user.provider - tells HOW user registered - "google", "github", "email", etc
        // user.provider !== "google" - User did NOT register using Google
        if(user && user.provider && user.provider !== "google")
        {
            return ApiError(res, HTTP_STATUS.CONFLICT, "Email already registered!")
        }
        
        if(!user)
        {
            user = await User.create({
                firstName: name,
                lastName: name,
                email, 
                isEmailVerified: true,
                provider: "google",
                providerId
            });
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
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            { newAccessToken }   // send access token in authorization header
        );

    } catch (error) {
        console.log("Google OAuth login", error);
        next(error);
    }
}


export const requestForPasswordReset = async (req, res, next) => {
    try 
    {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.NOT_FOUND, "No user registered with this email");
        }
        if(user.provider === "google")
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, `Login with google account!`);
        }
        // Prevent unverified users from resetting password
        if (!user.isEmailVerified || !user.isPhoneVerified) 
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Please verify your email and phone first.");
        }

        //Generate secure token
        //Generates 32 random bytes. Each byte is 8 bits --> 32 bytes
        //Why 32 bytes - Long enough to prevent brute force - secure and hard to guess
        //.toString("hex") - Converts those 32 bytes into hexadecimal string
        const resetToken = crypto.randomBytes(32).toString("hex");
        const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);  // 10 min

        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = hashedToken;
        user.passwordResetTokenExpiration = tokenExpiry;
        await user.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        console.log("Reset Link = ", resetLink);

        const html = forgetPasswordTemplate(email, resetLink);
        await sendEamil(email, "Request for password reset", html);

        return ApiResponse(res, HTTP_STATUS.OK, "Link sent on your email");
    } 
    catch (error) 
    {
        console.log("request for password reset error", error);
        next(error);
    }
}



export const resetPassword = async (req, res, next) => {
    try 
    {
        console.log("in reset pawd controller");
        const { token , newPassword, confirmPassword } = req.body;

        if (newPassword !== confirmPassword) 
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Passwords do not match");
        }
        const hashedIncomingToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedIncomingToken,
            passwordResetTokenExpiration: { $gt: new Date() }  //expired links won't work
        });
        if(!user)
        {
            return ApiError(res, HTTP_STATUS.BAD_REQUEST, "Invalid or expired token!");
        }
        if (!user.isEmailVerified) 
        {
            return ApiError(res, HTTP_STATUS.UNAUTHORIZED, "Your email is not verified.");
        }

        //password reset in the db
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        //invalidate reset token and its expiration in db
        user.passwordResetToken = null;
        user.passwordResetTokenExpiration = null;

        //Refresh tokens Must be invalidated immediately on password reset.
        //why ?
        //Prevents old refresh tokens from generating new access tokens.
        //Logs out the user from all devices/sessions.
        user.refreshToken = null;
        await user.save();

        return ApiResponse(res, HTTP_STATUS.OK, "Password reset successfully"); 

    } catch (error) {
        console.log("Reset password error", error);
        next(error);
    }
}