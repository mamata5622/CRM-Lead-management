
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// 1. Check whether the user is logged in
const isLoginUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Please login first",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message: "User not found or account is inactive",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Your session has expired. Please login again.",
      });
    }

    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid token. Please login again.",
    });
  }
};

// 2. Check whether the logged-in user is an admin
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin only.",
    });
  }

  next();
};

// 3. Check whether the logged-in user is an employee
const isEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  if (req.user.role !== "employee") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Employee only.",
    });
  }

  next();
};

module.exports = {
  isLoginUser,
  isAdmin,
  isEmployee,
};
