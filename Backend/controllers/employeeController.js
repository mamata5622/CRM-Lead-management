
const User = require("../models/userModel");

const getAuthenticatedUserId = (req) =>
  req.user?.id || req.user?._id || req.user?.userId;

const getEmployeeProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(userId).select(
      "name email phone profileImage role isActive"
    );

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get employee profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile.",
    });
  }
};

const updateEmployeeProfile = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { name, phone, profileImage } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 100 characters.",
      });
    }

    if (
      phone !== undefined &&
      phone !== null &&
      (typeof phone !== "string" || phone.trim().length > 20)
    ) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a string of at most 20 characters.",
      });
    }

    if (
      profileImage !== undefined &&
      profileImage !== null &&
      typeof profileImage !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Profile image must be a URL string.",
      });
    }

    const normalizedImage = String(profileImage || "").trim();

    if (normalizedImage) {
      let parsedUrl;

      try {
        parsedUrl = new URL(normalizedImage);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Enter a valid profile image URL.",
        });
      }

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return res.status(400).json({
          success: false,
          message: "Profile image URL must use HTTP or HTTPS.",
        });
      }
    }

    const user = await User.findById(userId);

    if (!user || user.isActive === false) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    user.name = name.trim();

    if (phone !== undefined) {
      user.phone = phone?.trim() || null;
    }

    if (profileImage !== undefined) {
      user.profileImage = normalizedImage || null;
    }

    await user.save();

    // Return only profile information, never the password or token.
    const safeUser = await User.findById(user._id).select(
      "name email phone profileImage role isActive"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update employee profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
};

module.exports = {
  getEmployeeProfile,
  updateEmployeeProfile,
};
    