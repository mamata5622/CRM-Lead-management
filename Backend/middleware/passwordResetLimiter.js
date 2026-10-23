
const rateLimit = require("express-rate-limit");

// Limit requests to send password reset emails or SMS OTPs
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password recovery requests. Please try again after 15 minutes.",
  },
});

// Limit SMS OTP verification attempts
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many OTP verification attempts. Please try again later.",
  },
});

// Limit password reset submissions
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many password reset attempts. Please try again later.",
  },
});

module.exports = {
  forgotPasswordLimiter,
  verifyOtpLimiter,
  resetPasswordLimiter,
};
