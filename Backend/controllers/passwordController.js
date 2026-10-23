
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const transporter = require("../config/mailer");
const { sendOtpSms } = require("../config/sms");

const EMAIL_TOKEN_TTL = 15 * 60 * 1000;
const OTP_TTL = 5 * 60 * 1000;
const OTP_RESET_TTL = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const genericResponse = {
  success: true,
  message:
    "If an account matches the details provided, recovery instructions will be sent.",
};

const hashValue = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

function normalizePhone(value) {
  let phone = String(value || "").trim().replace(/[\s()-]/g, "");

  if (/^\d{10}$/.test(phone)) {
    phone = `${process.env.DEFAULT_PHONE_COUNTRY_CODE || "+91"}${phone}`;
  } else if (/^91\d{10}$/.test(phone)) {
    phone = `+${phone}`;
  }

  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function phoneLookupVariants(phone) {
  if (/^\+91\d{10}$/.test(phone)) {
    return [phone, phone.slice(3)];
  }

  return [phone];
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

async function sendResetEmail(user, rawToken) {
  if (!process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not configured.");
  }

  const resetUrl =
    `${process.env.FRONTEND_URL.replace(/\/$/, "")}/reset-password/${rawToken}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: user.email,
    subject: "Reset your password",
    text: `Hello ${user.name || "there"},\n\nReset your password using this link within 15 minutes:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b">
        <h2>Reset your password</h2>
        <p>Hello ${escapeHtml(user.name || "there")},</p>
        <p>Use the link below within 15 minutes to reset your password.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:12px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px">
            Reset password
          </a>
        </p>
        <p>If you did not request this, ignore this email.</p>
      </div>
    `,
  });
}

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const method = String(req.body.method || "").toLowerCase();
    const identifier = String(req.body.identifier || "").trim();

    if (!["email", "phone"].includes(method) || !identifier) {
      return res.status(400).json({
        success: false,
        message: "Select email or phone and enter the required details.",
      });
    }

    let user;

    if (method === "email") {
      const email = identifier.toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email address.",
        });
      }

      user = await User.findOne({ email });
    } else {
      const phone = normalizePhone(identifier);

      if (!phone) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid mobile number.",
        });
      }

      user = await User.findOne({
        phone: { $in: phoneLookupVariants(phone) },
      });
    }

    // Do not reveal whether an account exists.
    if (!user || user.isActive === false) {
      return res.status(200).json(genericResponse);
    }

    if (method === "email") {
      const rawToken = crypto.randomBytes(32).toString("hex");

      user.resetPasswordToken = hashValue(rawToken);
      user.resetPasswordExpires = new Date(Date.now() + EMAIL_TOKEN_TTL);

      // Invalidate any outstanding SMS recovery challenge.
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      user.resetOtpLockedUntil = undefined;

      await user.save();

      try {
        await sendResetEmail(user, rawToken);
      } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        throw error;
      }
    } else {
      if (!user.phone) {
        return res.status(200).json(genericResponse);
      }

      const phone = normalizePhone(user.phone);

      if (!phone) {
        console.error("Stored user phone number is invalid.");
        return res.status(200).json(genericResponse);
      }

      const otp = crypto.randomInt(100000, 1000000).toString();

      user.resetOtpHash = hashValue(otp);
      user.resetOtpExpires = new Date(Date.now() + OTP_TTL);
      user.resetOtpAttempts = 0;
      user.resetOtpLockedUntil = undefined;

      // Invalidate an older email reset token.
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      try {
        await sendOtpSms(phone, otp);
      } catch (error) {
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = 0;
        await user.save();
        throw error;
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request right now. Please try again later.",
    });
  }
};

// POST /api/auth/verify-reset-otp
exports.verifyResetOtp = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();

    if (!phone || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number and six-digit OTP.",
      });
    }

    const user = await User.findOne({
      phone: { $in: phoneLookupVariants(phone) },
    }).select(
      "+resetOtpHash +resetOtpExpires +resetOtpAttempts +resetOtpLockedUntil"
    );

    const invalidMessage =
      "The verification code is invalid or expired. Request a new code.";

    if (!user || user.isActive === false || !user.resetOtpHash) {
      return res.status(400).json({
        success: false,
        message: invalidMessage,
      });
    }

    if (
      user.resetOtpLockedUntil &&
      user.resetOtpLockedUntil > new Date()
    ) {
      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Request a new code later.",
      });
    }

    if (!user.resetOtpExpires || user.resetOtpExpires <= new Date()) {
      user.resetOtpHash = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();

      return res.status(400).json({
        success: false,
        message: invalidMessage,
      });
    }

    const suppliedHash = Buffer.from(hashValue(otp), "hex");
    const storedHash = Buffer.from(user.resetOtpHash, "hex");

    const matches =
      suppliedHash.length === storedHash.length &&
      crypto.timingSafeEqual(suppliedHash, storedHash);

    if (!matches) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;

      if (user.resetOtpAttempts >= OTP_MAX_ATTEMPTS) {
        user.resetOtpLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        user.resetOtpHash = undefined;
        user.resetOtpExpires = undefined;
      }

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          user.resetOtpAttempts >= OTP_MAX_ATTEMPTS
            ? "Too many incorrect attempts. Request a new code later."
            : "The verification code is incorrect.",
      });
    }

    // Consume the OTP and issue a separate, expiring reset token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = hashValue(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + OTP_RESET_TTL);
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Phone number verified.",
      resetToken,
    });
  } catch (error) {
    console.error("Verify reset OTP error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify the code right now.",
    });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const token = String(req.body.token || req.body.resetToken || "");
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        success: false,
        message: "The reset authorization is invalid or expired.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 72 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be 8–72 characters and no more than 72 UTF-8 bytes.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: hashValue(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user || user.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "The reset authorization is invalid or expired.",
      });
    }

    // Hash exactly once, just as in your register controller.
    user.password = await bcrypt.hash(password, 12);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetOtpHash = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    user.resetOtpLockedUntil = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset your password right now. Please try again later.",
    });
  }
};
