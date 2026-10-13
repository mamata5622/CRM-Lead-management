
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

const getUserId = (req) => req.user?.id || req.user?._id;

// GET /api/admin/settings
const getAdminSettings = async (req, res) => {
  try {
    const userId = getUserId(req);

    const user = await User.findById(userId).select(
      "name email phone profileImage role isActive createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Settings fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Get admin settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin settings",
    });
  }
};

// PATCH /api/admin/settings
const updateAdminSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, email, phone } = req.body;

    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      updates.email = email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      updates.phone =
        typeof phone === "string" && phone.trim()
          ? phone.trim()
          : null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid profile fields provided",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    ).select("name email phone profileImage role isActive createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update admin settings error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// PATCH /api/admin/settings/password
const updateAdminPassword = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 8 characters",
      });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from the current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update admin password error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};

module.exports = {
  getAdminSettings,
  updateAdminSettings,
  updateAdminPassword,
};
