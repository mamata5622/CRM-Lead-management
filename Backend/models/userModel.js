
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    phone: {
      type: Number,
      trim: true,
      default: null,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    profileImage: {
      type: String,
      default: null,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "employee", "admin"],
      default: "user",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Admin-controlled employee permissions
    permissions: {
      leads: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        updateStatus: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      followUps: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        complete: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      pipeline: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      callLogs: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },

      communications: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    },

    // Email password reset
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    // SMS password reset OTP
    resetOtpHash: {
      type: String,
      select: false,
    },

    resetOtpExpires: {
      type: Date,
      select: false,
    },

    resetOtpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },

    resetOtpLockedUntil: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
