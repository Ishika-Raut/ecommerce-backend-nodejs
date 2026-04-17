export const forgetPasswordTemplate = (email, resetLink ) => {
    return `<div>
            <p>You are recieving this because your email: ${email} have requested for password reset.</p>
            <p>Please follow this link to reset your password: ${resetLink}</p>
            </div>`;
}