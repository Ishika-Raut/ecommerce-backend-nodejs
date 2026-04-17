import twilio from "twilio"

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export const sendSms = async (phone, otp) => {
  try 
  {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
       from: process.env.TWILIO_PHONE_NUMBER,
       to: phone,
       body: `You are recieving this SMS to verify your phone number: ${phone}.
        Your OTP: ${otp}. 
        This OTP will be valid for 5 minutes.`,
     });

     console.log("SMS sent:", message.sid);
    return message;
  }
  catch (error) 
  {
    console.error("SMS Error:", error.message);
    throw error;
  }
}
