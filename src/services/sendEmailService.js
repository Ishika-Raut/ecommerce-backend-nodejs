import nodemailer from "nodemailer";

export const sendEamil = async (email, subject, html) => {
    try 
    {
        const transporter = nodemailer.createTransport({
            // if we write service then node autimatically knows port, host, security settings
            // service:process.env.SERVICE, //services like gmail, outlook, etc
            // if not then manually we need to provide them

            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD,
            },
        });
        console.log("email = ", email);
        const mailOptions = {
            from: `"support" <${process.env.SMTP_EMAIL}>`, //sender email - that will be shown to reciever
            to: email,
            subject,
            html
        }

        const info = await transporter.sendMail(mailOptions)

        console.log("Message sent: ", info.messageId);
        console.log("Preview: ", nodemailer.getTestMessageUrl(info));
    } 
    catch (error) 
    {
        console.log("Send email function error", error);
        throw error;
    }
}