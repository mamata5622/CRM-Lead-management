const express = require("express")
const { register, login } = require("../controllers/authController")
const { forgotPassword, verifyResetOtp, resetPassword } = require("../controllers/passwordController")
const { forgotPasswordLimiter, verifyOtpLimiter, resetPasswordLimiter } = require("../middleware/passwordResetLimiter")
const authRoute = express.Router()

authRoute.post("/register", register)
authRoute.post("/login", login)
authRoute.post("/forgot-password",forgotPasswordLimiter, forgotPassword);
authRoute.post("/verify-reset-otp",verifyOtpLimiter,verifyResetOtp);
authRoute.post(
    "/reset-password",resetPasswordLimiter,
    resetPassword
);



module.exports = authRoute