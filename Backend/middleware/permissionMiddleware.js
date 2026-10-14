
const User = require("../models/userModel");

// Usage: requireLeadAccess("view"), requireLeadAccess("create"), etc.
const requireLeadAccess = (action = "view") => {
  const allowedActions = [
    "view",
    "create",
    "edit",
    "updateStatus",
    "delete",
  ];

  if (!allowedActions.includes(action)) {
    throw new Error(`Invalid lead permission action: ${action}`);
  }

  return async (req, res, next) => {
    try {
      const userId = req.user?._id || req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Please login first.",
        });
      }

      // Load current account and permissions from MongoDB.
      const user = await User.findById(userId)
        .select("role permissions.leads isActive");

      if (!user || user.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Account is inactive or unavailable.",
        });
      }

      // Admins have full lead access.
      if (String(user.role).toLowerCase() === "admin") {
        req.currentUser = user;
        return next();
      }

      if (user.permissions?.leads?.[action] !== true) {
        return res.status(403).json({
          success: false,
          code: "LEAD_PERMISSION_REQUIRED",
          message: `Your administrator has not granted Leads: ${action} permission.`,
        });
      }

      req.currentUser = user;
      return next();
    } catch (error) {
      console.error("Lead access verification error:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to verify lead permissions.",
      });
    }
  };
};

module.exports = { requireLeadAccess };
