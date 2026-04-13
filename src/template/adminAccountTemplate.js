export const adminAccountTemplate = (email, password) => {
  return `<div>
      <p>Your admin account has been created successfully.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please login and change your password immediately.</p>
    </div>`;
};